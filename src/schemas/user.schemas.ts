export const userSchemas = {
  User: {
    type: 'object',
    properties: {
      _id: { type: 'string' },
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: ['Student', 'Teacher', 'Admin'] },
      name: { type: 'string' },
      cnp: { type: 'string' },
      matriculationNumber: { type: 'string' },
      phone: { type: 'string' },
      address: { type: 'string' },
      academicInfo: {
        type: 'object',
        properties: {
          program: { type: 'string' },
          semester: { type: 'number' },
          groupName: { type: 'string' },
          subgroupIndex: { type: 'string' },
          studentId: { type: 'string' },
          advisor: { type: 'string' },
          gpa: { type: 'number' },
          specializationShortName: { type: 'string' },
          facultyId: { type: 'string' },
          groupId: { type: 'string' }
        }
      }
    }
  }
}; 