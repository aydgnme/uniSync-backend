import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';

export function buildServer() {
  const app = Fastify({ logger: true });
  
  // Register JWT plugin
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    sign: {
      expiresIn: '1d'
    }
  });
  return app;
}
