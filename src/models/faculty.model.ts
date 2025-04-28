import { Schema, model } from 'mongoose';

const FacultySchema = new Schema({
  id: { type: String, required: true },
  shortName: { type: String, required: true },
  longName: { type: String, required: true },
});

export const Faculty = model('Faculty', FacultySchema);
