import { FastifyInstance } from 'fastify';
import { HomeworkController } from '../controllers/homework.controller';

export default async function homeworkRoutes(fastify: FastifyInstance) {
  const homeworkController = new HomeworkController();

  // Get all homeworks
  fastify.get('/', {
    schema: {
      tags: ['Homework'],
      summary: 'Get all homeworks',
      description: 'Retrieve a list of all homeworks with their lecture and student information',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              lecture: { type: 'object' },
              lectureCode: { type: 'string' },
              group: { type: 'string' },
              subgroup: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              dueDate: { type: 'string', format: 'date-time' },
              isUnlimited: { type: 'boolean' },
              student: { type: 'object' },
              fileId: { type: 'string' },
              fileName: { type: 'string' },
              submittedAt: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['pending', 'submitted', 'graded'] },
              grade: { type: 'number' },
              feedback: { type: 'string' }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, homeworkController.getAllHomeworks);

  // Get homework by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Homework'],
      summary: 'Get homework by ID',
      description: 'Retrieve a specific homework by its ID',
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
            lecture: { type: 'object' },
            lectureCode: { type: 'string' },
            group: { type: 'string' },
            subgroup: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            isUnlimited: { type: 'boolean' },
            student: { type: 'object' },
            fileId: { type: 'string' },
            fileName: { type: 'string' },
            submittedAt: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pending', 'submitted', 'graded'] },
            grade: { type: 'number' },
            feedback: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, homeworkController.getHomeworkById);

  // Get homeworks by lecture
  fastify.get('/lecture/:lectureId', {
    schema: {
      tags: ['Homework'],
      summary: 'Get homeworks by lecture',
      description: 'Retrieve all homeworks for a specific lecture',
      params: {
        type: 'object',
        required: ['lectureId'],
        properties: {
          lectureId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              lecture: { type: 'object' },
              lectureCode: { type: 'string' },
              group: { type: 'string' },
              subgroup: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              dueDate: { type: 'string', format: 'date-time' },
              isUnlimited: { type: 'boolean' },
              student: { type: 'object' },
              fileId: { type: 'string' },
              fileName: { type: 'string' },
              submittedAt: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['pending', 'submitted', 'graded'] },
              grade: { type: 'number' },
              feedback: { type: 'string' }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, homeworkController.getHomeworksByLecture);

  // Get homeworks by student
  fastify.get('/student/:studentId', {
    schema: {
      tags: ['Homework'],
      summary: 'Get homeworks by student',
      description: 'Retrieve all homeworks for a specific student',
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              lecture: { type: 'object' },
              lectureCode: { type: 'string' },
              group: { type: 'string' },
              subgroup: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              dueDate: { type: 'string', format: 'date-time' },
              isUnlimited: { type: 'boolean' },
              student: { type: 'object' },
              fileId: { type: 'string' },
              fileName: { type: 'string' },
              submittedAt: { type: 'string', format: 'date-time' },
              status: { type: 'string', enum: ['pending', 'submitted', 'graded'] },
              grade: { type: 'number' },
              feedback: { type: 'string' }
            }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, homeworkController.getHomeworksByStudent);

  // Create homework
  fastify.post('/', {
    schema: {
      tags: ['Homework'],
      summary: 'Create a new homework',
      description: 'Create a new homework assignment for a lecture',
      body: {
        type: 'object',
        required: ['lectureCode', 'group', 'subgroup', 'title', 'description'],
        properties: {
          lectureCode: { type: 'string' },
          group: { type: 'string' },
          subgroup: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          isUnlimited: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            homework: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                lecture: { type: 'object' },
                lectureCode: { type: 'string' },
                group: { type: 'string' },
                subgroup: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                dueDate: { type: 'string', format: 'date-time' },
                isUnlimited: { type: 'boolean' },
                status: { type: 'string', enum: ['pending', 'submitted', 'graded'] }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, homeworkController.createHomework);

  // Update homework
  fastify.put('/:id', {
    schema: {
      tags: ['Homework'],
      summary: 'Update a homework',
      description: 'Update an existing homework assignment',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          isUnlimited: { type: 'boolean' },
          status: { type: 'string', enum: ['pending', 'submitted', 'graded'] },
          grade: { type: 'number' },
          feedback: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            lecture: { type: 'object' },
            lectureCode: { type: 'string' },
            group: { type: 'string' },
            subgroup: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            isUnlimited: { type: 'boolean' },
            student: { type: 'object' },
            fileId: { type: 'string' },
            fileName: { type: 'string' },
            submittedAt: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pending', 'submitted', 'graded'] },
            grade: { type: 'number' },
            feedback: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, homeworkController.updateHomework);

  // Delete homework
  fastify.delete('/:id', {
    schema: {
      tags: ['Homework'],
      summary: 'Delete a homework',
      description: 'Delete an existing homework assignment',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        204: {
          type: 'null'
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, homeworkController.deleteHomework);

  // Submit homework
  fastify.post('/:id/submit', {
    schema: {
      tags: ['Homework'],
      summary: 'Submit a homework',
      description: 'Submit a homework assignment with file upload',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
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
      },
      response: {
        200: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            lecture: { type: 'object' },
            lectureCode: { type: 'string' },
            group: { type: 'string' },
            subgroup: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            isUnlimited: { type: 'boolean' },
            student: { type: 'object' },
            fileId: { type: 'string' },
            fileName: { type: 'string' },
            submittedAt: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pending', 'submitted', 'graded'] }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, homeworkController.submitHomework);

  // Grade homework
  fastify.post('/:id/grade', {
    schema: {
      tags: ['Homework'],
      summary: 'Grade a homework',
      description: 'Grade a submitted homework assignment',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['grade'],
        properties: {
          grade: { type: 'number', minimum: 0, maximum: 10 },
          feedback: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            homework: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, homeworkController.gradeHomework);
}