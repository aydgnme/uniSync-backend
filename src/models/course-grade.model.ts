import mongoose, { Document, Schema } from 'mongoose';
import { Grade } from '../types/database.types';

export interface ICourseGradeDocument extends Document {
  studentId: string;
  lectureId: string;
  examType: 'midterm' | 'final' | 'project' | 'homework';
  score: number;
  letterGrade: string;
  gradedAt: Date;
  createdBy: string;
  lastUpdated: Date;
}

const CourseGradeSchema = new Schema<ICourseGradeDocument>({
  studentId: { type: String, required: true },
  lectureId: { type: String, required: true },
  examType: { 
    type: String, 
    required: true,
    enum: ['midterm', 'final', 'project', 'homework']
  },
  score: { type: Number, required: true },
  letterGrade: { type: String, required: true },
  gradedAt: { type: Date, required: true },
  createdBy: { type: String, required: true },
  lastUpdated: { type: Date, required: true }
}, {
  timestamps: true
});

export const CourseGrade = mongoose.model<ICourseGradeDocument>('CourseGrade', CourseGradeSchema); 