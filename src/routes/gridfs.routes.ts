import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { GridFSService } from '../services/gridfs.service';
import { MultipartFile } from '@fastify/multipart';

interface UploadRequest extends FastifyRequest {
  body: {
    file: {
      buffer: Buffer;
      filename: string;
      mimetype: string;
    };
  };
}

export default async function gridfsRoutes(fastify: FastifyInstance) {
  // Upload file
  fastify.post('/upload', {
    schema: {
      tags: ['files'],
      summary: 'File upload',
      consumes: ['multipart/form-data'],
      response: {
        201: {
          description: 'File uploaded successfully',
          type: 'object',
          properties: {
            fileId: { type: 'string' }
          }
        },
        400: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, async (request, reply) => {
    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ message: 'File not found' });
      }

      const buffer = await data.toBuffer();
      const fileId = await GridFSService.uploadFile({
        filename: data.filename,
        mimetype: data.mimetype,
        buffer
      });

      return reply.code(201).send({ fileId });
    } catch (error) {
      console.error('File upload error:', error);
      return reply.code(500).send({ message: 'An error occurred while uploading the file' });
    }
  });

  // Download file
  fastify.get<{ Params: { fileId: string } }>('/:fileId', {
    schema: {
      tags: ['files'],
      summary: 'File download',
      params: {
        type: 'object',
        required: ['fileId'],
        properties: {
          fileId: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'File content',
          type: 'string',
          format: 'binary'
        },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, async (request, reply) => {
    try {
      const { fileId } = request.params;
      const { stream, filename, contentType } = await GridFSService.downloadFile(fileId);
      
      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      
      return reply.send(stream);
    } catch (error) {
      console.error('File download error:', error);
      return reply.code(500).send({ message: 'An error occurred while downloading the file' });
    }
  });

  // Delete file
  fastify.delete<{ Params: { fileId: string } }>('/:fileId', {
    schema: {
      tags: ['files'],
      summary: 'File deletion',
      params: {
        type: 'object',
        required: ['fileId'],
        properties: {
          fileId: { type: 'string' }
        }
      },
      response: {
        204: {
          description: 'File deleted successfully'
        },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, async (request, reply) => {
    try {
      const { fileId } = request.params;
      await GridFSService.deleteFile(fileId);
      return reply.code(204).send();
    } catch (error) {
      console.error('File deletion error:', error);
      return reply.code(500).send({ message: 'An error occurred while deleting the file' });
    }
  });

  // Get file info
  fastify.get<{ Params: { fileId: string } }>('/:fileId/info', {
    schema: {
      tags: ['files'],
      summary: 'Get file information',
      params: {
        type: 'object',
        required: ['fileId'],
        properties: {
          fileId: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'File information',
          type: 'object',
          properties: {
            filename: { type: 'string' },
            contentType: { type: 'string' },
            length: { type: 'number' },
            uploadDate: { type: 'string', format: 'date-time' }
          }
        },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, async (request, reply) => {
    try {
      const { fileId } = request.params;
      const fileInfo = await GridFSService.getFileInfo(fileId);
      return reply.send(fileInfo);
    } catch (error) {
      console.error('Get file info error:', error);
      return reply.code(500).send({ message: 'An error occurred while getting file information' });
    }
  });
} 