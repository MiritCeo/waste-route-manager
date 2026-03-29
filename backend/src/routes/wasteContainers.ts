import { randomUUID } from 'crypto';
import { FastifyInstance } from 'fastify';
import { prisma } from '../db.js';
import { invalidateWasteDefinitionCache, WASTE_OPTIONS } from '../utils/waste.js';

export const registerWasteContainerRoutes = (app: FastifyInstance) => {
  app.get('/waste-containers', async () => {
    const rows = await prisma.wasteContainerDefinition.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      sortOrder: r.sortOrder,
    }));
  });

  app.get('/admin/waste-containers', async (request) => {
    const query = request.query as { includeInactive?: string };
    const includeInactive = query?.includeInactive === 'true';
    const rows = await prisma.wasteContainerDefinition.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      icon: r.icon,
      sortOrder: r.sortOrder,
      active: r.active,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  });

  app.post('/admin/waste-containers', async (request, reply) => {
    const body = request.body as { name?: string; icon?: string; sortOrder?: number };
    if (!body?.name?.trim()) {
      return reply.status(400).send({ message: 'Podaj nazwę pojemnika' });
    }
    const id = randomUUID();
    const row = await prisma.wasteContainerDefinition.create({
      data: {
        id,
        name: body.name.trim(),
        icon: body.icon?.trim() || '🗑️',
        sortOrder: body.sortOrder ?? 1000,
        active: true,
      },
    });
    invalidateWasteDefinitionCache();
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      sortOrder: row.sortOrder,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  app.put('/admin/waste-containers/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { name?: string; icon?: string; sortOrder?: number; active?: boolean };
    const existing = await prisma.wasteContainerDefinition.findUnique({ where: { id } });
    if (!existing) {
      return reply.status(404).send({ message: 'Nie znaleziono definicji pojemnika' });
    }
    const row = await prisma.wasteContainerDefinition.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name.trim() : existing.name,
        icon: body.icon !== undefined ? body.icon.trim() : existing.icon,
        sortOrder: body.sortOrder !== undefined ? body.sortOrder : existing.sortOrder,
        active: body.active !== undefined ? body.active : existing.active,
      },
    });
    invalidateWasteDefinitionCache();
    return {
      id: row.id,
      name: row.name,
      icon: row.icon,
      sortOrder: row.sortOrder,
      active: row.active,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
};

/** Wstawia domyślne typy z WASTE_OPTIONS (id = legacy slug), jeśli tabela jest pusta */
export const seedWasteContainerDefinitionsIfEmpty = async () => {
  const count = await prisma.wasteContainerDefinition.count();
  if (count > 0) return;
  let order = 0;
  for (const opt of WASTE_OPTIONS) {
    await prisma.wasteContainerDefinition.create({
      data: {
        id: opt.id,
        name: opt.name,
        icon: opt.icon,
        sortOrder: order++,
        active: true,
      },
    });
  }
};
