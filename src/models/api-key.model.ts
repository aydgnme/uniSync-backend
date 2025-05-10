import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IApiKey extends Document {
  key: string;
  name: string;
  description?: string;
  isActive: boolean;
  usageCount: number;
  usageLimit?: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  createdBy: string;
  allowedIPs?: string[];
  allowedDomains?: string[];
}

const ApiKeySchema = new Schema<IApiKey>({
  key: {
    type: String,
    required: true,
    unique: true,
    default: () => uuidv4()
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  usageLimit: {
    type: Number
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastUsedAt: {
    type: Date
  },
  createdBy: {
    type: String,
    required: true
  },
  allowedIPs: [{
    type: String,
    trim: true
  }],
  allowedDomains: [{
    type: String,
    trim: true
  }]
});

// Middleware: Update timestamp on save
ApiKeySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware: Update lastUsedAt on usage
ApiKeySchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastUsedAt: new Date() });
  next();
});

// Indexes
ApiKeySchema.index({ key: 1 });
ApiKeySchema.index({ isActive: 1 });
ApiKeySchema.index({ expiresAt: 1 });
ApiKeySchema.index({ createdBy: 1 });

const ApiKey = mongoose.model<IApiKey>('ApiKey', ApiKeySchema);

export default ApiKey;