import { Schema, model, Document } from 'mongoose';

export interface ICourseGrade {
  code: string;
  title: string;
  grade: number;
  credits: number;
}

export interface ISemesterGrade {
  semester: number;
  courses: ICourseGrade[];
}

export interface IAcademicYearGrade {
  academicYear: number;
  gpa: number;
  semesters: ISemesterGrade[];
}

export interface IStudentGrade {
  userId: string;
  matriculationNumber: string;
  fullName: string;
  program: string;
  specializationShortName: string;
  grades: IAcademicYearGrade[];
}

export interface ICourseGradeDocument extends Document {
  studentId: string;
  lectureId: string;
  academicYear: string;
  semester: number;
  midtermGrade?: number;
  finalGrade?: number;
  projectGrade?: number;
  homeworkGrade?: number;
  attendanceGrade?: number;
  totalGrade: number;
  status: 'PASSED' | 'FAILED' | 'IN_PROGRESS';
  retakeCount: number;
  lastUpdated: Date;
}

const CourseGradeSchema = new Schema({
  studentId: { type: String, required: true },
  lectureId: { type: String, ref: 'Lecture', required: true },
  academicYear: { type: String, required: true },
  semester: { type: Number, required: true },
  midtermGrade: { 
    type: Number,
    min: 1,
    max: 10
  },
  finalGrade: { 
    type: Number,
    min: 1,
    max: 10
  },
  projectGrade: { 
    type: Number,
    min: 1,
    max: 10
  },
  homeworkGrade: { 
    type: Number,
    min: 1,
    max: 10
  },
  attendanceGrade: { 
    type: Number,
    min: 1,
    max: 10
  },
  totalGrade: { 
    type: Number,
    min: 0,
    max: 10
  },
  status: { 
    type: String, 
    enum: ['PASSED', 'FAILED', 'IN_PROGRESS'],
    default: 'IN_PROGRESS'
  },
  retakeCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create compound indexes for faster queries
CourseGradeSchema.index({ studentId: 1, lectureId: 1, academicYear: 1 }, { unique: true });
CourseGradeSchema.index({ studentId: 1, academicYear: 1, semester: 1 });
CourseGradeSchema.index({ lectureId: 1, academicYear: 1, semester: 1 });

export const CourseGrade = model<ICourseGradeDocument>('CourseGrade', CourseGradeSchema); 