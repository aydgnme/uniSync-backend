import dotenv from 'dotenv';
import app from './app';
import { initializeFirebase } from './config/firebase.config';
import { connectToMongoDB } from './database/mongo';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const start = async () => {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    // Initialize Firebase
    await initializeFirebase();

    // Start server
    await app.listen({ port: Number(PORT), host: HOST });
    app.log.info(`🚀 Server running at http://${HOST}:${PORT}`);
    app.log.info(`📚 API Documentation available at http://${HOST}:${PORT}/api/documentation`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
start();