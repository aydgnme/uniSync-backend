import { FastifyRequest, FastifyReply } from 'fastify';
import { GridFSService } from '../services/gridfs.service';

interface UploadRequest extends FastifyRequest {
  body: {
    file: {
      buffer: Buffer;
      filename: string;
      mimetype: string;
    };
  };
}

export const uploadFile = async (request: UploadRequest, reply: FastifyReply) => {
  try {
    const { file } = request.body;
    if (!file) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const fileId = await GridFSService.uploadFile({
      filename: file.filename,
      mimetype: file.mimetype,
      buffer: file.buffer
    });

    return reply.code(200).send({ fileId });
  } catch (error) {
    console.error('File upload error:', error);
    return reply.code(500).send({
      error: 'Failed to upload file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const downloadFile = async (
  request: FastifyRequest<{ Params: { fileId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { fileId } = request.params;
    const { stream, filename, contentType } = await GridFSService.downloadFile(fileId);

    reply.header('Content-Type', contentType);
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);

    return reply.send(stream);
  } catch (error) {
    console.error('File download error:', error);
    return reply.code(500).send({
      error: 'Failed to download file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteFile = async (
  request: FastifyRequest<{ Params: { fileId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { fileId } = request.params;
    await GridFSService.deleteFile(fileId);
    return reply.code(200).send({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File deletion error:', error);
    return reply.code(500).send({
      error: 'Failed to delete file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getFileInfo = async (
  request: FastifyRequest<{ Params: { fileId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { fileId } = request.params;
    const fileInfo = await GridFSService.getFileInfo(fileId);
    return reply.code(200).send(fileInfo);
  } catch (error) {
    console.error('File info error:', error);
    return reply.code(500).send({
      error: 'Failed to get file info',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 