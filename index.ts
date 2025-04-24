import { connectToMongoDB } from './src/database/mongo';
import { initializeFirebase } from './src/config/firebase.config';
import { fastify } from 'fastify';
import dotenv from 'dotenv';
import { userRoutes } from './src/controllers/user.controller';
import { testRoutes } from './src/controllers/test.controller';
import { authRoutes } from './src/controllers/auth.controller';
import fastifyJwt from '@fastify/jwt';

dotenv.config();

const app = fastify();

// Register JWT plugin
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here'
});

// Initialize databases
connectToMongoDB();
initializeFirebase();

// Register routes
app.register(userRoutes, { prefix: '/users' });
app.register(testRoutes, { prefix: '/api' });
app.register(authRoutes, { prefix: '/auth' });

const start = async () => {
  try {
    await app.listen({ port: 3000 });
    console.log('Server is running on port 3000');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();