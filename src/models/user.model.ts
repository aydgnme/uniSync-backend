import mongoose, { Schema, Document } from 'mongoose';
import { DocumentData } from 'firebase-admin/firestore';

export interface IAcademicInfo {
  program: string;
  semester: number;
  studyYear: number;
  groupName: string;
  subgroupIndex: string;
  studentId: string;
  advisor: string;
  gpa: number;
  specializationShortName: string;
  facultyId: string;
  groupId: string;
  isModular: boolean;
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
  enrolledLectures?: mongoose.Types.ObjectId[];
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
  studyYear: { type: Number, required: true },
  groupName: { type: String, required: true },
  subgroupIndex: { type: String, required: true },
  studentId: { type: String, required: true },
  advisor: { type: String, required: true },
  gpa: { type: Number, required: true },
  specializationShortName: { type: String, required: true },
  facultyId: { type: String, required: true },
  groupId: { type: String, required: true },
  isModular: { type: Boolean, required: true, default: false }
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
  resetCodeExpiry: { type: Number },
  enrolledLectures: [{ type: Schema.Types.ObjectId, ref: 'Lecture' }]
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Add indexes for frequently queried fields
userSchema.index({ email: 1 });
userSchema.index({ cnp: 1 });
userSchema.index({ matriculationNumber: 1 });
userSchema.index({ 'academicInfo.groupId': 1 });
userSchema.index({ 'academicInfo.facultyId': 1 });
userSchema.index({ 'academicInfo.specializationShortName': 1 });

export const User = mongoose.model<IUserDocument>('User', userSchema);
