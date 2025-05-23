import { Schema, model, Document } from "mongoose";
import { ISchedule } from "../interfaces/schedule.interface";

export interface IScheduleDocument extends Document, ISchedule {}

const ScheduleSchema = new Schema({
  facultyId: { type: String, required: true },
  groupId: { type: String, required: true },
  groupName: { type: String, required: true },
  subgroupIndex: { type: String },
  specializationShortName: { type: String, required: true },
  studyYear: { type: Number, required: true },
  isModular: { type: Boolean, required: true },
  weekNumber: { type: Number, required: true },
  parity: { type: String, enum: ["ODD", "EVEN", "ALL"], required: true },
  courses: [{
    id: { type: String, required: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["LECTURE", "LAB", "SEMINAR"], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    room: { type: String, required: true },
    teacher: { type: String, required: true },
    weekDay: { type: Number, required: true }
  }]
});

// Create compound indexes for faster queries
ScheduleSchema.index({ facultyId: 1, groupId: 1 });
ScheduleSchema.index({ facultyId: 1, groupName: 1, subgroupIndex: 1 });
ScheduleSchema.index({ facultyId: 1, groupName: 1, weekNumber: 1 });

export const Schedule = model<IScheduleDocument>("Schedule", ScheduleSchema);
