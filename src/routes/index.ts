import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import scheduleRoutes from './schedule.routes';
import timeRoutes from './time.routes';
import courseGradeRoutes from './course-grade.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // Register all routes under /api prefix
  fastify.register(userRoutes, { prefix: '/api/users' });
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(scheduleRoutes, { prefix: '/api/schedule' });
  fastify.register(timeRoutes, { prefix: '/api/time' });
  fastify.register(courseGradeRoutes, { prefix: '/api/grades' });
}