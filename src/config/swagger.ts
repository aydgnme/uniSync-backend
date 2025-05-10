export const swaggerOptions = {
  openapi: {
    info: {
      title: 'USV Portal API',
      description: 'USV Portal API documentation',
      version: '1.0.0',
      contact: {
        name: 'USV Portal Team',
        email: 'support@usvportal.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.usvportal.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            statusCode: { type: 'number' }
          }
        },
        Homework: {
          type: 'object',
          required: ['student', 'lecture', 'fileId', 'fileName'],
          properties: {
            _id: { type: 'string' },
            student: { type: 'string' },
            lecture: { type: 'string' },
            fileId: { type: 'string' },
            fileName: { type: 'string' },
            submittedAt: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['pending', 'graded'] },
            grade: { type: 'number', minimum: 1, maximum: 10 },
            feedback: { type: 'string' },
            studentInfo: {
              type: 'object',
              properties: {
                nrMatricol: { type: 'string' },
                group: { type: 'string' },
                subgroup: { type: 'string' },
                name: { type: 'string' }
              }
            },
            lectureInfo: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                title: { type: 'string' },
                type: { type: 'string' },
                teacher: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
}; 