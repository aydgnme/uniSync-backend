import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import formbody from '@fastify/formbody';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import { schemas } from '../schemas/index';
import { connectToMongoDB } from '../database/mongo';

const buildServer = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
          levelFirst: true,
          messageFormat: '{msg} {context}',
          errorLikeObjectKeys: ['err', 'error'],
          errorProps: 'message,stack,code,type'
        }
      }
    }
  });

  // Register JWT plugin
  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    sign: {
      expiresIn: '24h',
      algorithm: 'HS256',
      iss: 'usv-portal',
      aud: 'usv-portal-users'
    },
    verify: {
      extractToken: (request) => {
        const authHeader = request.headers.authorization || request.headers['x-auth-token'];
        if (!authHeader || typeof authHeader !== 'string') {
          return undefined;
        }
        return authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      },
      maxAge: '24h'
    },
    cookie: {
      cookieName: 'token',
      signed: false
    }
  });

  // Register plugins
  await app.register(cors, {
    origin: true,
    credentials: true
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB
    }
  });

  await app.register(formbody);

  // Register schemas
  Object.entries(schemas).forEach(([name, schema]) => {
    if (typeof schema === 'object') {
      app.addSchema({
        $id: name,
        ...schema
      });
    }
  });

  // Register Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'USV Portal API',
        description: 'API documentation for USV Portal',
        version: '1.0.0',
        contact: {
          name: 'USV Portal Team',
          email: 'support@usvportal.com'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT token in the format: Bearer <token>'
          }
        }
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Homework', description: 'Homework management endpoints' },
        { name: 'System', description: 'System management endpoints' }
      ]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: '/api/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      tryItOutEnabled: true,
      filter: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai'
      }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  });

  // Register routes
  await app.register(import('../routes/auth.routes'), { prefix: '/api/auth' });
  await app.register(import('../routes/user.routes'), { prefix: '/api/users' });
  await app.register(import('../routes/homework.routes'), { prefix: '/api/homework' });
  await app.register(import('../routes/test.routes'), { prefix: '/api/test' });
  await app.register(import('../routes/schedule.routes'), { prefix: '/api/schedule' });
  await app.register(import('../routes/course-grade.routes'), { prefix: '/api/course-grades' });
  await app.register(import('../routes/gridfs.routes'), { prefix: '/api/files' });

  // Health check endpoint
  app.get('/api/system/health', {
    schema: {
      tags: ['System'],
      summary: 'Health check',
      description: 'Check if the system is running',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            memory: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                free: { type: 'number' },
                used: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const memoryUsage = process.memoryUsage();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        total: memoryUsage.heapTotal,
        free: memoryUsage.heapUsed,
        used: memoryUsage.rss
      }
    };
  });

  // System info endpoint (admin only)
  app.get('/api/system/info', {
    schema: {
      tags: ['System'],
      summary: 'System info',
      description: 'Get system information (admin only)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            nodeVersion: { type: 'string' },
            platform: { type: 'string' },
            arch: { type: 'string' },
            cpus: { type: 'number' },
            memory: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                free: { type: 'number' },
                used: { type: 'number' }
              }
            }
          }
        },
        401: { $ref: 'Error' },
        403: { $ref: 'Error' }
      }
    }
  }, async (request, reply) => {
    const user = request.user as any;
    if (!user || user.role !== 'admin') {
      return reply.code(403).send({ message: 'Forbidden' });
    }

    const memoryUsage = process.memoryUsage();
    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpus: require('os').cpus().length,
      memory: {
        total: memoryUsage.heapTotal,
        free: memoryUsage.heapUsed,
        used: memoryUsage.rss
      }
    };
  });

  // Add request logging
  app.addHook('onRequest', (request, reply, done) => {
    request.log.info({ 
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body
    }, 'Incoming request');
    done();
  });

  // Add response logging
  app.addHook('onResponse', (request, reply, done) => {
    request.log.info({ 
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime
    }, 'Request completed');
    done();
  });

  // Add error logging
  app.setErrorHandler((error, request, reply) => {
    request.log.error({
      err: {
        message: error.message,
        stack: error.stack,
        code: error.code,
        type: error.name
      }
    }, 'Request error');
    
    reply.status(error.statusCode || 500).send({
      message: error.message || 'Internal Server Error',
      code: error.code || 'INTERNAL_SERVER_ERROR'
    });
  });

  return app;
};

export { buildServer };
