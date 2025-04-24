import mongoose from 'mongoose';

export async function connectToMongoDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('❌ MONGO_URI is not defined in .env');
    }

    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}