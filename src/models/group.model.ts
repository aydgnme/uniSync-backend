import { Schema, model } from 'mongoose';

const GroupSchema = new Schema({
  id: { type: String, required: true },
  facultyId: { type: String, required: true },
  specializationShortName: { type: String, required: true },
  studyYear: { type: Number, required: true },
  groupName: { type: String, required: true },
  subgroupIndex: { type: String, required: true },
  isModular: { type: Boolean, required: true },
  orarId: { type: String, required: true }
});

export const Group = model('Group', GroupSchema);
