import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import testRoutes from './test.routes';
import scheduleRoutes from './schedule.routes';
import courseGradeRoutes from './course-grade.routes';
import gridfsRoutes from './gridfs.routes';
import homeworkRoutes from './homework.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // Register all routes under /api prefix
  fastify.register(async function (fastify) {
    fastify.register(userRoutes, { prefix: '/users' });
    fastify.register(authRoutes, { prefix: '/auth' });
    fastify.register(testRoutes, { prefix: '/test' });
    fastify.register(scheduleRoutes, { prefix: '/schedule' });
    fastify.register(courseGradeRoutes, { prefix: '/course-grades' });
    fastify.register(gridfsRoutes, { prefix: '/files' });
    fastify.register(homeworkRoutes, { prefix: '/homework' });
  }, { prefix: '/api' });
}

export {
  authRoutes,
  userRoutes,
  testRoutes,
  scheduleRoutes,
  courseGradeRoutes,
  gridfsRoutes,
  homeworkRoutes
};