import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import testRoutes from './test.routes';
import scheduleRoutes from './schedule.routes';
import courseGradeRoutes from './course-grade.routes';
import gridfsRoutes from './gridfs.routes';
import homeworkRoutes from './homework.routes';
import classroomRoutes from './classroom.routes';
import announcementRoutes from './announcement.routes';

export async function registerRoutes(fastify: FastifyInstance) {
  // Register all routes under /api prefix
  fastify.register(userRoutes, { prefix: '/api/users' });
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(testRoutes, { prefix: '/api/test' });
  fastify.register(scheduleRoutes, { prefix: '/api/schedule' });
  fastify.register(courseGradeRoutes, { prefix: '/api/course-grades' });
  fastify.register(gridfsRoutes, { prefix: '/api/files' });
  fastify.register(homeworkRoutes, { prefix: '/api/homework' });
  fastify.register(classroomRoutes, { prefix: '/api/classroom' });
  fastify.register(announcementRoutes, { prefix: '/api/announcements' });
}