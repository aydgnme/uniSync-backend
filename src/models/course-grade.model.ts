import { Schema, model } from 'mongoose';

const CourseGradeSchema = new Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  instructor: { type: String, required: true },
  semester: { type: Number, required: true },
  academicYear: { type: String, required: true },
  credits: { type: Number, required: true },
  midtermGrade: { 
    type: Number, 
    required: true,
    min: 1, 
    max: 10
  },
  finalGrade: { 
    type: Number, 
    required: true,
    min: 1, 
    max: 10
  },
  totalGrade: { 
    type: Number,
    min: 1, 
    max: 10
  },
  studentId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Passed', 'Failed', 'InProgress'],
    default: 'InProgress'
  }
});

export const CourseGrade = model('CourseGrade', CourseGradeSchema); 