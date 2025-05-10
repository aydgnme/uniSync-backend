import { Schema, model, Types, Document } from 'mongoose';
import { IUserDocument } from './user.model';
import { ILectureDocument } from './lecture.model';

interface IStudentInfo {
  nrMatricol: string;
  group: string;
  subgroup: string;
  name: string;
}

interface ILectureInfo {
  code: string;
  title: string;
  type: string;
  teacher: string;
}

export interface IHomework extends Document {
  student: Types.ObjectId | IUserDocument;
  lecture: Types.ObjectId | ILectureDocument;
  fileId: string;
  fileName: string;
  submittedAt: Date;
  status: 'pending' | 'graded';
  grade?: number;
  feedback?: string;
  studentInfo: IStudentInfo;
  lectureInfo: ILectureInfo;
}

const HomeworkSchema = new Schema({
  student: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  lecture: {
    type: Types.ObjectId,
    ref: 'Lecture',
    required: true
  },
  fileId: { 
    type: String, 
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: {
    type: String,
    enum: ['pending', 'graded'],
    default: 'pending'
  },
  grade: {
    type: Number,
    min: 1,
    max: 10,
    required: false
  },
  feedback: {
    type: String,
    required: false
  }
});

// Virtual fields for student information
HomeworkSchema.virtual('studentInfo').get(function(this: IHomework) {
  const student = this.student as IUserDocument;
  return {
    nrMatricol: student?.matriculationNumber,
    group: student?.academicInfo?.groupName,
    subgroup: student?.academicInfo?.subgroupIndex,
    name: student?.name
  };
});

// Virtual fields for lecture information
HomeworkSchema.virtual('lectureInfo').get(function(this: IHomework) {
  const lecture = this.lecture as ILectureDocument;
  return {
    code: lecture?.code,
    title: lecture?.title,
    type: lecture?.type,
    teacher: lecture?.teacher
  };
});

// Ensure virtuals are included in JSON output
HomeworkSchema.set('toJSON', { virtuals: true });
HomeworkSchema.set('toObject', { virtuals: true });

export const Homework = model<IHomework>('Homework', HomeworkSchema); 