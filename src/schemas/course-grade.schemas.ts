export const courseGradeSchema = {
    type: 'object',
    required: ['studentId', 'lectureId', 'academicYear', 'semester', 'totalGrade', 'status', 'retakeCount'],
    properties: {
      _id: { type: 'string' },
      studentId: { type: 'string' },
      lectureId: { type: 'string' },
      academicYear: { type: 'string' },
      semester: { type: 'number' },
      midtermGrade: { type: 'number' },
      finalGrade: { type: 'number' },
      projectGrade: { type: 'number' },
      homeworkGrade: { type: 'number' },
      attendanceGrade: { type: 'number' },
      totalGrade: { type: 'number' },
      status: { type: 'string', enum: ['PASSED', 'FAILED', 'IN_PROGRESS'] },
      retakeCount: { type: 'number' },
      lastUpdated: { type: 'string', format: 'date-time' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  };
  
  export const courseGradeUpdateSchema = {
    type: 'object',
    properties: {
      midtermGrade: { type: 'number' },
      finalGrade: { type: 'number' },
      projectGrade: { type: 'number' },
      homeworkGrade: { type: 'number' },
      attendanceGrade: { type: 'number' }
    }
  };
  
  export const gradeReviewSchema = {
    type: 'object',
    required: ['reason'],
    properties: {
      reason: { type: 'string', minLength: 10, maxLength: 500 }
    }
  };
  
  export const structuredGradesSchema = {
    type: 'object',
    properties: {
      userId: { type: 'string' },
      matriculationNumber: { type: 'string' },
      fullName: { type: 'string' },
      program: { type: 'string' },
      specializationShortName: { type: 'string' },
      grades: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            academicYear: { type: 'string' },
            gpa: { type: 'number' },
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
                        grade: { type: 'number' },
                        credits: { type: 'number' }
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
  };
  
  export const lectureStatisticsSchema = {
    type: 'object',
    properties: {
      totalStudents: { type: 'number' },
      passedStudents: { type: 'number' },
      failedStudents: { type: 'number' },
      averageGrade: { type: 'number' },
      gradeDistribution: {
        type: 'object',
        properties: {
          '9-10': { type: 'number' },
          '7-8': { type: 'number' },
          '5-6': { type: 'number' },
          '1-4': { type: 'number' }
        }
      }
    }
  };
  
  export const errorSchema = {
    type: 'object',
    properties: {
      error: { type: 'string' },
      message: { type: 'string' },
      statusCode: { type: 'number' }
    }
  };
  