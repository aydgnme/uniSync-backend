import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user.controller';
import { authJWT } from '../middlewares/auth.jwt.middleware';

export default async function userRoutes(fastify: FastifyInstance) {
  // Register route should not require authentication
  fastify.post('/register', {
    schema: {
      tags: ['Users'],
      summary: 'Register a new user',
      description: 'Register a new user in the system',
      body: {
        type: 'object',
        required: ['email', 'password', 'first_name', 'last_name', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          first_name: { type: 'string', minLength: 2 },
          last_name: { type: 'string', minLength: 2 },
          role: { type: 'string', enum: ['student', 'staff', 'admin'] },
          phone_number: { type: 'string', pattern: '^\\+[0-9]{10,15}$' },
          gender: { type: 'string', enum: ['male', 'female', 'other'] },
          date_of_birth: { type: 'string', pattern: '^\\d{2}\\.\\d{2}\\.\\d{4}$' },
          nationality: { type: 'string' },
          cnp: { type: 'string', pattern: '^[0-9]{13}$' },
          matriculation_number: { type: 'string' },
          academicInfo: {
            type: 'object',
            properties: {
              faculty_id: { type: 'string', format: 'uuid' },
              group_id: { type: 'string', format: 'uuid' },
              is_modular: { type: 'boolean' },
              gpa: { type: 'number' }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                first_name: { type: 'string' },
                last_name: { type: 'string' },
                role: { type: 'string' }
              }
            }
          }
        },
        400: { $ref: 'Error' },
        409: { $ref: 'Error' }
      }
    }
  }, UserController.register);

  // Add JWT authentication hook for all routes
  fastify.addHook('onRequest', authJWT);

  // Get user profile
  fastify.get('/profile', {
    schema: {
      tags: ['Users'],
      summary: 'Get user profile',
      description: 'Get the profile of the authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                role: { type: 'string', enum: ['student', 'staff', 'admin'] },
                name: { type: 'string' },
                phone: { type: 'string' },
                gender: { type: 'string', enum: ['male', 'female', 'other'] },
                dateOfBirth: { type: 'string', format: 'date' },
                nationality: { type: 'string' },
                cnp: { type: 'string' },
                matriculationNumber: { type: 'string' },
                academicInfo: {
                  type: 'object',
                  properties: {
                    advisor: { type: ['string', 'null'] },
                    facultyId: { type: 'string', format: 'uuid' },
                    facultyName: { type: 'string' },
                    gpa: { type: 'number' },
                    groupName: { type: 'string' },
                    isModular: { type: 'boolean' },
                    program: { type: 'string' },
                    semester: { type: 'number' },
                    specializationId: { type: 'string', format: 'uuid' },
                    specializationShortName: { type: 'string' },
                    studentId: { type: 'string', format: 'uuid' },
                    studyYear: { type: 'number' },
                    subgroupIndex: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, UserController.getProfile);

  // Update user profile
  fastify.put('/profile', {
    schema: {
      tags: ['Users'],
      summary: 'Update user profile',
      description: 'Update the profile of the authenticated user',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          first_name: { type: 'string', minLength: 2 },
          last_name: { type: 'string', minLength: 2 },
          phone_number: { type: 'string', pattern: '^\\+[0-9]{10,15}$' },
          gender: { type: 'string', enum: ['male', 'female', 'other'] },
          date_of_birth: { type: 'string', pattern: '^\\d{2}\\.\\d{2}\\.\\d{4}$' },
          nationality: { type: 'string' },
          matriculation_number: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                fullName: { type: 'string' },
                role: { type: 'string', enum: ['student', 'staff', 'admin'] },
                matriculationNumber: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, UserController.updateProfile);

  // Get user by ID (admin only)
  fastify.get('/:id', {
    schema: {
      tags: ['Users'],
      summary: 'Get user by ID',
      description: 'Get a user by their ID (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                fullName: { type: 'string' },
                role: { type: 'string', enum: ['student', 'staff', 'admin'] },
                matriculationNumber: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, UserController.getUserById);

  // Get all users (admin only)
  fastify.get('/', {
    schema: {
      tags: ['Users'],
      summary: 'Get all users',
      description: 'Get all users in the system (admin only)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  fullName: { type: 'string' },
                  role: { type: 'string', enum: ['student', 'staff', 'admin'] },
                  matriculationNumber: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, UserController.getAllUsers);

  // Make user admin (admin only)
  fastify.put('/:id/make-admin', {
    schema: {
      tags: ['Users'],
      summary: 'Make user admin',
      description: 'Make a user an admin (admin only)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                fullName: { type: 'string' },
                role: { type: 'string', enum: ['student', 'staff', 'admin'] },
                matriculationNumber: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'User not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, UserController.updateUserRole);

  // Get students by faculty ID
  fastify.get('/faculty/:facultyId/students', {
    schema: {
      tags: ['Users'],
      summary: 'Get all students by faculty ID',
      description: 'Get all students belonging to a specific faculty',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['facultyId'],
        properties: {
          facultyId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phoneNumber: { type: 'string' },
                  gender: { type: 'string', enum: ['male', 'female', 'other'] },
                  dateOfBirth: { type: 'string', format: 'date' },
                  nationality: { type: 'string' },
                  cnp: { type: 'string' },
                  matriculationNumber: { type: 'string' },
                  isModular: { type: 'boolean' },
                  gpa: { type: 'number' },
                  groupId: { type: 'string', format: 'uuid' },
                  facultyId: { type: 'string', format: 'uuid' },
                  advisorName: { type: 'string' },
                  isActive: { type: 'boolean' },
                  academicInfo: {
                    type: 'object',
                    properties: {
                      groupName: { type: 'string' },
                      subgroupIndex: { type: 'string' },
                      semester: { type: 'number' },
                      studyYear: { type: 'number' },
                      specializationId: { type: 'string', format: 'uuid' },
                      specializationName: { type: 'string' },
                      specializationShortName: { type: 'string' },
                      facultyName: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, UserController.getStudentsByFacultyId);

  // Get my student information
  fastify.get('/my/student', {
    schema: {
      tags: ['Users'],
      summary: 'Get authenticated student information',
      description: 'Get detailed information about the authenticated student',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string', format: 'email' },
                phoneNumber: { type: 'string' },
                gender: { type: 'string', enum: ['male', 'female', 'other'] },
                dateOfBirth: { type: 'string', format: 'date' },
                nationality: { type: 'string' },
                cnp: { type: 'string' },
                matriculationNumber: { type: 'string' },
                isModular: { type: 'boolean' },
                gpa: { type: 'number' },
                groupId: { type: 'string', format: 'uuid' },
                facultyId: { type: 'string', format: 'uuid' },
                advisorName: { type: 'string' },
                isActive: { type: 'boolean' },
                academicInfo: {
                  type: 'object',
                  properties: {
                    groupName: { type: 'string' },
                    subgroupIndex: { type: 'string' },
                    semester: { type: 'number' },
                    studyYear: { type: 'number' },
                    specializationId: { type: 'string', format: 'uuid' },
                    specializationName: { type: 'string' },
                    specializationShortName: { type: 'string' },
                    facultyName: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, UserController.getMyStudentInfo);

  // Change password endpoint
  fastify.post('/change-password', {
    schema: {
      tags: ['Users'],
      summary: 'Change user password',
      description: 'Change password for authenticated user',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword', 'confirmPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 6 },
          newPassword: { type: 'string', minLength: 6 },
          confirmPassword: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            success: { type: 'boolean' }
          },
          required: ['message', 'success']
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        }
      }
    }
  }, UserController.changePassword);

  // Get user sessions
  fastify.get('/sessions', {
    schema: {
      tags: ['Users'],
      summary: 'Get user sessions',
      description: 'Get all sessions for the authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            sessions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  user_id: { type: 'string', format: 'uuid' },
                  login_time: { type: 'string', format: 'date-time' },
                  logout_time: { type: ['string', 'null'], format: 'date-time' },
                  ip_address: { type: 'string' },
                  device_info: { type: 'string' }
                }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        }
      }
    }
  }, UserController.getSessions);

  // Logout all sessions endpoint
  fastify.post('/sessions/logout-all', {
    schema: {
      tags: ['Users'],
      summary: 'Logout all sessions',
      description: 'Logout all sessions for the authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            success: { type: 'boolean' }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        }
      }
    }
  }, UserController.logoutAllSessions);

  // Logout current session endpoint
  fastify.post('/sessions/logout', {
    schema: {
      tags: ['Users'],
      summary: 'Logout current session',
      description: 'Logout the current session for the authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            success: { type: 'boolean' }
          }
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        }
      }
    }
  }, UserController.logoutCurrentSession);
}