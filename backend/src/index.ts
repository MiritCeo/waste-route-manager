import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import { registerAuthRoutes } from './routes/auth.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerDriverRoutes } from './routes/routes.js';
import { registerWasteContainerRoutes, seedWasteContainerDefinitionsIfEmpty } from './routes/wasteContainers.js';

const app = Fastify({ logger: true, bodyLimit: 50 * 1024 * 1024 });

await app.register(cors, {
  origin: true,
});

await app.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const jwtSecret = process.env.JWT_SECRET || 'change_me';
await app.register(jwt, { secret: jwtSecret });

app.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ message: 'Brak autoryzacji' });
  }
});

app.get('/api/health', async () => ({ status: 'ok' }));

app.register(async (instance) => {
  registerAuthRoutes(instance);
}, { prefix: '/api' });

app.register(async (instance) => {
  instance.addHook('preHandler', instance.authenticate);
  registerAdminRoutes(instance);
  registerWasteContainerRoutes(instance);
}, { prefix: '/api' });

app.register(async (instance) => {
  instance.addHook('preHandler', instance.authenticate);
  registerDriverRoutes(instance);
}, { prefix: '/api' });

const port = Number(process.env.PORT || 3000);

app.listen({ port, host: '0.0.0.0' })
  .then(async () => {
    app.log.info(`API listening on ${port}`);
    try {
      await seedWasteContainerDefinitionsIfEmpty();
    } catch (error) {
      app.log.warn({ error }, 'Waste container seed skipped');
    }
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
