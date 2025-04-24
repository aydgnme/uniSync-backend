import Fastify from 'fastify';
import authRoutes from '../routes/auth';

export function buildServer() {
  const app = Fastify({ logger: true });
  app.register(authRoutes);
  return app;
}
