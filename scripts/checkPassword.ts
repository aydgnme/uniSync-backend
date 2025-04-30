import bcrypt from 'bcryptjs';
import { User } from '../src/models/user.model';
import { connectToMongoDB } from '../src/database/mongo';
import mongoose from 'mongoose';

async function main() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'prenume.nume@student.usv.ro' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', {
      email: user.email,
      storedPasswordHash: user.password,
      _id: user._id
    });

    const password = 'Student@123';
    
    // Create new hash
    const newHash = await bcrypt.hash(password, 10);
    console.log('New hash:', newHash);
    
    // Compare hashes
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main().catch(console.error);
