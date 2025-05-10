// src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { schemas } from '../schemas/index';

export default async function authRoutes(fastify: FastifyInstance) {
  // Login endpoint
  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'User login',
      description: 'Authenticate user and return JWT token',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: { $ref: 'AuthResponse' },
        401: { $ref: 'Error' }
      }
    }
  }, AuthController.login);

  // Register endpoint
  fastify.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'User registration',
      description: 'Register a new user account',
      body: {
        type: 'object',
        required: ['email', 'password', 'name', 'cnp', 'matriculationNumber'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string' },
          cnp: { type: 'string' },
          matriculationNumber: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
          academicInfo: {
            type: 'object',
            properties: {
              program: { type: 'string' },
              semester: { type: 'number' },
              groupName: { type: 'string' },
              subgroupIndex: { type: 'string' },
              advisor: { type: 'string' },
              gpa: { type: 'number' }
            }
          }
        }
      },
      response: {
        201: { $ref: 'AuthResponse' },
        400: { $ref: 'Error' }
      }
    }
  }, AuthController.register);

  // Other auth endpoints
  fastify.post('/find-user', {
    schema: {
      tags: ['Auth'],
      summary: 'Find user by CNP and matriculation number',
      body: {
        type: 'object',
        required: ['cnp', 'matriculationNumber'],
        properties: {
          cnp: { type: 'string' },
          matriculationNumber: { type: 'string' }
        }
      },
      response: {
        200: { $ref: 'User' },
        404: { $ref: 'Error' }
      }
    }
  }, AuthController.findUserByCnpAndMatriculation);

  fastify.post('/generate-reset-code', {
    schema: {
      tags: ['Auth'],
      summary: 'Generate password reset code',
      body: {
        type: 'object',
        required: ['cnp', 'matriculationNumber'],
        properties: {
          cnp: { type: 'string' },
          matriculationNumber: { type: 'string' }
        }
      },
      response: {
        200: { $ref: 'Success' },
        404: { $ref: 'Error' }
      }
    }
  }, AuthController.generateResetCode);

  fastify.post('/verify-reset-code', {
    schema: {
      tags: ['Auth'],
      summary: 'Verify password reset code',
      body: {
        type: 'object',
        required: ['cnp', 'matriculationNumber', 'code'],
        properties: {
          cnp: { type: 'string' },
          matriculationNumber: { type: 'string' },
          code: { type: 'string', minLength: 6, maxLength: 6 }
        }
      },
      response: {
        200: { $ref: 'Success' },
        400: { $ref: 'Error' }
      }
    }
  }, AuthController.verifyResetCode);

  fastify.post('/reset-password', {
    schema: {
      tags: ['Auth'],
      summary: 'Reset password with code',
      body: {
        type: 'object',
        required: ['cnp', 'matriculationNumber', 'code', 'newPassword', 'confirmPassword'],
        properties: {
          cnp: { type: 'string' },
          matriculationNumber: { type: 'string' },
          code: { type: 'string', minLength: 6, maxLength: 6 },
          newPassword: { type: 'string', minLength: 6 },
          confirmPassword: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: { $ref: 'Success' },
        400: { $ref: 'Error' }
      }
    }
  }, AuthController.resetPassword);

  fastify.post('/check-user', {
    schema: {
      tags: ['Auth'],
      summary: 'Check if user exists',
      body: {
        type: 'object',
        required: ['email', 'matriculationNumber'],
        properties: {
          email: { type: 'string', format: 'email' },
          matriculationNumber: { type: 'string' }
        }
      },
      response: {
        200: { $ref: 'User' },
        404: { $ref: 'Error' }
      }
    }
  }, AuthController.checkUser);
}
