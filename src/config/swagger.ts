import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';

export const swaggerOptions: FastifyDynamicSwaggerOptions = {
  openapi: {
    info: {
      title: 'USV Portal API',
      description: 'API documentation for USV Portal',
      version: '1.0.0',
      contact: {
        name: 'USV Portal Team',
        email: 'support@usvportal.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['message', 'code', 'statusCode'],
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' }
          }
        },
        CourseGrade: {
          type: 'object',
          required: ['studentId', 'lectureId', 'academicYear', 'semester'],
          properties: {
            _id: { type: 'string' },
            studentId: { type: 'string' },
            lectureId: { type: 'string' },
            academicYear: { type: 'string' },
            semester: { type: 'number', minimum: 1, maximum: 2 },
            midtermGrade: { type: 'number', minimum: 0, maximum: 100 },
            finalGrade: { type: 'number', minimum: 0, maximum: 100 },
            makeUpGrade: { type: 'number', minimum: 0, maximum: 100 },
            letterGrade: { type: 'string' },
            gpa: { type: 'number', minimum: 0, maximum: 4 },
            status: { type: 'string', enum: ['active', 'passive'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        CourseGradeUpdate: {
          type: 'object',
          properties: {
            midtermGrade: { type: 'number', minimum: 0, maximum: 100 },
            finalGrade: { type: 'number', minimum: 0, maximum: 100 },
            makeUpGrade: { type: 'number', minimum: 0, maximum: 100 },
            letterGrade: { type: 'string' },
            gpa: { type: 'number', minimum: 0, maximum: 4 },
            status: { type: 'string', enum: ['active', 'passive'] }
          }
        },
        GradeReview: {
          type: 'object',
          required: ['reason'],
          properties: {
            reason: { type: 'string' },
            details: { type: 'string' }
          }
        },
        StructuredGrades: {
          type: 'object',
          properties: {
            academicYears: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  semesters: {
                    type: 'object',
                    additionalProperties: {
                      type: 'object',
                      properties: {
                        courses: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              lectureId: { type: 'string' },
                              title: { type: 'string' },
                              midtermGrade: { type: 'number' },
                              finalGrade: { type: 'number' },
                              makeUpGrade: { type: 'number' },
                              letterGrade: { type: 'string' },
                              gpa: { type: 'number' }
                            }
                          }
                        },
                        semesterGPA: { type: 'number' }
                      }
                    }
                  },
                  yearGPA: { type: 'number' }
                }
              }
            },
            overallGPA: { type: 'number' }
          }
        },
        LectureStatistics: {
          type: 'object',
          properties: {
            totalStudents: { type: 'number' },
            averageGrade: { type: 'number' },
            gradeDistribution: {
              type: 'object',
              properties: {
                A: { type: 'number' },
                B: { type: 'number' },
                C: { type: 'number' },
                D: { type: 'number' },
                F: { type: 'number' }
              }
            },
            passRate: { type: 'number' }
          }
        },
        Announcement: {
          type: 'object',
          required: ['lecture', 'author', 'content'],
          properties: {
            _id: { type: 'string' },
            lecture: { type: 'string', description: 'Lecture ID' },
            author: { type: 'string', description: 'Author (User) ID' },
            content: { type: 'string', description: 'Announcement content' },
            createdAt: { type: 'string', format: 'date-time' },
            attachments: {
              type: 'array',
              items: { type: 'string' },
              description: 'Attachment URLs'
            }
          }
        },
        AnnouncementCreate: {
          type: 'object',
          required: ['lecture', 'author', 'content'],
          properties: {
            lecture: { type: 'string', description: 'Lecture ID' },
            author: { type: 'string', description: 'Author (User) ID' },
            content: { type: 'string', description: 'Announcement content' },
            attachments: {
              type: 'array',
              items: { type: 'string' },
              description: 'Attachment URLs'
            }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Homework', description: 'Homework management endpoints' },
      { name: 'Grades', description: 'Course grade management endpoints' },
      { name: 'System', description: 'System management endpoints' },
      { name: 'Announcements', description: 'Announcement management endpoints' }
    ]
  }
}; 