import { Schema, model, Types, Document } from 'mongoose';
import { IStudentDocument } from './student.model';
import { ILectureDocument } from './lecture.model';

export interface IHomework extends Document {
  lecture: Types.ObjectId | ILectureDocument;
  lectureCode: string;
  group: string;
  subgroup: string;
  title: string;
  description: string;
  dueDate?: Date;
  isUnlimited: boolean;
  student?: Types.ObjectId | IStudentDocument;
  fileId?: string;
  fileName?: string;
  submittedAt?: Date;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
}

const HomeworkSchema = new Schema({
  lecture: { type: Types.ObjectId, ref: 'Lecture', required: true },
  lectureCode: { type: String, required: true },
  group: { type: String, required: true },
  subgroup: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date },
  isUnlimited: { type: Boolean, default: false },
  student: { type: Types.ObjectId, ref: 'Student' },
  fileId: { type: String },
  fileName: { type: String },
  submittedAt: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'submitted', 'graded'], 
    default: 'pending' 
  },
  grade: { type: Number, min: 1, max: 10 },
  feedback: { type: String }
}, {
  timestamps: true
});

// Index for faster queries
HomeworkSchema.index({ lectureCode: 1, group: 1, subgroup: 1 });
HomeworkSchema.index({ student: 1, lecture: 1 });

export const Homework = model<IHomework>('Homework', HomeworkSchema);