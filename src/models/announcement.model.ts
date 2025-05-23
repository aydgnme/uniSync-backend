import { Schema, model, Types, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  lecture: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  createdAt: Date;
  attachments?: string[];
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  attachments: [{ type: String }]
});

export const Announcement = model<IAnnouncement>('Announcement', AnnouncementSchema); 