import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../types/database.types';

export interface IUserDocument extends Document {
  email: string;
  role: UserRole;
  studentInfo?: {
    groupId: string;
    matriculationNumber: string;
  };
}

const UserSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true },
  role: { 
    type: String, 
    required: true,
    enum: ['student', 'staff', 'admin']
  },
  studentInfo: {
    groupId: { type: String },
    matriculationNumber: { type: String }
  }
}, {
  timestamps: true
});

export const User = mongoose.model<IUserDocument>('User', UserSchema); 