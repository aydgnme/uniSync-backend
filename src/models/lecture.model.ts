import { Schema, model, Document } from 'mongoose';

export interface ILectureDocument extends Document {
  code: string;
  title: string;
  type: 'LECTURE' | 'LAB' | 'SEMINAR';
  room: string;
  teacher: string;
  weekDay: number;
  startHour: string;
  duration: number;
  weeks: number[];
  parity: 'ODD' | 'EVEN' | 'ALL';
  group: string;
  subgroup: string;
}

const LectureSchema = new Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['LECTURE', 'LAB', 'SEMINAR'], required: true },
  room: { type: String, required: true },
  teacher: { type: String, required: true },
  weekDay: { type: Number, required: true },
  startHour: { type: String, required: true },
  duration: { type: Number, required: true },
  weeks: [{ type: Number }],
  parity: { type: String, enum: ['ODD', 'EVEN', 'ALL'], default: 'ALL' },
  group: { type: String, required: true },
  subgroup: { type: String, required: true },
});

export const Lecture = model<ILectureDocument>('Lecture', LectureSchema);
