import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '../db';

export const registerAuthRoutes = (app: FastifyInstance) => {
  app.post('/auth/login', async (request, reply) => {
    const { employeeId, pin } = request.body as { employeeId?: string; pin?: string };
    if (!employeeId || !pin) {
      return reply.status(400).send({ message: 'Nieprawidłowe dane logowania' });
    }

    const user = await prisma.user.findUnique({ where: { employeeId } });
    if (!user || !user.active) {
      return reply.status(401).send({ message: 'Nieprawidłowe dane logowania' });
    }

    const ok = await bcrypt.compare(pin, user.pinHash);
    if (!ok) {
      return reply.status(401).send({ message: 'Nieprawidłowy PIN' });
    }

    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    const token = app.jwt.sign({
      sub: user.id,
      role: user.role,
      permissions,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const responseUser = {
      id: user.id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      permissions,
      email: user.email,
      phone: user.phone,
      active: user.active,
      createdAt: user.createdAt.toISOString(),
      lastLogin: new Date().toISOString(),
    };

    return reply.send({ user: responseUser, token });
  });

  app.post('/auth/logout', async (_request, reply) => {
    return reply.send({ success: true });
  });

  app.get('/auth/me', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.sub as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ message: 'Nie znaleziono użytkownika' });
    }
    return reply.send({
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
    });
  });

  app.post('/auth/refresh', { preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.sub as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ message: 'Nie znaleziono użytkownika' });
    }
    const permissions = Array.isArray(user.permissions) ? user.permissions : [];
    const token = app.jwt.sign({
      sub: user.id,
      role: user.role,
      permissions,
    });
    return reply.send({
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        permissions,
        email: user.email,
        phone: user.phone,
        active: user.active,
        createdAt: user.createdAt.toISOString(),
        lastLogin: user.lastLogin?.toISOString(),
      },
      token,
    });
  });
};
