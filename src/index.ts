import dotenv from 'dotenv';
import { connectToMongoDB } from './database/mongo';
import { initializeFirebase } from './config/firebase.config';
import { initializeFirebaseServices } from './database/firebase';
import buildServer from './app/index';

// Load environment variables
dotenv.config();

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Log to error tracking service if available
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  // Log to error tracking service if available
  process.exit(1);
});

const start = async () => {
  try {
    // Initialize Firebase first
    await initializeFirebase();
    console.log('✅ Firebase initialized');

    // Initialize Firebase services
    await initializeFirebaseServices();
    console.log('✅ Firebase services initialized');

    // Connect to MongoDB
    await connectToMongoDB();
    console.log('✅ Connected to MongoDB');

    // Build and start the server
    const app = await buildServer();
    console.log('✅ Server built');

    await app.listen({ 
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0'
    });

    console.log(`🚀 Server is running on port ${process.env.PORT || 3000}`);
    console.log(`📚 API Documentation available at: http://localhost:${process.env.PORT || 3000}/api/documentation`);
  } catch (error) {
    console.error('❌ Error starting server:', error);
    // Log to error tracking service if available
    process.exit(1);
  }
};

start();