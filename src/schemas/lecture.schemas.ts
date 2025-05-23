export const lectureSchemas = {
  Lecture: {
    type: 'object',
    required: ['code', 'title', 'type', 'teacher', 'groupId', 'studyYear'],
    properties: {
      _id: { type: 'string' },
      code: { type: 'string' },
      title: { type: 'string' },
      type: { type: 'string' },
      teacher: { type: 'string' },
      description: { type: 'string' },
      credits: { type: 'number' },
      semester: { type: 'number' },
      year: { type: 'number' },
      groupId: { type: 'string' },
      studyYear: { type: 'number' }
    }
  }
}; 