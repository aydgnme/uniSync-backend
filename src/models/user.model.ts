import mongoose, { Schema, Document } from 'mongoose';
import { DocumentData } from 'firebase-admin/firestore';

export interface IAcademicInfo {
  program: string;
  semester: number;
  groupName: string;
  subgroupIndex: string;
  studentId: string;
  advisor: string;
  gpa: number;
}

export interface IUserBase {
  email: string;
  password: string;
  cnp: string;
  matriculationNumber: string;
  name: string;
  role: 'Student' | 'Teacher' | 'Admin';
  phone: string;
  address: string;
  academicInfo: IAcademicInfo;
  resetCode?: string;
  resetCodeExpiry?: number;
}

export interface IUserDocument extends IUserBase, Document {
  _id: mongoose.Types.ObjectId;
  firebaseData?: DocumentData;
}

export interface IUser extends IUserBase {
  _id: string;
  firebaseData?: DocumentData;
}

const academicInfoSchema = new Schema<IAcademicInfo>({
  program: { type: String, required: true },
  semester: { type: Number, required: true },
  groupName: { type: String, required: true },
  subgroupIndex: { type: String, required: true },
  studentId: { type: String, required: true },
  advisor: { type: String, required: true },
  gpa: { type: Number, required: true }
});

const userSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cnp: { type: String, required: true, unique: true },
  matriculationNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ['Student', 'Teacher', 'Admin'] },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  academicInfo: { type: academicInfoSchema, required: true },
  resetCode: { type: String },
  resetCodeExpiry: { type: Number }
});

export const User = mongoose.model<IUserDocument>('User', userSchema);
