import { MultipartFile } from '@fastify/multipart';

export const multipartOptions = {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  attachFieldsToBody: true,
  onFile: (part: MultipartFile) => {
    part.toBuffer();
  }
}; 