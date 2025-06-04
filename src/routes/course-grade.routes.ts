import { FastifyInstance } from 'fastify';
import { CourseGradeController } from '../controllers/course-grade.controller';
import { courseGradeSchema, courseGradeUpdateSchema, gradeReviewSchema, structuredGradesSchema, lectureStatisticsSchema } from '../schemas/course-grade.schemas';
import { authJWT } from '../middlewares/auth.jwt.middleware';

const courseGradeController = new CourseGradeController();

export default async function courseGradeRoutes(fastify: FastifyInstance) {
  // Add JWT authentication hook for all routes
  fastify.addHook('onRequest', authJWT);

  // Register schemas for $ref resolution
  fastify.addSchema({ $id: 'CourseGrade', ...courseGradeSchema });
  fastify.addSchema({ $id: 'CourseGradeUpdate', ...courseGradeUpdateSchema });
  fastify.addSchema({ $id: 'GradeReview', ...gradeReviewSchema });
  fastify.addSchema({ $id: 'StructuredGrades', ...structuredGradesSchema });
  fastify.addSchema({ $id: 'LectureStatistics', ...lectureStatisticsSchema });

  // Create a new grade
  fastify.post('/', {
    schema: {
      tags: ['Grades'],
      summary: 'Create a new grade',
      description: 'Create a new grade for a student in a specific course',
      body: {
        type: 'object',
        required: ['student_id', 'course_id', 'exam_type', 'score', 'letter_grade', 'graded_at', 'created_by'],
        properties: {
          student_id: { type: 'string', format: 'uuid' },
          course_id: { type: 'string', format: 'uuid' },
          exam_type: { type: 'string', enum: ['midterm', 'final', 'project', 'homework'] },
          score: { type: 'number' },
          letter_grade: { type: 'string' },
          graded_at: { type: 'string', format: 'date-time' },
          created_by: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            student_id: { type: 'string', format: 'uuid' },
            course_id: { type: 'string', format: 'uuid' },
            exam_type: { type: 'string', enum: ['midterm', 'final', 'project', 'homework'] },
            score: { type: 'number' },
            letter_grade: { type: 'string' },
            graded_at: { type: 'string', format: 'date-time' },
            created_by: { type: 'string', format: 'uuid' }
          }
        },
        400: { $ref: 'Error' },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, courseGradeController.createGrade);

  // Get authenticated user's grades
  fastify.get('/my', {
    schema: {
      tags: ['Grades'],
      summary: 'Get authenticated user grades',
      description: 'Get all grades for the authenticated user',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  studentId: { type: 'string', format: 'uuid' },
                  courseId: { type: 'string', format: 'uuid' },
                  examType: { type: 'string', enum: ['midterm', 'final', 'project', 'homework'] },
                  score: { type: 'number' },
                  letterGrade: { type: 'string' },
                  gradedAt: { type: 'string', format: 'date-time' },
                  createdBy: { type: 'string', format: 'uuid' },
                  academicYear: { type: 'string' },
                  semester: { type: 'number' },
                  course: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      title: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'No grades found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, courseGradeController.getMyGrades);

  // getSummarizedGrades
  fastify.get('/summarized', {
    schema: {
      tags: ['Grades'],
      summary: 'Get summarized grades',
      description: 'Get summarized grades for the authenticated user',
    },
    handler: courseGradeController.getSummarizedGrades
  });

  // Get all grades for a student
  fastify.get('/student/:studentId', {
    schema: {
      tags: ['Grades'],
      summary: 'Get all grades for a student',
      description: 'Get all grades for a specific student',
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  studentId: { type: 'string', format: 'uuid' },
                  courseId: { type: 'string', format: 'uuid' },
                  examType: { type: 'string', enum: ['midterm', 'final', 'project', 'homework'] },
                  score: { type: 'number' },
                  letterGrade: { type: 'string' },
                  gradedAt: { type: 'string', format: 'date-time' },
                  createdBy: { type: 'string', format: 'uuid' },
                  academicYear: { type: 'string' },
                  semester: { type: 'number' },
                  course: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      title: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'No grades found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, courseGradeController.getAllStudentGrades);

  // Get all grades for a lecture
  fastify.get('/lecture/:lectureId', {
    schema: {
      tags: ['Grades'],
      summary: 'Get lecture grades',
      description: 'Get all grades for a specific lecture',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['lectureId'],
        properties: {
          lectureId: { type: 'string', format: 'uuid' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          academicYear: { type: 'string', pattern: '^\\d{4}-\\d{4}$' },
          semester: { type: 'number', minimum: 1, maximum: 2 }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  studentId: { type: 'string', format: 'uuid' },
                  courseId: { type: 'string', format: 'uuid' },
                  examType: { type: 'string', enum: ['midterm', 'final', 'project', 'homework'] },
                  score: { type: 'number' },
                  letterGrade: { type: 'string' },
                  gradedAt: { type: 'string', format: 'date-time' },
                  createdBy: { type: 'string', format: 'uuid' },
                  academicYear: { type: 'string' },
                  semester: { type: 'number' },
                  course: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      title: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'No grades found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, courseGradeController.getLectureGrades);

  // Get grade statistics for a lecture
  fastify.get('/statistics/lecture/:lectureId', {
    schema: {
      tags: ['Grades'],
      summary: 'Get lecture statistics',
      description: 'Get grade statistics for a specific lecture',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['lectureId'],
        properties: {
          lectureId: { type: 'string', format: 'uuid' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          academicYear: { type: 'string', pattern: '^\\d{4}-\\d{4}$' },
          semester: { type: 'number', minimum: 1, maximum: 2 }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { $ref: 'LectureStatistics' }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'No statistics found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, courseGradeController.getLectureStatistics);

  // Update a course grade
  fastify.put('/:id', {
    schema: {
      tags: ['Grades'],
      summary: 'Update course grade',
      description: 'Update an existing course grade',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: { $ref: 'CourseGradeUpdate' },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { $ref: 'CourseGrade' }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Grade not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, courseGradeController.updateGrade);

  // Get a specific course grade
  fastify.get('/:id', {
    schema: {
      tags: ['Grades'],
      summary: 'Get course grade',
      description: 'Get a specific course grade by ID',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { $ref: 'CourseGrade' }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'Grade not found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, courseGradeController.getGrade);

  // Get structured grades for a student
  fastify.get('/grades/:studentId/structured', {
    schema: {
      tags: ['Grades'],
      summary: 'Get structured student grades',
      description: 'Returns academic year → semester → courses structure with GPA calculation',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          description: 'Successful response',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { $ref: 'StructuredGrades' }
          }
        },
        403: {
          description: 'Access denied',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          description: 'No grades found',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        500: {
          description: 'Internal server error',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, courseGradeController.getStructuredGrades);
}
