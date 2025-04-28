import { connectToMongoDB } from './database/mongo';
import { initializeFirebase } from './config/firebase.config';
import { fastify } from 'fastify';
import dotenv from 'dotenv';
import { userRoutes, authRoutes, testRoutes, scheduleRoutes } from './routes';
import fastifyJwt from '@fastify/jwt';

dotenv.config();

// MARK: -For api versioning
const v1BaseUrl: string = "/api";

const app = fastify();

// Register JWT plugin
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_key_here'
});

// Initialize databases
connectToMongoDB();
initializeFirebase();

// Register routes
app.register(userRoutes, { prefix: `${v1BaseUrl}/users` });
app.register(testRoutes, { prefix: `${v1BaseUrl}/test` });
app.register(authRoutes, { prefix: `${v1BaseUrl}/auth` });
app.register(scheduleRoutes, { prefix: `${v1BaseUrl}/schedules` });

const start = async () => {
  try {
    const address = await app.listen({ port: 3000, host: "0.0.0.0" });
    console.log(`🚀 Server running at ${address}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();