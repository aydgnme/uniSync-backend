import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { testRoutes } from './test.routes';
import { FastifyInstance } from 'fastify';

export async function routes(fastify: FastifyInstance) {
  fastify.register(userRoutes, { prefix: '/users' });
  fastify.register(authRoutes, { prefix: '/auth' });
}

export {
  authRoutes,
  userRoutes,
  testRoutes
};