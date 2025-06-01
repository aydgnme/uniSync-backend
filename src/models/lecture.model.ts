import mongoose, { Document, Schema } from 'mongoose';

export interface ILectureDocument extends Document {
  code: string;
  title: string;
  credits: number;
  evaluationType: string;
  type: 'LECTURE' | 'SEMINAR' | 'LAB';
  weekDay: string;
  startTime: string;
  endTime: string;
  room: string;
  weeks: number[];
  parity: 'ODD' | 'EVEN' | 'ALL';
}

const LectureSchema = new Schema<ILectureDocument>({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  credits: { type: Number, required: true },
  evaluationType: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['LECTURE', 'SEMINAR', 'LAB']
  },
  weekDay: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String, required: true },
  weeks: [{ type: Number }],
  parity: { 
    type: String, 
    required: true,
    enum: ['ODD', 'EVEN', 'ALL']
  }
}, {
  timestamps: true
});

export const Lecture = mongoose.model<ILectureDocument>('Lecture', LectureSchema); 