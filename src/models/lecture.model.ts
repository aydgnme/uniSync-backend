import { Schema, model, Document } from 'mongoose';

export interface ITeacherInfo {
  id?: string;
  lastName: string;
  firstName: string;
  position?: string;
  phd?: string;
  otherTitle?: string;
}

export interface ILectureDocument extends Document {
  facultyId: string;
  groupId: string;
  groupName: string;
  subgroupIndex?: string;
  weeks: number[];
  weekDay: number;
  startTime: string;
  endTime: string;
  duration: number;
  code: string;
  title: string;
  type: 'LECTURE' | 'LAB' | 'SEMINAR';
  room: string;
  teacher: string;
  teacherInfo: ITeacherInfo;
  parity: 'ODD' | 'EVEN' | 'ALL';
  specializationShortName: string;
  studyYear: number;
}

const TeacherInfoSchema = new Schema({
  id: { type: String },
  lastName: { type: String, required: true },
  firstName: { type: String, required: true },
  position: { type: String },
  phd: { type: String },
  otherTitle: { type: String }
}, { _id: false });

const LectureSchema = new Schema({
  facultyId: { type: String, required: true },
  groupId: { type: String, required: true },
  groupName: { type: String, required: true },
  subgroupIndex: { type: String },
  weeks: { type: [Number], required: true },
  weekDay: { type: Number, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  duration: { type: Number, required: true },
  code: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['LECTURE', 'LAB', 'SEMINAR'], required: true },
  room: { type: String, required: false },
  teacher: { type: String, required: true },
  teacherInfo: { type: TeacherInfoSchema, required: true },
  parity: { type: String, enum: ['ODD', 'EVEN', 'ALL'], required: true },
  specializationShortName: { type: String, required: true },
  studyYear: { type: Number, required: true }
});

// Create compound indexes for faster queries
LectureSchema.index({ facultyId: 1, groupId: 1 });
LectureSchema.index({ facultyId: 1, groupName: 1, subgroupIndex: 1 });
LectureSchema.index({ facultyId: 1, groupName: 1, weeks: 1 });
LectureSchema.index({ facultyId: 1, groupName: 1, weekDay: 1 });

export const Lecture = model<ILectureDocument>('Lecture', LectureSchema);