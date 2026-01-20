import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { buildWasteCategories } from '../utils/waste';

export const registerDriverRoutes = (app: FastifyInstance) => {
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

    return routes.map(route => ({
      id: route.id,
      name: route.name,
      date: route.date?.toISOString().split('T')[0],
      updatedAt: route.updatedAt.toISOString(),
      totalAddresses: route.totalAddresses,
      collectedAddresses: route.collectedAddresses,
      addresses: route.routeAddresses.map(item => ({
        id: item.address.id,
        street: item.address.street,
        number: item.address.number,
        city: item.address.city,
        isCollected: item.isCollected,
        status: item.status,
        waste: Array.isArray(item.waste) ? item.waste : buildWasteCategories(item.address.wasteTypes as any),
        issueReason: item.issueReason || undefined,
        issueFlags: (item.issueFlags as string[]) || [],
        issueNote: item.issueNote || undefined,
        issuePhoto: item.issuePhoto || undefined,
        reportToAdmin: item.reportToAdmin,
      })),
    }));
  });

  app.get('/routes/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const route = await prisma.route.findFirst({
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

    return {
      id: route.id,
      name: route.name,
      date: route.date?.toISOString().split('T')[0],
      updatedAt: route.updatedAt.toISOString(),
      totalAddresses: route.totalAddresses,
      collectedAddresses: route.collectedAddresses,
      addresses: route.routeAddresses.map(item => ({
        id: item.address.id,
        street: item.address.street,
        number: item.address.number,
        city: item.address.city,
        isCollected: item.isCollected,
        status: item.status,
        waste: Array.isArray(item.waste) ? item.waste : buildWasteCategories(item.address.wasteTypes as any),
        issueReason: item.issueReason || undefined,
        issueFlags: (item.issueFlags as string[]) || [],
        issueNote: item.issueNote || undefined,
        issuePhoto: item.issuePhoto || undefined,
        reportToAdmin: item.reportToAdmin,
      })),
    };
  });

  app.put('/routes/:routeId/addresses/:addressId', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { routeId, addressId } = request.params as { routeId: string; addressId: string };
    const body = request.body as any;
    const status = body.status || 'COLLECTED';
    const isCollected = status === 'COLLECTED';

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
        issueReason: body.issueReason || null,
        issueFlags: body.issueFlags || null,
        issueNote: body.issueNote || null,
        issuePhoto: body.issuePhoto || null,
        reportToAdmin: body.reportToAdmin ?? routeAddress.reportToAdmin,
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
      issueReason: body.issueReason,
      issueFlags: body.issueFlags || [],
      issueNote: body.issueNote,
      issuePhoto: body.issuePhoto,
      reportToAdmin: body.reportToAdmin ?? routeAddress.reportToAdmin,
    };
  });
};
