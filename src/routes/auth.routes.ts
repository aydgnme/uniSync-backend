// src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', AuthController.login);
  fastify.post('/find-user', AuthController.findUserByCnpAndMatriculation);
  fastify.post('/password-reset/generate-reset-code', AuthController.generateResetCode);
  fastify.post('/password-reset/reset-password', AuthController.resetPassword);
  fastify.post('/check-user', AuthController.checkUser);
}
