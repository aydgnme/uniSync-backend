import dotenv from 'dotenv';
import { connectToMongoDB } from './database/mongo';
import { initializeFirebase } from './config/firebase.config';
import { buildServer } from './app/index';
import fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import scheduleRoutes from './routes/schedule.routes';

// Load environment variables
dotenv.config();

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

const server = fastify({
  logger: true
});

// Swagger configuration
server.register(fastifySwagger, {
  swagger: {
    info: {
      title: 'USV Portal API',
      description: 'USV Portal Backend API Documentation',
      version: '1.0.0'
    },
    tags: [
      { name: 'Schedule', description: 'Schedule related endpoints' }
    ],
    securityDefinitions: {
      bearerAuth: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header'
      }
    }
  }
});

server.register(fastifySwaggerUi, {
  routePrefix: '/documentation',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  uiHooks: {
    onRequest: function (request, reply, next) { next(); },
    preHandler: function (request, reply, next) { next(); }
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
});

// Routes
server.register(scheduleRoutes, { prefix: '/api/schedule' });

const start = async () => {
  try {
    // Initialize Firebase first
    await initializeFirebase();
    console.log('Firebase initialized');

    // Connect to MongoDB
    await connectToMongoDB();
    console.log('Connected to MongoDB');

    // Build and start the server
    const app = await buildServer();
    await app.listen({ 
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0'
    });

    console.log(`Server is running on port ${process.env.PORT || 3000}`);
    console.log(`API Documentation available at: http://localhost:${process.env.PORT || 3000}/api/documentation`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

start();