import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { Prisma } from '@prisma/client';
import { buildWasteCategories, WASTE_OPTIONS } from '../utils/waste.js';
import { DEFAULT_ISSUE_CONFIG } from '../utils/issueConfig.js';

const normalizeText = (value?: string) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const expandStreetAbbreviations = (value: string) =>
  value
    .replace(/\b(ul|ulica)\b/g, 'ulica')
    .replace(/\b(pl|plac)\b/g, 'plac')
    .replace(/\b(al|aleja|aleje)\b/g, 'aleja')
    .replace(/\b(os|osiedle)\b/g, 'osiedle');

const normalizeAddressSearch = (value?: string) => {
  if (!value) return '';
  const normalized = normalizeText(value);
  const withAbbrev = expandStreetAbbreviations(normalized);
  return withAbbrev
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
};

const tokenizeSearch = (value?: string) =>
  normalizeAddressSearch(value)
    .split(' ')
    .filter(Boolean);

const levenshtein = (a: string, b: string) => {
  if (a === b) return 0;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
};

const fuzzyTokenMatch = (token: string, haystackWords: string[]) => {
  if (token.length < 4) return false;
  const tolerance = token.length >= 7 ? 2 : 1;
  return haystackWords.some(word => levenshtein(token, word) <= tolerance);
};

const buildAddressKey = (data: {
  street: string;
  number: string;
  city: string;
  postalCode?: string | null;
}) =>
  [
    normalizeText(data.street),
    normalizeText(data.number),
    normalizeText(data.city),
    normalizeText(data.postalCode || ''),
  ].join('|');

const extractOwnerFromNotes = (notes?: string | null) => {
  if (!notes) return '';
  const line = notes.split('\n').find(item => item.startsWith('Właściciel:'));
  if (!line) return '';
  return line.replace('Właściciel:', '').toLowerCase().trim();
};

const isCompanyFromNotes = (notes?: string | null) =>
  Boolean(notes?.includes('Typ: Firma') || notes?.includes('Właściciel:'));

const hasDeclarationFromNotes = (notes?: string | null) =>
  Boolean(notes?.includes('Numer deklaracji:'));

const parseDateParam = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const endOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const parseAddressNumber = (value?: string) => {
  if (!value) return null;
  const match = value.trim().match(/^(\d+)/);
  if (!match) return null;
  return Number(match[1]);
};

const buildImportKey = (data: {
  street: string;
  number: string;
  city: string;
  postalCode?: string | null;
  notes?: string | null;
}) => {
  const baseKey = buildAddressKey(data);
  const owner = extractOwnerFromNotes(data.notes);
  return owner ? `${baseKey}::company::${owner}` : `${baseKey}::residential`;
};

