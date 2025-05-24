import { FastifyInstance } from 'fastify';
import { CourseGradeController } from '../controllers/course-grade.controller';
import { courseGradeSchema, courseGradeUpdateSchema, gradeReviewSchema, structuredGradesSchema, lectureStatisticsSchema } from '../schemas/course-grade.schemas';

const courseGradeController = new CourseGradeController();

export default async function (fastify: FastifyInstance) {
  // Register schemas for $ref resolution
  fastify.addSchema({ $id: 'CourseGrade', ...courseGradeSchema });
  fastify.addSchema({ $id: 'CourseGradeUpdate', ...courseGradeUpdateSchema });
  fastify.addSchema({ $id: 'GradeReview', ...gradeReviewSchema });
  fastify.addSchema({ $id: 'StructuredGrades', ...structuredGradesSchema });
  fastify.addSchema({ $id: 'LectureStatistics', ...lectureStatisticsSchema });

  // Create a new course grade
  fastify.post('/', {
    schema: {
      tags: ['Grades'],
      summary: 'Create a new course grade',
      description: 'Create a new grade for a student in a specific lecture',
      body: { $ref: 'CourseGrade' },
      response: {
        201: { $ref: 'CourseGrade' },
        400: { $ref: 'Error' },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, courseGradeController.createGrade);

  // Get all grades for a student (all years and semesters)
  fastify.get('/student/:studentId', {
    schema: {
      tags: ['Grades'],
      summary: 'Get all grades for a student',
      description: 'Get all grades for a specific student, for all years and semesters. Each grade object includes a lecture field with code and title.',
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
              studentId: { type: 'string' },
              academicYear: { type: 'string' },
              semester: { type: 'number' },
              midtermGrade: { type: 'number' },
              finalGrade: { type: 'number' },
              projectGrade: { type: 'number' },
              homeworkGrade: { type: 'number' },
              attendanceGrade: { type: 'number' },
              totalGrade: { type: 'number' },
              status: { type: 'string' },
              retakeCount: { type: 'number' },
              lastUpdated: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              lecture: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  title: { type: 'string' }
                }
              }
            }
          }
        },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, courseGradeController.getAllStudentGrades);

  // Get all grades for a lecture
  fastify.get('/lecture/:lectureId', {
    schema: {
      tags: ['Grades'],
      summary: 'Get lecture grades',
      description: 'Get all grades for a specific lecture. Each grade object includes a lecture field with code and title.',
      params: {
        type: 'object',
        required: ['lectureId'],
        properties: {
          lectureId: { type: 'string' }
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
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              studentId: { type: 'string' },
              academicYear: { type: 'string' },
              semester: { type: 'number' },
              midtermGrade: { type: 'number' },
              finalGrade: { type: 'number' },
              projectGrade: { type: 'number' },
              homeworkGrade: { type: 'number' },
              attendanceGrade: { type: 'number' },
              totalGrade: { type: 'number' },
              status: { type: 'string' },
              retakeCount: { type: 'number' },
              lastUpdated: { type: 'string', format: 'date-time' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              lecture: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  title: { type: 'string' }
                }
              }
            }
          }
        },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, courseGradeController.getLectureGrades);

  // Get grade statistics for a lecture
  fastify.get('/statistics/lecture/:lectureId', {
    schema: {
      tags: ['Grades'],
      summary: 'Get lecture statistics',
      description: 'Get grade statistics for a specific lecture',
      params: {
        type: 'object',
        required: ['lectureId'],
        properties: {
          lectureId: { type: 'string' }
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
        200: { $ref: 'LectureStatistics' },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, courseGradeController.getLectureStatistics);

  // Request a grade review
  fastify.post('/:id/review', {
    schema: {
      tags: ['Grades'],
      summary: 'Request grade review',
      description: 'Request a review for a specific grade',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: { $ref: 'GradeReview' },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        400: { $ref: 'Error' },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, courseGradeController.requestReview);

  // Update a course grade
  fastify.put('/:id', {
    schema: {
      tags: ['Grades'],
      summary: 'Update course grade',
      description: 'Update an existing course grade',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      body: { $ref: 'CourseGradeUpdate' },
      response: {
        200: { $ref: 'CourseGrade' },
        400: { $ref: 'Error' },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, courseGradeController.updateGrade);

  // Get a specific course grade
  fastify.get('/:id', {
    schema: {
      tags: ['Grades'],
      summary: 'Get course grade',
      description: 'Get a specific course grade by ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: { $ref: 'CourseGrade' },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, courseGradeController.getGrade);

  // Get structured grades for a student
  fastify.get('/grades/:studentId/structured', {
    schema: {
      tags: ['Grades'],
      summary: 'Get structured student grades',
      description: 'Returns academic year → semester → courses structure with GPA calculation. Each course object includes code, title, and credits.',
      params: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            academicYears: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  year: { type: 'string' },
                  semesters: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        semester: { type: 'number' },
                        courses: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              code: { type: 'string' },
                              title: { type: 'string' },
                              grade: { type: 'number' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        404: { $ref: 'Error' },
        500: { $ref: 'Error' }
      }
    }
  }, courseGradeController.getStructuredGrades);
}
