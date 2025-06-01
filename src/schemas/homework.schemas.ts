export const homeworkSchemas = {
  Classroom: {
    type: 'object',
    required: ['code', 'title', 'instructor'],
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
      students: {
        type: 'array',
        items: { type: 'string' }
      },
      materials: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
      fileId: { type: 'string' },
      fileName: { type: 'string' },
            uploadedAt: { type: 'string', format: 'date-time' }
          }
        }
      },
      assignments: {
        type: 'array',
        items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
            description: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            isUnlimited: { type: 'boolean' },
            submissions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  studentId: { type: 'string' },
                  fileId: { type: 'string' },
                  fileName: { type: 'string' },
                  submittedAt: { type: 'string', format: 'date-time' },
                  status: { type: 'string', enum: ['pending', 'submitted', 'graded'] },
                  grade: { type: 'number', minimum: 0, maximum: 10 },
                  feedback: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
}; 