export const registerAdminRoutes = (app: FastifyInstance) => {
  type CollectionLogRow = Prisma.CollectionLogGetPayload<{}>;

  app.get('/admin/addresses', async (request) => {
    const query = request.query as {
      search?: string;
      city?: string;
      wasteType?: string;
      wasteTypes?: string;
      street?: string;
      active?: string;
      composting?: string;
      unassigned?: string;
      routeCount?: string;
      declarationStatus?: string;
      dataStatus?: string;
      wasteGroups?: string;
      ownerType?: string;
      numberFrom?: string;
      numberTo?: string;
      createdFrom?: string;
      createdTo?: string;
      updatedFrom?: string;
      updatedTo?: string;
      importedFrom?: string;
      importedTo?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    const where: any = {};
    if (query.city) {
      where.city = query.city;
    }
    if (query.street) {
      where.street = query.street;
    }
    if (query.active !== undefined) {
      where.active = query.active === 'true';
    }
    if (query.composting) {
      if (query.composting === 'yes') {
        where.composting = 'Tak';
      } else if (query.composting === 'no') {
        where.composting = 'Nie';
      } else if (query.composting === 'unknown') {
        where.OR = [...(where.OR || []), { composting: null }, { composting: '' }];
      }
    }
    if (query.unassigned === 'true') {
      where.routeAddresses = { none: {} };
    }
    if (query.search) {
      // We'll apply advanced matching after fetch (normalization + fuzzy).
    }

    const createdFrom = parseDateParam(query.createdFrom);
    const createdTo = parseDateParam(query.createdTo);
    if (createdFrom || createdTo) {
      where.createdAt = {
        ...(createdFrom ? { gte: createdFrom } : {}),
        ...(createdTo ? { lte: endOfDay(createdTo) } : {}),
      };
    }

    const updatedFrom = parseDateParam(query.updatedFrom);
    const updatedTo = parseDateParam(query.updatedTo);
    if (updatedFrom || updatedTo) {
      where.updatedAt = {
        ...(updatedFrom ? { gte: updatedFrom } : {}),
        ...(updatedTo ? { lte: endOfDay(updatedTo) } : {}),
      };
    }

    const importedFrom = parseDateParam(query.importedFrom);
    const importedTo = parseDateParam(query.importedTo);
    if (importedFrom || importedTo) {
      where.importedAt = {
        ...(importedFrom ? { gte: importedFrom } : {}),
        ...(importedTo ? { lte: endOfDay(importedTo) } : {}),
      };
    }

    let addresses = await prisma.address.findMany({
      where,
      include: { _count: { select: { routeAddresses: true } } },
    });

    const wasteTypesParam = query.wasteTypes || query.wasteType;
    if (wasteTypesParam) {
      const wasteTypes = wasteTypesParam.split(',').map(item => item.trim()).filter(Boolean);
      if (wasteTypes.length > 0) {
        addresses = addresses.filter(address => {
          if (!Array.isArray(address.wasteTypes)) return false;
          const addressWaste = address.wasteTypes as string[];
          return wasteTypes.some(type => addressWaste.includes(type));
        });
      }
    }

    const wasteGroups = query.wasteGroups?.split(',').map(item => item.trim()).filter(Boolean) || [];
    if (wasteGroups.length > 0) {
      addresses = addresses.filter(address => {
        if (!Array.isArray(address.wasteTypes)) return false;
        const types = address.wasteTypes as string[];
        return wasteGroups.some(group => {
          if (group === 'bio') return types.some(type => type.startsWith('bio-'));
          if (group === 'glass') return types.some(type => type.startsWith('glass-'));
          if (group === 'ash') return types.includes('ash');
          if (group === 'mixed') return types.some(type => type.startsWith('mixed'));
          if (group === 'paper') return types.some(type => type.startsWith('paper'));
          if (group === 'plastic') return types.some(type => type.startsWith('plastic'));
          return false;
        });
      });
    }

    if (query.ownerType) {
      addresses = addresses.filter(address => {
        const isCompany = isCompanyFromNotes(address.notes);
        const owner = extractOwnerFromNotes(address.notes);
        if (query.ownerType === 'company_with_owner') return isCompany && Boolean(owner);
        if (query.ownerType === 'company_without_owner') return isCompany && !owner;
        if (query.ownerType === 'residential') return !isCompany;
        return true;
      });
    }

    if (query.declarationStatus) {
      const declarationStatus = query.declarationStatus;
      const addressKeyCounts = new Map<string, number>();
      addresses.forEach(address => {
        const baseKey = buildAddressKey({
          street: address.street,
          number: address.number,
          city: address.city,
          postalCode: address.postalCode,
        });
        addressKeyCounts.set(baseKey, (addressKeyCounts.get(baseKey) || 0) + 1);
      });
      addresses = addresses.filter(address => {
        const hasDeclaration = hasDeclarationFromNotes(address.notes);
        const baseKey = buildAddressKey({
          street: address.street,
          number: address.number,
          city: address.city,
          postalCode: address.postalCode,
        });
        const isMulti = (addressKeyCounts.get(baseKey) || 0) > 1;
        if (declarationStatus === 'with') return hasDeclaration;
        if (declarationStatus === 'without') return !hasDeclaration;
        if (declarationStatus === 'multi') return isMulti;
        return true;
      });
    }

    const dataStatus = query.dataStatus?.split(',').map(item => item.trim()).filter(Boolean) || [];
    if (dataStatus.length > 0) {
      addresses = addresses.filter(address => {
        const missingNumber = !address.number || address.number.trim().length === 0;
        const missingPostal = !address.postalCode || address.postalCode.trim().length === 0;
        const missingComposting = !address.composting || address.composting.trim().length === 0;
        const suspicious =
          !address.street || address.street.trim().length < 2 ||
          !address.city || address.city.trim().length < 2 ||
          missingNumber ||
          !/\d/.test(address.number || '');
        return dataStatus.some(status => {
          if (status === 'missing_number') return missingNumber;
          if (status === 'missing_postal') return missingPostal;
          if (status === 'missing_composting') return missingComposting;
          if (status === 'suspicious') return suspicious;
          return false;
        });
      });
    }

    if (query.routeCount !== undefined && query.routeCount !== '') {
      const expected = Number(query.routeCount);
      if (!Number.isNaN(expected)) {
        addresses = addresses.filter(address => address._count?.routeAddresses === expected);
      }
    }

    const numberFrom = query.numberFrom ? Number(query.numberFrom) : undefined;
    const numberTo = query.numberTo ? Number(query.numberTo) : undefined;
    if (numberFrom !== undefined || numberTo !== undefined) {
      addresses = addresses.filter(address => {
        const value = parseAddressNumber(address.number);
        if (value === null) return false;
        if (numberFrom !== undefined && value < numberFrom) return false;
        if (numberTo !== undefined && value > numberTo) return false;
        return true;
      });
    }

    if (query.search) {
      const tokens = tokenizeSearch(query.search);
      if (tokens.length > 0) {
        addresses = addresses.filter(address => {
          const addressLine = normalizeAddressSearch(
            `${address.city} ${address.street} ${address.number} ${address.postalCode || ''}`
          );
          const words = addressLine.split(' ').filter(Boolean);
          return tokens.every(token => {
            if (addressLine.includes(token)) return true;
            return fuzzyTokenMatch(token, words);
          });
        });
      }
    }

    const sortBy = query.sortBy || 'street';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    addresses.sort((a: any, b: any) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (aValue === undefined || bValue === undefined) return 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * sortOrder;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * sortOrder;
      }
      return String(aValue).localeCompare(String(bValue)) * sortOrder;
    });

    return addresses.map(address => ({
      id: address.id,
      street: address.street,
      number: address.number,
      city: address.city,
      postalCode: address.postalCode || undefined,
      notes: address.notes || undefined,
      wasteTypes: address.wasteTypes,
      declaredContainers: address.declaredContainers || undefined,
      composting: address.composting || undefined,
      active: address.active,
      createdAt: address.createdAt.toISOString(),
    }));
  });

  app.get('/admin/addresses/:id/stats', async (request, reply) => {
    const { id } = request.params as { id: string };
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address) {
      return reply.status(404).send({ message: 'Nie znaleziono adresu' });
    }

    const logs = await prisma.collectionLog.findMany({
      where: { addressId: id },
    });

    const initByType = () => Object.fromEntries(WASTE_OPTIONS.map(option => [option.id, 0]));
    const totalsByType: Record<string, number> = initByType();
    const dailyMap = new Map<string, { date: string; totalWaste: number; collectedAddresses: number; byType: Record<string, number> }>();
    const monthlyMap = new Map<string, { month: string; totalWaste: number; collectedAddresses: number; byType: Record<string, number> }>();
    let totalCollections = 0;
    let totalWaste = 0;

    const dailyAddressMap = new Map<string, Set<string>>();
    const monthlyAddressMap = new Map<string, Set<string>>();

    logs.forEach((item: CollectionLogRow) => {
      const collectedAt = item.collectedAt;
      const dateKey = collectedAt.toISOString().split('T')[0];
      const monthKey = dateKey.slice(0, 7);

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          totalWaste: 0,
          collectedAddresses: 0,
          byType: initByType(),
        });
      }
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          totalWaste: 0,
          collectedAddresses: 0,
          byType: initByType(),
        });
      }

      const wasteList = Array.isArray(item.waste) ? item.waste : [];
      let entryTotal = 0;
      wasteList.forEach((waste: any) => {
        const id = waste?.id;
        const count = Number(waste?.count || 0);
        if (!id) return;
        totalsByType[id] = (totalsByType[id] || 0) + count;
        dailyMap.get(dateKey)!.byType[id] = (dailyMap.get(dateKey)!.byType[id] || 0) + count;
        monthlyMap.get(monthKey)!.byType[id] = (monthlyMap.get(monthKey)!.byType[id] || 0) + count;
        entryTotal += count;
      });

      totalCollections += 1;
      totalWaste += entryTotal;
      dailyMap.get(dateKey)!.totalWaste += entryTotal;
      if (!dailyAddressMap.has(dateKey)) {
        dailyAddressMap.set(dateKey, new Set());
      }
      dailyAddressMap.get(dateKey)!.add(item.addressId);
      monthlyMap.get(monthKey)!.totalWaste += entryTotal;
      if (!monthlyAddressMap.has(monthKey)) {
        monthlyAddressMap.set(monthKey, new Set());
      }
      monthlyAddressMap.get(monthKey)!.add(item.addressId);
    });

    dailyMap.forEach((value, key) => {
      value.collectedAddresses = dailyAddressMap.get(key)?.size || 0;
    });
    monthlyMap.forEach((value, key) => {
      value.collectedAddresses = monthlyAddressMap.get(key)?.size || 0;
    });

    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    return {
      address: {
        id: address.id,
        street: address.street,
        number: address.number,
        city: address.city,
        postalCode: address.postalCode || undefined,
        notes: address.notes || undefined,
        composting: address.composting || undefined,
        active: address.active,
      },
      totals: {
        totalCollections,
        totalWaste,
        byType: totalsByType,
      },
      daily,
      monthly,
    };
  });

  app.get('/admin/addresses/stats-summary', async () => {
    const initByType = () => Object.fromEntries(WASTE_OPTIONS.map(option => [option.id, 0]));
    const addresses = await prisma.address.findMany();
    const summaryMap = new Map(
      addresses.map(address => [
        address.id,
        {
          addressId: address.id,
          street: address.street,
          number: address.number,
          city: address.city,
          postalCode: address.postalCode || undefined,
          totalWaste: 0,
          byType: initByType(),
        },
      ])
    );

    const collected = await prisma.collectionLog.findMany();

    collected.forEach((item: CollectionLogRow) => {
      const entry = summaryMap.get(item.addressId);
      if (!entry) return;
      const wasteList = Array.isArray(item.waste) ? item.waste : [];
      wasteList.forEach((waste: any) => {
        const id = waste?.id;
        const count = Number(waste?.count || 0);
        if (!id) return;
        entry.byType[id] = (entry.byType[id] || 0) + count;
        entry.totalWaste += count;
      });
    });

    return Array.from(summaryMap.values()).sort((a, b) => {
      const cityDiff = a.city.localeCompare(b.city);
      if (cityDiff !== 0) return cityDiff;
      const streetDiff = a.street.localeCompare(b.street);
      if (streetDiff !== 0) return streetDiff;
      return a.number.localeCompare(b.number);
    });
  });

  app.post('/admin/addresses', async (request, reply) => {
    const body = request.body as any;
    if (!body?.street || !body?.number || !body?.city || !body?.wasteTypes) {
      return reply.status(400).send({ message: 'Brak wymaganych danych' });
    }
    const address = await prisma.address.create({
      data: {
        street: body.street,
        number: body.number,
        city: body.city,
        postalCode: body.postalCode || null,
        notes: body.notes || null,
        wasteTypes: body.wasteTypes,
        declaredContainers: body.declaredContainers || null,
        composting: body.composting || null,
        active: body.active ?? true,
      },
    });
    return {
      id: address.id,
      street: address.street,
      number: address.number,
      city: address.city,
      postalCode: address.postalCode || undefined,
      notes: address.notes || undefined,
      wasteTypes: address.wasteTypes,
      declaredContainers: address.declaredContainers || undefined,
      composting: address.composting || undefined,
      active: address.active,
      createdAt: address.createdAt.toISOString(),
    };
  });

  app.put('/admin/addresses/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address) {
      return reply.status(404).send({ message: 'Nie znaleziono adresu' });
    }
    const updated = await prisma.address.update({
      where: { id },
      data: {
        street: body.street ?? address.street,
        number: body.number ?? address.number,
        city: body.city ?? address.city,
        postalCode: body.postalCode ?? address.postalCode,
        notes: body.notes ?? address.notes,
        wasteTypes: body.wasteTypes ?? address.wasteTypes,
        declaredContainers: body.declaredContainers ?? address.declaredContainers,
        composting: body.composting ?? address.composting,
        active: typeof body.active === 'boolean' ? body.active : address.active,
      },
    });
    return {
      id: updated.id,
      street: updated.street,
      number: updated.number,
      city: updated.city,
      postalCode: updated.postalCode || undefined,
      notes: updated.notes || undefined,
      wasteTypes: updated.wasteTypes,
      declaredContainers: updated.declaredContainers || undefined,
      composting: updated.composting || undefined,
      active: updated.active,
      createdAt: updated.createdAt.toISOString(),
    };
  });

  app.delete('/admin/addresses/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.routeAddress.deleteMany({ where: { addressId: id } });
    await prisma.address.delete({ where: { id } });
    return reply.send({ success: true });
  });

  app.delete('/admin/addresses', async (_request, reply) => {
    await prisma.routeAddress.deleteMany();
    await prisma.address.deleteMany();
    await prisma.route.deleteMany();
    return reply.send({ success: true });
  });

  app.post('/admin/addresses/import', async (request) => {
    const body = request.body as { addresses?: any[] };
    const items = body.addresses || [];
    const existing = await prisma.address.findMany();
    const existingByKey = new Map(
      existing.map(address => [
        buildImportKey({
          street: address.street,
          number: address.number,
          city: address.city,
          postalCode: address.postalCode,
          notes: address.notes,
        }),
        address,
      ])
    );

    let created = 0;
    let updated = 0;

    const importedAt = new Date();
    for (const item of items) {
      const key = buildImportKey({
        street: item.street,
        number: item.number,
        city: item.city,
        postalCode: item.postalCode,
        notes: item.notes,
      });
      const existingAddress = existingByKey.get(key);
      if (existingAddress) {
        await prisma.address.update({
          where: { id: existingAddress.id },
          data: {
            street: item.street,
            number: item.number,
            city: item.city,
            postalCode: item.postalCode || null,
            notes: item.notes || null,
            wasteTypes: item.wasteTypes || [],
            declaredContainers: item.declaredContainers || null,
            composting: item.composting || null,
            active: item.active ?? true,
            importedAt,
          },
        });
        updated += 1;
        continue;
      }
      await prisma.address.create({
        data: {
          street: item.street,
          number: item.number,
          city: item.city,
          postalCode: item.postalCode || null,
          notes: item.notes || null,
          wasteTypes: item.wasteTypes || [],
          declaredContainers: item.declaredContainers || null,
          composting: item.composting || null,
          active: item.active ?? true,
          importedAt,
        },
      });
      created += 1;
    }

    return {
      created,
      updated,
      skippedExisting: 0,
      totalProcessed: items.length,
    };
  });

  app.get('/admin/routes', async (request) => {
    const query = request.query as {
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: string;
    };
    let routes = await prisma.route.findMany({
      include: { routeAddresses: true },
    });

    if (query.search) {
      const search = query.search.toLowerCase();
      routes = routes.filter(route => route.name.toLowerCase().includes(search));
    }

    if (query.status === 'draft') {
      routes = routes.filter(route => route.publicationStatus === 'DRAFT');
    } else if (query.status === 'completed') {
      routes = routes.filter(
        route =>
          route.publicationStatus !== 'DRAFT' &&
          route.collectedAddresses === route.totalAddresses
      );
    } else if (query.status === 'active') {
      routes = routes.filter(
        route =>
          route.publicationStatus !== 'DRAFT' &&
          route.collectedAddresses < route.totalAddresses
      );
    }

    const sortBy = query.sortBy || 'name';
    const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
    routes.sort((a: any, b: any) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (aValue === undefined || bValue === undefined) return 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * sortOrder;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * sortOrder;
      }
      return String(aValue).localeCompare(String(bValue)) * sortOrder;
    });

    return routes.map(route => ({
      id: route.id,
      name: route.name,
      date: route.date?.toISOString().split('T')[0],
      updatedAt: route.updatedAt.toISOString(),
      totalAddresses: route.totalAddresses,
      collectedAddresses: route.collectedAddresses,
      addressIds: route.routeAddresses
        .sort((a, b) => a.position - b.position)
        .map(item => item.addressId),
      assignedDriverId: route.assignedDriverId || undefined,
      publicationStatus: route.publicationStatus as 'DRAFT' | 'PUBLISHED',
      addresses: [],
    }));
  });

  app.post('/admin/routes', async (request, reply) => {
    const body = request.body as any;
    if (!body?.name || !Array.isArray(body.addressIds)) {
      return reply.status(400).send({ message: 'Brak wymaganych danych' });
    }

    const addresses = await prisma.address.findMany({
      where: { id: { in: body.addressIds } },
    });

    const route = await prisma.route.create({
      data: {
        name: body.name,
        date: new Date(),
        publicationStatus: body.publicationStatus ?? 'DRAFT',
        totalAddresses: addresses.length,
        collectedAddresses: 0,
        assignedDriverId: body.assignedDriverId || null,
        routeAddresses: {
          create: body.addressIds.map((addressId: string, index: number) => {
            const address = addresses.find(item => item.id === addressId);
            const wasteTypes = (address?.wasteTypes || []) as string[];
            return {
              addressId,
              position: index,
              waste: buildWasteCategories(wasteTypes as any),
            };
          }),
        },
      },
      include: { routeAddresses: true },
    });

    return {
      id: route.id,
      name: route.name,
      date: route.date?.toISOString().split('T')[0],
      updatedAt: route.updatedAt.toISOString(),
      totalAddresses: route.totalAddresses,
      collectedAddresses: route.collectedAddresses,
      addressIds: route.routeAddresses
        .sort((a, b) => a.position - b.position)
        .map(item => item.addressId),
      assignedDriverId: route.assignedDriverId || undefined,
      publicationStatus: route.publicationStatus as 'DRAFT' | 'PUBLISHED',
      addresses: [],
    };
  });

  app.put('/admin/routes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) {
      return reply.status(404).send({ message: 'Nie znaleziono trasy' });
    }

    let updatedRoute = route;

    if (Array.isArray(body.addressIds)) {
      await prisma.routeAddress.deleteMany({ where: { routeId: id } });
      const addresses = await prisma.address.findMany({
        where: { id: { in: body.addressIds } },
      });
      await prisma.routeAddress.createMany({
        data: body.addressIds.map((addressId: string, index: number) => {
          const address = addresses.find(item => item.id === addressId);
          const wasteTypes = (address?.wasteTypes || []) as string[];
          return {
            routeId: id,
            addressId,
            position: index,
            waste: buildWasteCategories(wasteTypes as any),
          };
        }),
      });
      updatedRoute = await prisma.route.update({
        where: { id },
        data: {
          totalAddresses: body.addressIds.length,
          collectedAddresses: 0,
        },
      });
    }

    updatedRoute = await prisma.route.update({
      where: { id },
      data: {
        name: body.name ?? updatedRoute.name,
        publicationStatus: body.publicationStatus ?? updatedRoute.publicationStatus,
        assignedDriverId: body.assignedDriverId ?? updatedRoute.assignedDriverId,
      },
    });

    const routeAddresses = await prisma.routeAddress.findMany({
      where: { routeId: id },
      orderBy: { position: 'asc' },
    });

    return {
      id: updatedRoute.id,
      name: updatedRoute.name,
      date: updatedRoute.date?.toISOString().split('T')[0],
      updatedAt: updatedRoute.updatedAt.toISOString(),
      totalAddresses: updatedRoute.totalAddresses,
      collectedAddresses: updatedRoute.collectedAddresses,
      addressIds: routeAddresses.map(item => item.addressId),
      assignedDriverId: updatedRoute.assignedDriverId || undefined,
      publicationStatus: updatedRoute.publicationStatus as 'DRAFT' | 'PUBLISHED',
      addresses: [],
    };
  });

  app.delete('/admin/routes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await prisma.routeAddress.deleteMany({ where: { routeId: id } });
    await prisma.route.delete({ where: { id } });
    return reply.send({ success: true });
  });

  app.post('/admin/routes/:id/publish', async (request, reply) => {
    const { id } = request.params as { id: string };
    const route = await prisma.route.update({
      where: { id },
      data: { publicationStatus: 'PUBLISHED' },
    });
    return {
      id: route.id,
      name: route.name,
      date: route.date?.toISOString().split('T')[0],
      updatedAt: route.updatedAt.toISOString(),
      totalAddresses: route.totalAddresses,
      collectedAddresses: route.collectedAddresses,
      addressIds: [],
      assignedDriverId: route.assignedDriverId || undefined,
      publicationStatus: route.publicationStatus as 'DRAFT' | 'PUBLISHED',
      addresses: [],
    };
  });

  app.post('/admin/routes/:id/reset', async (request, reply) => {
    const { id } = request.params as { id: string };

    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        routeAddresses: {
          include: { address: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!route) {
      return reply.status(404).send({ message: 'Nie znaleziono trasy' });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const resetWaste = (address: any, storedWaste: any) => {
      const baseWaste = buildWasteCategories(address?.wasteTypes as any);
      const source = Array.isArray(storedWaste) && storedWaste.length > 0 ? storedWaste : baseWaste;
      return source.map((item: any) => ({ ...item, count: 0 }));
    };

    const resetData = {
      isCollected: false,
      status: 'PENDING',
      waste: undefined as any,
      issueReason: null,
      issueFlags: Prisma.JsonNull,
      issueNote: null,
      issuePhoto: null,
      issueReportedAt: null,
      issueReportedById: null,
      issueArchivedAt: null,
    } as Prisma.RouteAddressUpdateInput;

    await prisma.$transaction([
      ...route.routeAddresses.map(item =>
        prisma.routeAddress.update({
          where: { id: item.id },
          data: { ...resetData, waste: resetWaste(item.address, item.waste) },
        })
      ),
      prisma.route.update({
        where: { id: route.id },
        data: { collectedAddresses: 0, date: startOfToday },
      }),
    ]);

    return {
      id: route.id,
      name: route.name,
      date: startOfToday.toISOString().split('T')[0],
      updatedAt: route.updatedAt.toISOString(),
      totalAddresses: route.totalAddresses,
      collectedAddresses: 0,
      addressIds: route.routeAddresses.map(item => item.addressId),
      assignedDriverId: route.assignedDriverId || undefined,
      publicationStatus: route.publicationStatus as 'DRAFT' | 'PUBLISHED',
      addresses: [],
    };
  });

  app.get('/admin/dashboard', async () => {
    const routes = await prisma.route.findMany();
    const publishedRoutes = routes.filter(route => route.publicationStatus !== 'DRAFT');
    const totalRoutes = publishedRoutes.length;
    const activeRoutes = publishedRoutes.filter(r => r.collectedAddresses < r.totalAddresses).length;
    const completedRoutes = publishedRoutes.filter(r => r.collectedAddresses === r.totalAddresses).length;
    const totalAddresses = publishedRoutes.reduce((sum, r) => sum + r.totalAddresses, 0);
    const collectedAddresses = publishedRoutes.reduce((sum, r) => sum + r.collectedAddresses, 0);

    const addressRows = await prisma.address.findMany({ select: { notes: true } });
    const addressBookTotal = addressRows.length;
    const companyAddresses = addressRows.filter(row => extractOwnerFromNotes(row.notes)).length;
    const residentialAddresses = addressBookTotal - companyAddresses;

    const totalEmployees = await prisma.user.count();
    const activeEmployees = await prisma.user.count({ where: { active: true } });

    return {
      totalRoutes,
      activeRoutes,
      completedRoutes,
      totalAddresses,
      collectedAddresses,
      pendingAddresses: totalAddresses - collectedAddresses,
      totalEmployees,
      activeEmployees,
      addressBookTotal,
      companyAddresses,
      residentialAddresses,
      wasteCollected: [],
      recentActivity: [],
    };
  });

  app.get('/admin/statistics', async (request) => {
    const query = request.query as { startDate: string; endDate: string };
    return {
      period: { start: query.startDate, end: query.endDate },
      routes: { total: 0, completed: 0, completionRate: 0 },
      addresses: { total: 0, collected: 0, collectionRate: 0 },
      waste: { byType: [], total: 0, averagePerAddress: 0 },
      employees: { performance: [] },
      trends: { daily: [] },
    };
  });

  app.get('/admin/issues', async (request) => {
    const query = request.query as { status?: string; archived?: string };
    const issues: any[] = await prisma.routeAddress.findMany({
      where: {
        status: query.status ? query.status : { in: ['ISSUE', 'DEFERRED'] },
        issueArchivedAt: query.archived === 'true' ? { not: null } : null,
      },
      include: {
        route: true,
        address: true,
        issueReportedBy: true,
      },
    } as any);
    return issues.map(item => ({
      id: `${item.routeId}-${item.addressId}`,
      routeId: item.routeId,
      routeName: item.route.name,
      addressId: item.addressId,
      street: item.address.street,
      number: item.address.number,
      city: item.address.city,
      status: item.status,
      issueReason: item.issueReason,
      issueFlags: item.issueFlags || [],
      issueNote: item.issueNote,
      issuePhoto: item.issuePhoto,
      issueReportedAt: item.issueReportedAt?.toISOString(),
      issueReportedBy: item.issueReportedBy
        ? {
            id: item.issueReportedBy.id,
            employeeId: item.issueReportedBy.employeeId,
            name: item.issueReportedBy.name,
          }
        : undefined,
      issueArchivedAt: item.issueArchivedAt?.toISOString(),
      createdAt: item.route.date?.toISOString() || new Date().toISOString(),
    }));
  });

  app.patch('/admin/issues/:routeId/:addressId/archive', async (request, reply) => {
    const { routeId, addressId } = request.params as { routeId: string; addressId: string };
    const issue: any = await prisma.routeAddress.findFirst({
      where: { routeId, addressId },
    } as any);
    if (!issue) {
      return reply.status(404).send({ message: 'Nie znaleziono zgłoszenia' });
    }
    const updated: any = await prisma.routeAddress.update({
      where: { id: issue.id },
      data: { issueArchivedAt: new Date() },
    } as any);
    return {
      routeId,
      addressId,
      issueArchivedAt: updated.issueArchivedAt?.toISOString(),
    };
  });

  app.put('/admin/issues/config', async (request) => {
    const body = request.body as any;
    const issueReasons = Array.isArray(body?.issueReasons) ? body.issueReasons : [];
    const deferredReasons = Array.isArray(body?.deferredReasons) ? body.deferredReasons : [];
    const issueFlags = Array.isArray(body?.issueFlags) ? body.issueFlags : [];

    const existing = await prisma.issueConfig.findFirst();
    const data = {
      issueReasons,
      deferredReasons,
      issueFlags,
    };

    const saved = existing
      ? await prisma.issueConfig.update({ where: { id: existing.id }, data })
      : await prisma.issueConfig.create({ data: { ...DEFAULT_ISSUE_CONFIG, ...data } });

    return {
      issueReasons: saved.issueReasons || issueReasons,
      deferredReasons: saved.deferredReasons || deferredReasons,
      issueFlags: saved.issueFlags || issueFlags,
      updatedAt: saved.updatedAt.toISOString(),
    };
  });

  app.get('/admin/daily-stats', async (request) => {
    const query = request.query as { month: string; wasteType?: string };
    const [year, month] = query.month.split('-').map(Number);
    const monthStart = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const logs = await prisma.collectionLog.findMany({
      where: {
        collectedAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
    });

    const byDate: Record<string, any> = {};
    const addressSets: Record<string, Set<string>> = {};
    logs.forEach((item: CollectionLogRow) => {
      const date = item.collectedAt.toISOString().split('T')[0];
      if (!byDate[date]) {
        byDate[date] = {
          date,
          totalWaste: 0,
          collectedAddresses: 0,
          byType: Object.fromEntries(WASTE_OPTIONS.map(option => [option.id, 0])),
        };
        addressSets[date] = new Set();
      }
      const waste = Array.isArray(item.waste) ? item.waste : [];
      waste.forEach((entry: any) => {
        if (query.wasteType && entry.id !== query.wasteType) return;
        const count = entry.count || 0;
        byDate[date].totalWaste += count;
        byDate[date].byType[entry.id] = (byDate[date].byType[entry.id] || 0) + count;
      });
      addressSets[date].add(item.addressId);
    });

    Object.keys(byDate).forEach(date => {
      byDate[date].collectedAddresses = addressSets[date]?.size || 0;
    });

    return Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
  });

  app.get('/admin/employees', async (request) => {
    const query = request.query as { search?: string; role?: string; active?: string };
    let users = await prisma.user.findMany();
    if (query.search) {
      const search = query.search.toLowerCase();
      users = users.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.employeeId.includes(search) ||
        user.email?.toLowerCase().includes(search)
      );
    }
    if (query.role) {
      users = users.filter(user => user.role === query.role);
    }
    if (query.active !== undefined) {
      users = users.filter(user => user.active === (query.active === 'true'));
    }
    return users.map(user => ({
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      email: user.email,
      phone: user.phone,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
    }));
  });

  app.post('/admin/employees', async (request, reply) => {
    const body = request.body as any;
    if (!body?.employeeId || !body?.name || !body?.role) {
      return reply.status(400).send({ message: 'Brak wymaganych danych' });
    }
    const pin = body.pin || body.employeeId;
    const pinHash = await bcrypt.hash(pin, 10);
    const user = await prisma.user.create({
      data: {
        employeeId: body.employeeId,
        name: body.name,
        role: body.role,
        permissions: body.permissions || [],
        pinHash,
        email: body.email || null,
        phone: body.phone || null,
        active: body.active ?? true,
      },
    });
    return {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      email: user.email,
      phone: user.phone,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
    };
  });

  app.put('/admin/employees/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;
    const data: any = {
      name: body.name,
      role: body.role,
      permissions: body.permissions,
      email: body.email,
      phone: body.phone,
      active: body.active,
    };
    if (body.pin) {
      data.pinHash = await bcrypt.hash(body.pin, 10);
    }
    const user = await prisma.user.update({ where: { id }, data });
    return {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      email: user.email,
      phone: user.phone,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
    };
  });

  app.delete('/admin/employees/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ message: 'Nie znaleziono użytkownika' });
    }
    if (user.role === 'ADMIN') {
      const adminsCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminsCount <= 1) {
        return reply.status(400).send({ message: 'Nie można usunąć ostatniego administratora' });
      }
    }
    await prisma.user.delete({ where: { id } });
    return reply.send({ success: true });
  });
};
