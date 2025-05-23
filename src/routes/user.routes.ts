import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user.controller';
import { AuthController } from '../controllers/auth.controller';
import { checkUserSchema } from '../schemas/auth.schemas';
import { UserService } from '../services/user.service';
import { verifyAdmin } from '../middlewares/auth.middleware';
import { authJWT } from '../middlewares/auth.jwt.middleware';
import { Types } from 'mongoose';
import { logger } from '../utils/logger';

export default async function userRoutes(fastify: FastifyInstance) {
  // Check user existence (no auth required)
  fastify.post('/check', {
    schema: {
      tags: ['Users'],
      summary: 'Check user existence',
      description: 'Check if a user exists with the given email and matriculation number',
      body: {
        type: 'object',
        required: ['email', 'matriculationNumber'],
        properties: {
          email: { type: 'string', format: 'email' },
          matriculationNumber: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                matriculationNumber: { type: 'string' }
              }
            }
          }
        },
        400: { $ref: 'Error' },
        404: { $ref: 'Error' }
      }
    }
  }, AuthController.checkUser);

  // Add JWT authentication hook for protected routes
  fastify.addHook('onRequest', authJWT);

  // Get user profile
  fastify.get('/profile', {
    schema: {
      tags: ['Users'],
      summary: 'Get user profile',
      description: 'Get the profile of the currently authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: { $ref: 'User' },
        401: { $ref: 'Error' },
        404: { $ref: 'Error' }
      }
    }
  }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
        statusCode: 401
      });
    }

    try {
      const user = await UserService.getUserById(request.user.userId);
      
      if (!user) {
        return reply.status(404).send({
          message: 'User not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      return user;
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      return reply.status(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500
      });
    }
  });

  // Get user by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Users'],
      summary: 'Get user by ID',
      description: 'Get a user by their ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: { $ref: 'User' },
        401: { $ref: 'Error' },
        404: { $ref: 'Error' }
      }
    }
  }, UserController.getUserById);

  // Get all users (admin only)
  fastify.get('/', {
    schema: {
      tags: ['Users'],
      summary: 'Get all users',
      description: 'Retrieve a list of all users (admin only)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: { $ref: 'User' }
            }
          }
        },
        401: { $ref: 'Error' },
        403: { $ref: 'Error' }
      }
    }
  }, UserController.getAllUsers);

  // Update user role to admin
  fastify.put('/:id/make-admin', {
    schema: {
      tags: ['Users'],
      summary: 'Update user role to admin',
      description: 'Update a user\'s role to admin',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [verifyAdmin],
    handler: UserController.updateUserRole
  });

  // Update user
  fastify.put('/:id', {
    schema: {
      tags: ['Users'],
      summary: 'Update user',
      description: 'Update a user\'s information',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          academicInfo: {
            type: 'object',
            properties: {
              program: { type: 'string' },
              semester: { type: 'number' },
              groupName: { type: 'string' },
              subgroupIndex: { type: 'string' },
              studentId: { type: 'string' },
              advisor: { type: 'string' },
              gpa: { type: 'number' },
              specializationShortName: { type: 'string' },
              facultyId: { type: 'string' }
            }
          }
        }
      },
      response: {
        200: { $ref: 'User' },
        401: { $ref: 'Error' },
        404: { $ref: 'Error' }
      }
    }
  }, UserController.updateUser);

  // Get user by matriculation number
  fastify.get('/by-matriculation', {
    schema: {
      tags: ['Users'],
      summary: 'Get user by matriculation number',
      description: 'Get a user by their matriculation number',
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          matriculationNumber: { type: 'string' }
        },
        required: ['matriculationNumber']
      },
      response: {
        200: { $ref: 'User' },
        401: { $ref: 'Error' },
        404: { $ref: 'Error' }
      }
    }
  }, async (request, reply) => {
    try {
      const { matriculationNumber } = request.query as { matriculationNumber: string };
      
      if (!request.user) {
        logger.warn('No user found in request');
        return reply.code(401).send({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
          statusCode: 401
        });
      }

      // Check if user is admin or requesting their own profile
      const isAdmin = request.user.role.toLowerCase() === 'admin';
      const isOwnProfile = request.user.matriculationNumber === matriculationNumber;
      
      logger.info('Auth check:', { isAdmin, isOwnProfile, matriculationNumber });

      if (!isAdmin && !isOwnProfile) {
        logger.warn('Access denied - not admin and not own profile');
        return reply.code(403).send({
          message: 'Access denied',
          code: 'FORBIDDEN',
          statusCode: 403
        });
      }

      const user = await UserService.getUserByMatriculationNumber(matriculationNumber);
      logger.info('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        logger.warn('User not found in database');
        return reply.code(404).send({
          message: 'User not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      return reply.code(200).send(user);
    } catch (error: unknown) {
      logger.error('Error fetching user:', error);
      return reply.code(500).send({
        message: 'Error fetching user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}