import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user.controller';
import { AuthController } from '../controllers/auth.controller';
import { checkUserSchema } from '../schemas/auth.schemas';
import { UserService } from '../services/user.service';
import { verifyAdmin } from '../middlewares/auth.middleware';

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
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
      const decoded = request.user as any;
      request.user = {
        _id: decoded.userId,
        email: decoded.email,
        role: decoded.role || 'Student'
      };
    } catch (err) {
      reply.code(401).send({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
        statusCode: 401
      });
    }
  });

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

    const userId = (request.user as any)._id;
    const user = await UserService.getUserById(userId);
    if (!user) {
      return reply.status(404).send({
        message: 'User not found',
        code: 'NOT_FOUND',
        statusCode: 404
      });
    }

    return user;
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
}