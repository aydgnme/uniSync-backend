import { Schema, model, Types } from 'mongoose';

const ScheduleSchema = new Schema({
  group: { type: String, required: true },
  subgroup: { type: String, required: true },
  weekNumber: { type: Number, required: true },
  courses: [
    {
      code: { type: String, required: true },
      title: { type: String, required: true },
      type: { type: String, enum: ['LECTURE', 'LAB', 'SEMINAR'], required: true },
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
      duration: { type: Number, required: true },
      room: { type: String, required: true },
      teacher: { type: String, required: true },
      weekDay: { type: Number, required: true },
    },
  ],
});

export const Schedule = model('Schedule', ScheduleSchema);
