import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { registerAuthRoutes } from './routes/auth.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerDriverRoutes } from './routes/routes.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
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
  registerAdminRoutes(instance);
  registerDriverRoutes(instance);
}, { prefix: '/api' });

const port = Number(process.env.PORT || 3000);

app.listen({ port, host: '0.0.0.0' })
  .then(() => {
    app.log.info(`API listening on ${port}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
