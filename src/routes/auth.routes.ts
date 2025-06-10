// src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { authJWT } from '../middlewares/auth.jwt.middleware';

export default async function authRoutes(fastify: FastifyInstance) {
  // Add JWT middleware to all routes
  fastify.addHook('onRequest', authJWT);

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
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string', enum: ['student', 'staff', 'admin'] }
              },
              required: ['id', 'email', 'role']
            }
          },
          required: ['token', 'user']
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, AuthController.login);

  // Refresh token endpoint
  fastify.post('/refresh-token', {
    schema: {
      tags: ['Auth'],
      summary: 'Refresh JWT token',
      description: 'Refresh the JWT token using the current session',
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string', enum: ['student', 'staff', 'admin'] }
              },
              required: ['id', 'email', 'role']
            }
          },
          required: ['token', 'user']
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, AuthController.refreshToken);

  // Find user endpoint
  fastify.post('/find-user', {
    schema: {
      tags: ['Auth'],
      summary: 'Find user by CNP and matriculation number',
      body: {
        type: 'object',
        required: ['cnp', 'matriculationNumber'],
        properties: {
          cnp: { type: 'string', pattern: '^[0-9]{13}$' },
          matriculationNumber: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                matriculation_number: { type: 'string' },
                cnp: { type: 'string' },
                role: { type: 'string', enum: ['student', 'staff', 'admin'] }
              },
              required: ['id', 'email', 'first_name', 'last_name', 'matriculation_number', 'cnp', 'role']
            }
          },
          required: ['user']
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, AuthController.findUserByCnpAndMatriculation);

  // Generate reset code endpoint
  fastify.post('/generate-reset-code', {
    schema: {
      tags: ['Auth'],
      summary: 'Generate password reset code',
      body: {
        type: 'object',
        required: ['cnp', 'matriculationNumber'],
        properties: {
          cnp: { type: 'string', pattern: '^[0-9]{13}$' },
          matriculationNumber: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            success: { type: 'boolean' }
          }
        },
        400: { $ref: 'Error' },
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
        required: ['cnp', 'matriculationNumber', 'reset_code'],
        properties: {
          cnp: { type: 'string', pattern: '^[0-9]{13}$' },
          matriculationNumber: { type: 'string', minLength: 1 },
          reset_code: { type: 'string', pattern: '^[0-9]{6}$' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            isValid: { type: 'boolean' }
          },
          required: ['message', 'isValid']
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
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
          cnp: { type: 'string', pattern: '^[0-9]{13}$' },
          matriculationNumber: { type: 'string', minLength: 1 },
          code: { type: 'string', pattern: '^[0-9]{6}$' },
          newPassword: { type: 'string', minLength: 6 },
          confirmPassword: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          },
          required: ['message']
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, AuthController.resetPassword);

  fastify.post('/check-user', {
    schema: {
      tags: ['Auth'],
      summary: 'Check if user exists',
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
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
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                matriculation_number: { type: 'string' }
              },
              required: ['id', 'email', 'first_name', 'last_name', 'matriculation_number']
            }
          },
          required: ['message', 'user']
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, AuthController.checkUser);

  // Logout endpoint
  fastify.post('/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'User logout',
      description: 'Logout user and invalidate session',
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            success: { type: 'boolean' }
          },
          required: ['message', 'success']
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, AuthController.logout);
}
