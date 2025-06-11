import dotenv from 'dotenv';
import buildServer from './app/index';
import professorRoutes from './routes/professor.routes';

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


    // Build and start the server
    const app = await buildServer();
    console.log('✅ Server built');

    // Register routes
    await app.register(professorRoutes, { prefix: '/api/professors' });

    await app.listen({ 
      port: Number(process.env.PORT) || 3031,
      host: '0.0.0.0'
    });

    console.log(`🚀 Server is running on port ${process.env.PORT || 3031}`);
    console.log(`📚 API Documentation available at: http://localhost:${process.env.PORT || 3000}/api/documentation`);
  } catch (error) {
    console.error('❌ Error starting server:', error);
    // Log to error tracking service if available
    process.exit(1);
  }
};

start();