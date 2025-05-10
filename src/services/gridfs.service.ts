import { GridFSBucket, ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { connectToMongoDB } from '../database/mongo';

export class GridFSService {
  private static bucket: GridFSBucket;

  private static async getBucket(): Promise<GridFSBucket> {
    if (!this.bucket) {
      await connectToMongoDB();
      if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
      }
      this.bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'homework_files'
      });
    }
    return this.bucket;
  }

  static async uploadFile(file: { filename: string; mimetype: string; buffer: Buffer }): Promise<string> {
    const bucket = await this.getBucket();
    const uploadStream = bucket.openUploadStream(file.filename, {
      contentType: file.mimetype
    });

    return new Promise((resolve, reject) => {
      uploadStream.on('finish', () => {
        resolve(uploadStream.id.toString());
      });

      uploadStream.on('error', (error) => {
        reject(error);
      });

      uploadStream.end(file.buffer);
    });
  }

  static async downloadFile(fileId: string): Promise<{ stream: NodeJS.ReadableStream; filename: string; contentType: string }> {
    const bucket = await this.getBucket();
    const _id = new ObjectId(fileId);
    const files = await bucket.find({ _id }).toArray();
    
    if (files.length === 0) {
      throw new Error('File not found');
    }

    const file = files[0];
    const downloadStream = bucket.openDownloadStream(_id);

    return {
      stream: downloadStream,
      filename: file.filename,
      contentType: file.contentType || 'application/octet-stream'
    };
  }

  static async deleteFile(fileId: string): Promise<void> {
    const bucket = await this.getBucket();
    const _id = new ObjectId(fileId);
    await bucket.delete(_id);
  }

  static async getFileInfo(fileId: string): Promise<{ filename: string; contentType: string; length: number; uploadDate: Date }> {
    const bucket = await this.getBucket();
    const _id = new ObjectId(fileId);
    const files = await bucket.find({ _id }).toArray();
    
    if (files.length === 0) {
      throw new Error('File not found');
    }

    const file = files[0];
    return {
      filename: file.filename,
      contentType: file.contentType || 'application/octet-stream',
      length: file.length,
      uploadDate: file.uploadDate
    };
  }
} 