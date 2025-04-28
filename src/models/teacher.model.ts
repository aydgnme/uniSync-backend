import { Schema, model } from "mongoose";

const TeacherSchema = new Schema({
  name: { type: String, required: true, unique: true },
});

export const Teacher = model("Teacher", TeacherSchema);
