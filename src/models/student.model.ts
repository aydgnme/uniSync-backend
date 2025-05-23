import { Schema, model, Document, Types } from 'mongoose';

export interface IStudentDocument extends Document {
  name: string;
  surname: string;
  email: string;
  studentId: string;
  academicInfo: {
    program: string;
    advisor: string;
  };
  user: Types.ObjectId;
}

const StudentSchema = new Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  studentId: { type: String, required: true, unique: true },
  academicInfo: {
    program: { type: String, required: true },
    advisor: { type: String, required: true }
  },
  user: { type: Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
});

export const Student = model<IStudentDocument>('Student', StudentSchema); 