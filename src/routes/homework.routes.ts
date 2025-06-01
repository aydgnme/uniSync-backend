import { FastifyInstance } from 'fastify';
import { HomeworkController } from '../controllers/homework.controller';

export default async function homeworkRoutes(fastify: FastifyInstance) {
  const homeworkController = new HomeworkController();

  // Get all classrooms
  fastify.get('/classrooms', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get all classrooms',
      description: 'Retrieve a list of all classrooms',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              code: { type: 'string' },
              title: { type: 'string' },
              instructor: { type: 'string' },
              room: { type: 'string' },
              time: { type: 'string' },
              color: { type: 'string' },
              banner: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      }
    }
  }, homeworkController.getAllClassrooms);

  // Get classroom by ID
  fastify.get('/classrooms/:id', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get classroom by ID',
      description: 'Retrieve a specific classroom with all its details',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            code: { type: 'string' },
            title: { type: 'string' },
            instructor: { type: 'string' },
            room: { type: 'string' },
            time: { type: 'string' },
            color: { type: 'string' },
            banner: { type: 'string' },
            description: { type: 'string' },
            students: { type: 'array', items: { type: 'object' } },
            materials: { type: 'array', items: { type: 'object' } },
            assignments: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  }, homeworkController.getClassroomById);

  // Create classroom
  fastify.post('/classrooms', {
    schema: {
      tags: ['Classroom'],
      summary: 'Create a new classroom',
      description: 'Create a new classroom with basic information',
      body: {
        type: 'object',
        required: ['code', 'title', 'instructor'],
        properties: {
          code: { type: 'string' },
          title: { type: 'string' },
          instructor: { type: 'string' },
          room: { type: 'string' },
          time: { type: 'string' },
          color: { type: 'string' },
          banner: { type: 'string' },
          description: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            classroom: { type: 'object' }
          }
        }
      }
    }
  }, homeworkController.createClassroom);

  // Add material to classroom
  fastify.post('/classrooms/:id/materials', {
    schema: {
      tags: ['Classroom'],
      summary: 'Add material to classroom',
      description: 'Add a new material to a specific classroom',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['title', 'fileId', 'fileName'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
            fileId: { type: 'string' },
          fileName: { type: 'string' }
        }
      }
    }
  }, homeworkController.addMaterial);

  // Create assignment
  fastify.post('/classrooms/:id/assignments', {
    schema: {
      tags: ['Classroom'],
      summary: 'Create assignment',
      description: 'Create a new assignment in a specific classroom',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
          type: 'object',
        required: ['title', 'description'],
          properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          isUnlimited: { type: 'boolean' }
        }
      }
    }
  }, homeworkController.createAssignment);

  // Submit assignment
  fastify.post('/classrooms/:classroomId/assignments/:assignmentId/submit', {
    schema: {
      tags: ['Classroom'],
      summary: 'Submit assignment',
      description: 'Submit an assignment for a specific classroom',
      params: {
        type: 'object',
        required: ['classroomId', 'assignmentId'],
        properties: {
          classroomId: { type: 'string' },
          assignmentId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['studentId', 'fileId', 'fileName'],
        properties: {
          studentId: { type: 'string' },
          fileId: { type: 'string' },
          fileName: { type: 'string' }
        }
      }
    }
  }, homeworkController.submitAssignment);

  // Grade assignment
  fastify.post('/classrooms/:classroomId/assignments/:assignmentId/grade', {
    schema: {
      tags: ['Classroom'],
      summary: 'Grade assignment',
      description: 'Grade a submitted assignment',
      params: {
          type: 'object',
        required: ['classroomId', 'assignmentId'],
          properties: {
          classroomId: { type: 'string' },
          assignmentId: { type: 'string' }
          }
        },
      body: {
          type: 'object',
        required: ['studentId', 'grade'],
          properties: {
          studentId: { type: 'string' },
          grade: { type: 'number', minimum: 0, maximum: 10 },
          feedback: { type: 'string' }
        }
      }
    }
  }, homeworkController.gradeAssignment);

  // Enroll student
  fastify.post('/classrooms/:id/enroll', {
    schema: {
      tags: ['Classroom'],
      summary: 'Enroll student',
      description: 'Enroll a student in a specific classroom',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string' }
        }
      }
    }
  }, homeworkController.enrollStudent);
}