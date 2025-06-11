// src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { authJWT } from '../middlewares/auth.jwt.middleware';
import { logger } from '../utils/logger';

export default async function authRoutes(fastify: FastifyInstance) {
  const authController = new AuthController(fastify);

  // Public routes
  fastify.post('/login', authController.login.bind(authController));
  fastify.post('/register', authController.register.bind(authController));
  fastify.post('/check-user', authController.checkUser.bind(authController));

  // Protected routes
  fastify.get('/validate', {
    preHandler: authJWT,
    handler: authController.validate.bind(authController)
  });

  fastify.get('/me', {
    preHandler: authJWT,
    handler: authController.getMe.bind(authController)
  });

  fastify.post('/refresh-token', authController.refreshToken.bind(authController));
  fastify.post('/logout', authController.logout.bind(authController));
  fastify.post('/generate-reset-code', authController.generateResetCode.bind(authController));
  fastify.post('/verify-reset-code', authController.verifyResetCode.bind(authController));
  fastify.post('/reset-password', authController.resetPassword.bind(authController));
  fastify.post('/change-password', authController.changePassword.bind(authController));
  fastify.get('/sessions/:userId', authController.getUserSessions.bind(authController));
  fastify.get('/sessions/:userId/active', authController.getActiveSessions.bind(authController));
  fastify.post('/sessions', authController.createSession.bind(authController));
  fastify.delete('/sessions/:sessionId', authController.endSession.bind(authController));
}
