import { FastifyInstance } from 'fastify';
import { schemas } from '../schemas';
import {
  submitHomework,
  getHomework,
  getStudentHomeworks,
  getLectureHomeworks,
  gradeHomework
} from '../controllers/homework.controller';

export default async function homeworkRoutes(fastify: FastifyInstance) {
  // Submit homework
  fastify.post<{
    Body: {
      file: {
        buffer: Buffer;
        filename: string;
        mimetype: string;
      };
      studentId: string;
      lectureId: string;
    };
  }>('/submit', {
    schema: {
      tags: ['Homework'],
      summary: 'Submit homework',
      description: 'Submit a new homework file for a specific lecture',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      body: {
        type: 'object',
        required: ['file', 'studentId', 'lectureId'],
        properties: {
          file: {
            type: 'object',
            properties: {
              buffer: { type: 'string', format: 'binary' },
              filename: { type: 'string' },
              mimetype: { type: 'string' }
            }
          },
          studentId: { type: 'string' },
          lectureId: { type: 'string' }
        }
      },
      response: {
        201: {
          description: 'Homework successfully submitted',
          type: 'object',
          properties: {
            message: { type: 'string' },
            homeworkId: { type: 'string' },
            fileId: { type: 'string' },
            studentInfo: { $ref: 'User' },
            lectureInfo: { $ref: 'Lecture' }
          }
        },
        400: { $ref: 'Error' },
        401: { $ref: 'Error' },
        404: { $ref: 'Error' }
      }
    }
  }, submitHomework);

  // Get homework by ID
  fastify.get<{
    Params: { homeworkId: string };
  }>('/:homeworkId', {
    schema: {
      tags: ['Homework'],
      summary: 'Get homework by ID',
      description: 'Retrieve homework details by its ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['homeworkId'],
        properties: {
          homeworkId: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Homework details',
          type: 'object',
          properties: {
            homework: { $ref: 'Homework' }
          }
        },
        401: { $ref: 'Error' },
        404: { $ref: 'Error' }
      }
    }
  }, getHomework);

  // Get student's homework
  fastify.get<{
    Params: { studentId: string };
  }>('/student/:studentId', {
    schema: {
      tags: ['Homework'],
      summary: 'Get student\'s homework',
      description: 'Retrieve all homework submissions for a specific student',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'List of homework submissions',
          type: 'object',
          properties: {
            homework: {
              type: 'array',
              items: { $ref: 'Homework' }
            }
          }
        },
        401: { $ref: 'Error' },
        404: { $ref: 'Error' }
      }
    }
  }, getStudentHomeworks);

  // Get lecture's homework
  fastify.get<{
    Params: { lectureId: string };
  }>('/lecture/:lectureId', {
    schema: {
      tags: ['Homework'],
      summary: 'Get lecture\'s homework',
      description: 'Retrieve all homework submissions for a specific lecture',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['lectureId'],
        properties: {
          lectureId: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'List of homework submissions',
          type: 'object',
          properties: {
            homework: {
              type: 'array',
              items: { $ref: 'Homework' }
            }
          }
        },
        401: { $ref: 'Error' },
        404: { $ref: 'Error' }
      }
    }
  }, getLectureHomeworks);

  // Grade homework
  fastify.post<{
    Params: { homeworkId: string };
    Body: { grade: number; feedback?: string };
  }>('/:homeworkId/grade', {
    schema: {
      tags: ['Homework'],
      summary: 'Grade homework',
      description: 'Grade a submitted homework',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['homeworkId'],
        properties: {
          homeworkId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['grade'],
        properties: {
          grade: { type: 'number', minimum: 1, maximum: 10 },
          feedback: { type: 'string' }
        }
      },
      response: {
        200: {
          description: 'Graded homework',
          type: 'object',
          properties: {
            homework: { $ref: 'Homework' }
          }
        },
        400: { $ref: 'Error' },
        401: { $ref: 'Error' },
        403: { $ref: 'Error' },
        404: { $ref: 'Error' }
      }
    }
  }, gradeHomework);
} 