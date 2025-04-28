import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { testRoutes } from './test.routes';
import { scheduleRoutes } from './schedule.routes';
import { FastifyInstance } from 'fastify';


export async function routes(fastify: FastifyInstance) {
  fastify.register(userRoutes, { prefix: '/users' });
  fastify.register(authRoutes, { prefix: '/auth' });
  fastify.register(scheduleRoutes, { prefix: '/schedules' });
}

export {
  authRoutes,
  userRoutes,
  testRoutes,
  scheduleRoutes
};