import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  type: 'Academic' | 'Technical' | 'General';
  date: string;
  attachments: string[];
}

const AnnouncementSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Academic', 'Technical', 'General']
  },
  date: {
    type: String,
    required: true,
    default: () => new Date().toISOString().split('T')[0]
  },
  attachments: [{
    type: String
  }]
}, {
  timestamps: true
});

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema); 