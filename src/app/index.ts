import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import formbody from '@fastify/formbody';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { schemas } from '../schemas/index';
import { swaggerOptions } from '../config/swagger';
import { registerRoutes } from '../routes';
import { multipartOptions } from '../config/multipart';

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

  // Register rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
    errorResponseBuilder: function (request, context) {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded, retry in ${context.after}`,
        expiresIn: context.after
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

  await app.register(multipart, multipartOptions);

  await app.register(formbody);

  // Register schemas
  const schemaEntries = Object.entries(schemas);
  await Promise.all(
    schemaEntries.map(async ([name, schema]) => {
      if (typeof schema === 'object') {
        app.addSchema({
          $id: name,
          ...schema
        });
      }
    })
  );

  // Register Swagger
  await app.register(swagger, {
    ...swaggerOptions,
    mode: 'dynamic'
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
  await registerRoutes(app);

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
    const errorResponse = {
      message: error.message || 'Internal Server Error',
      code: error.code || 'INTERNAL_SERVER_ERROR',
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method
    };

    request.log.error({
      err: {
        ...errorResponse,
        stack: error.stack,
        type: error.name
      }
    }, 'Request error');
    
    reply.status(errorResponse.statusCode).send(errorResponse);
  });

  return app;
};

export default buildServer;
