import app from './app';
import { connectToMongoDB } from './database/mongo';

const start = async () => {
  try {
    // Connect to MongoDB first
    await connectToMongoDB();
    
    // Then start the server
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start(); 