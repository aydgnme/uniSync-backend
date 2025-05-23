import { Schema, model, Document, Types } from 'mongoose';

export interface IProfessorDocument extends Document {
  user?: Types.ObjectId;
  lastName: string;
  firstName: string;
  department: string;
  faculty: string;
  title: string;
  position: string;
  office: string;
  phoneNumber: string;
  email?: string;
  phd?: string;
  otherTitle?: string;
  lectures: string[];
}

const ProfessorSchema = new Schema<IProfessorDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true
  },
  lastName: { 
    type: String, 
    required: true 
  },
  firstName: { 
    type: String, 
    required: true 
  },
  department: { 
    type: String, 
    required: true 
  },
  faculty: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Research Assistant']
  },
  position: {
    type: String,
    required: true,
    default: 'Lecturer'
  },
  office: { 
    type: String, 
    required: true,
    default: 'Not Assigned'
  },
  phoneNumber: { 
    type: String,
    default: ''
  },
  email: {
    type: String
  },
  phd: {
    type: String
  },
  otherTitle: {
    type: String
  },
  lectures: [{ 
    type: String,
    description: 'Array of lecture codes taught by this professor'
  }]
}, {
  timestamps: true,
  versionKey: false // Remove __v field
});

// Unique index only for user field
ProfessorSchema.index({ user: 1 }, { unique: true, sparse: true });

export const Professor = model<IProfessorDocument>('Professor', ProfessorSchema);