import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { buildWasteCategories, WasteType } from '../utils/waste.js';
import { DEFAULT_ISSUE_CONFIG } from '../utils/issueConfig.js';

export const registerDriverRoutes = (app: FastifyInstance) => {
  type RouteWithAddresses = Prisma.RouteGetPayload<{
    include: { routeAddresses: { include: { address: true } } };
  }>;

  const parseJsonValue = (value?: string) => {
    if (!value) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  };

  const mapDeclaredContainerToType = (name: string): WasteType | null => {
    const normalized = name.toLowerCase();
    let base:
      | 'mixed'
      | 'bio-green'
      | 'bio-kitchen'
      | 'paper'
      | 'plastic'
      | 'glass-clear'
      | 'glass-colored'
      | 'ash'
      | null = null;

    if (normalized.includes('resztkowe') || normalized.includes('zmiesz')) base = 'mixed';
    if (normalized.includes('bio')) {
      base = normalized.includes('kuchen') ? 'bio-kitchen' : 'bio-green';
    }
    if (normalized.includes('papier')) base = 'paper';
    if (normalized.includes('plastik') || normalized.includes('metal')) base = 'plastic';
    if (normalized.includes('szkło') || normalized.includes('szklo')) {
      base = normalized.includes('bezbarw') ? 'glass-clear' : 'glass-colored';
    }
    if (normalized.includes('popiół') || normalized.includes('popiol')) base = 'ash';

    if (!base) return null;

    const sizeMatch = normalized.match(/\b(\d{2,4})\s*l\b|\b(\d{2,4})l\b/);
    const sizeValue = sizeMatch?.[1] || sizeMatch?.[2];
    const size = sizeValue ? Number(sizeValue) : undefined;

    if (size === 1100) return `${base}-1100` as WasteType;
    if (size === 240) return `${base}-240` as WasteType;
    // Traktujemy 80L/120L jako 120L (bazowy typ)
    return base as WasteType;
  };

  const buildCompanyWaste = (declaredContainers?: unknown): WasteType[] => {
    let containers: unknown = declaredContainers;
    if (typeof containers === 'string') {
      try {
        containers = JSON.parse(containers);
      } catch {
        containers = [];
      }
    }
    if (!Array.isArray(containers)) return [];
    const types = new Set<WasteType>();
    containers.forEach((item: any) => {
      if (!item?.name) return;
      const mapped = mapDeclaredContainerToType(String(item.name));
      if (mapped) types.add(mapped);
    });
    return Array.from(types);
  };

  const buildWasteList = (address: any, storedWaste: any) => {
    const isCompany = Boolean(address?.notes?.includes('Typ: Firma') || address?.notes?.includes('Właściciel:'));
    if (isCompany) {
      const declared = buildCompanyWaste(address?.declaredContainers);
      if (declared.length > 0) {
        return buildWasteCategories(declared);
      }
    }
    return Array.isArray(storedWaste) ? storedWaste : buildWasteCategories(address?.wasteTypes as any);
  };

  const extractOwnerFromNotes = (notes?: string | null) => {
    if (!notes) return undefined;
    const line = notes.split('\n').find(item => item.startsWith('Właściciel:'));
    if (!line) return undefined;
    return line.replace('Właściciel:', '').trim() || undefined;
  };

  const startOfToday = (() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  })();

  const resetWasteList = (address: any, storedWaste: any) => {
    const baseWaste = buildWasteList(address, storedWaste);
    if (!Array.isArray(baseWaste)) return [];
    return baseWaste.map((item: any) => ({ ...item, count: 0 }));
  };

  const resetRouteIfNeeded = async (route: RouteWithAddresses): Promise<RouteWithAddresses> => {
    if (!route.date || route.date >= startOfToday) {
      return route;
    }

    const resetWasteByAddress = new Map(
      route.routeAddresses.map((item: any) => [
        item.id,
        resetWasteList(item.address, item.waste),
      ])
    );

    await prisma.$transaction([
      ...route.routeAddresses.map((item: any) =>
        prisma.routeAddress.update({
          where: { id: item.id },
          data: {
            isCollected: false,
            status: 'PENDING',
            waste: resetWasteByAddress.get(item.id) || [],
            issueReason: null,
            issueFlags: Prisma.JsonNull,
            issueNote: null,
            issuePhoto: null,
            issueReportedAt: null,
            issueReportedById: null,
            issueArchivedAt: null,
          },
        })
      ),
      prisma.route.update({
        where: { id: route.id },
        data: { collectedAddresses: 0, date: startOfToday },
      }),
    ]);

    return {
      ...route,
      date: startOfToday,
      collectedAddresses: 0,
      routeAddresses: route.routeAddresses.map((item: RouteWithAddresses['routeAddresses'][number]) => ({
        ...item,
        isCollected: false,
        status: 'PENDING',
        waste: resetWasteByAddress.get(item.id) || [],
        issueReason: null,
        issueFlags: null,
        issueNote: null,
        issuePhoto: null,
        issueReportedAt: null,
        issueReportedById: null,
        issueArchivedAt: null,
      })),
    };
  };

  app.get('/routes', { preHandler: [app.authenticate] }, async () => {
    const routes = await prisma.route.findMany({
      where: { publicationStatus: 'PUBLISHED' },
      include: {
        routeAddresses: {
          include: { address: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    const normalizedRoutes = await Promise.all(routes.map(resetRouteIfNeeded));

    return normalizedRoutes.map((route: RouteWithAddresses) => ({
      id: route.id,
      name: route.name,
      date: route.date?.toISOString().split('T')[0],
      updatedAt: route.updatedAt.toISOString(),
      totalAddresses: route.totalAddresses,
      collectedAddresses: route.collectedAddresses,
      addresses: route.routeAddresses.map((item: RouteWithAddresses['routeAddresses'][number]) => ({
        id: item.address.id,
        street: item.address.street,
        number: item.address.number,
        city: item.address.city,
        isCollected: item.isCollected,
        status: item.status,
        waste: buildWasteList(item.address, item.waste),
        issueReason: item.issueReason || undefined,
        issueFlags: (item.issueFlags as string[]) || [],
        issueNote: item.issueNote || undefined,
        issuePhoto: item.issuePhoto || undefined,
        issueReportedAt: item.issueReportedAt?.toISOString(),
        ownerName: extractOwnerFromNotes(item.address.notes),
      })),
    }));
  });

  app.get('/issues/config', { preHandler: [app.authenticate] }, async () => {
    const existing = await prisma.issueConfig.findFirst();
    if (!existing) {
      const created = await prisma.issueConfig.create({
        data: DEFAULT_ISSUE_CONFIG,
      });
      return {
        issueReasons: DEFAULT_ISSUE_CONFIG.issueReasons,
        deferredReasons: DEFAULT_ISSUE_CONFIG.deferredReasons,
        issueFlags: DEFAULT_ISSUE_CONFIG.issueFlags,
        updatedAt: created.updatedAt.toISOString(),
      };
    }

    return {
      issueReasons: existing.issueReasons || DEFAULT_ISSUE_CONFIG.issueReasons,
      deferredReasons: existing.deferredReasons || DEFAULT_ISSUE_CONFIG.deferredReasons,
      issueFlags: existing.issueFlags || DEFAULT_ISSUE_CONFIG.issueFlags,
      updatedAt: existing.updatedAt.toISOString(),
    };
  });

  app.get('/routes/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    let route = await prisma.route.findFirst({
      where: { id, publicationStatus: 'PUBLISHED' },
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

    route = await resetRouteIfNeeded(route as RouteWithAddresses);

    return {
      id: route.id,
      name: route.name,
      date: route.date?.toISOString().split('T')[0],
      updatedAt: route.updatedAt.toISOString(),
      totalAddresses: route.totalAddresses,
      collectedAddresses: route.collectedAddresses,
      addresses: route.routeAddresses.map((item: RouteWithAddresses['routeAddresses'][number]) => ({
        id: item.address.id,
        street: item.address.street,
        number: item.address.number,
        city: item.address.city,
        isCollected: item.isCollected,
        status: item.status,
        waste: buildWasteList(item.address, item.waste),
        issueReason: item.issueReason || undefined,
        issueFlags: (item.issueFlags as string[]) || [],
        issueNote: item.issueNote || undefined,
        issuePhoto: item.issuePhoto || undefined,
        issueReportedAt: item.issueReportedAt?.toISOString(),
        ownerName: extractOwnerFromNotes(item.address.notes),
      })),
    };
  });

  app.put('/routes/:routeId/addresses/:addressId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { routeId, addressId } = request.params as { routeId: string; addressId: string };
    let body: any = {};
    if (request.isMultipart && request.isMultipart()) {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === 'file') {
          if (part.fieldname === 'issuePhoto') {
            const buffer = await part.toBuffer();
            const mime = part.mimetype || 'application/octet-stream';
            body.issuePhoto = `data:${mime};base64,${buffer.toString('base64')}`;
          }
          continue;
        }
        body[part.fieldname] = part.value;
      }
      if (typeof body.waste === 'string') {
        body.waste = parseJsonValue(body.waste) ?? body.waste;
      }
      if (typeof body.issueFlags === 'string') {
        body.issueFlags = parseJsonValue(body.issueFlags) ?? body.issueFlags;
      }
    } else {
      body = request.body as any;
    }
    const status = body.status || 'COLLECTED';
    const isCollected = status === 'COLLECTED';
    const reporterId = (request.user as any)?.sub as string | undefined;
    const isIssueStatus = status === 'ISSUE' || status === 'DEFERRED';

    const routeAddress = await prisma.routeAddress.findFirst({
      where: { routeId, addressId },
    });
    if (!routeAddress) {
      return reply.status(404).send({ message: 'Nie znaleziono adresu w trasie' });
    }

    await prisma.routeAddress.update({
      where: { id: routeAddress.id },
      data: {
        waste: body.waste || routeAddress.waste,
        status,
        isCollected,
        issueReason: isIssueStatus ? (body.issueReason || null) : null,
        issueFlags: isIssueStatus ? (body.issueFlags || null) : null,
        issueNote: isIssueStatus ? (body.issueNote || null) : null,
        issuePhoto: isIssueStatus ? (body.issuePhoto || null) : null,
        issueReportedAt: isIssueStatus ? new Date() : null,
        issueReportedById: isIssueStatus ? reporterId || null : null,
        issueArchivedAt: isIssueStatus ? null : routeAddress.issueArchivedAt,
      },
    });

    const collectedCount = await prisma.routeAddress.count({
      where: { routeId, isCollected: true },
    });

    await prisma.route.update({
      where: { id: routeId },
      data: { collectedAddresses: collectedCount },
    });

    const address = await prisma.address.findUnique({ where: { id: addressId } });
    return {
      id: addressId,
      street: address?.street || '',
      number: address?.number || '',
      city: address?.city || '',
      isCollected,
      status,
      waste: body.waste || routeAddress.waste,
      issueReason: isIssueStatus ? body.issueReason : undefined,
      issueFlags: isIssueStatus ? (body.issueFlags || []) : [],
      issueNote: isIssueStatus ? body.issueNote : undefined,
      issuePhoto: isIssueStatus ? body.issuePhoto : undefined,
      issueReportedAt: isIssueStatus ? new Date().toISOString() : undefined,
    };
  });
};
