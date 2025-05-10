export const homeworkSchemas = {
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
}; 