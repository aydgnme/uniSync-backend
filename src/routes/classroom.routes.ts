import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ClassroomController } from '../controllers/classroom.controller';

const classroomController = new ClassroomController();

export default async function classroomRoutes(fastify: FastifyInstance) {
  /**
   * @swagger
   * /classroom/student/{id}:
   *   get:
   *     summary: Get all courses for a student
   *     tags:
   *       - Classroom
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The student's ID (MongoDB ObjectId) or matriculation number
   *     responses:
   *       200:
   *         description: List of courses with detailed information
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   _id:
   *                     type: string
   *                   code:
   *                     type: string
   *                   title:
   *                     type: string
   *                   credits:
   *                     type: number
   *                   evaluationType:
   *                     type: string
   *                   type:
   *                     type: string
   *                   instructor:
   *                     type: string
   *                   room:
   *                     type: string
   *                   time:
   *                     type: string
   *                   color:
   *                     type: string
   *                   banner:
   *                     type: string
   *                   description:
   *                     type: string
   *                   schedule:
   *                     type: object
   *                     properties:
   *                       weekDay:
   *                         type: string
   *                       startTime:
   *                         type: string
   *                       endTime:
   *                         type: string
   *                       room:
   *                         type: string
   *                       weeks:
   *                         type: array
   *                         items:
   *                           type: number
   *                       parity:
   *                         type: string
   *       404:
   *         description: Student not found
   *       500:
   *         description: Internal server error
   */
  fastify.get('/student/:id', {
    schema: {
      description: 'Get all courses for a student',
      tags: ['Classroom'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              code: { type: 'string' },
              title: { type: 'string' },
              credits: { type: 'number' },
              evaluationType: { type: 'string' },
              type: { type: 'string' },
              instructor: { type: 'string' },
              room: { type: 'string' },
              time: { type: 'string' },
              color: { type: 'string' },
              banner: { type: 'string' },
              description: { type: 'string' },
              schedule: {
                type: ['object', 'null'],
                properties: {
                  weekDay: { type: 'string' },
                  startTime: { type: 'string' },
                  endTime: { type: 'string' },
                  room: { type: 'string' },
                  weeks: { 
                    type: 'array',
                    items: { type: 'number' }
                  },
                  parity: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const controller = new ClassroomController();
      return controller.getStudentCourses(request, reply);
    }
  });

  /**
   * @swagger
   * /classroom/stream/{lectureId}:
   *   get:
   *     summary: Get stream (announcements) for a lecture
   *     tags:
   *       - Classroom
   *     parameters:
   *       - in: path
   *         name: lectureId
   *         required: true
   *         schema:
   *           type: string
   *         description: The lecture's ID
   *     responses:
   *       200:
   *         description: List of announcements
   *       404:
   *         description: Lecture not found
   */
  fastify.get('/stream/:lectureId', classroomController.getLectureStream.bind(classroomController));

  /**
   * @swagger
   * /classroom/stream/{lectureId}:
   *   post:
   *     summary: Create a new announcement for a lecture
   *     tags:
   *       - Classroom
   *     parameters:
   *       - in: path
   *         name: lectureId
   *         required: true
   *         schema:
   *           type: string
   *         description: The lecture's ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - text
   *               - author
   *             properties:
   *               text:
   *                 type: string
   *               author:
   *                 type: string
   *     responses:
   *       200:
   *         description: Announcement created successfully
   *       500:
   *         description: Internal server error
   */
  fastify.post('/stream/:lectureId', {
    schema: {
      body: {
        type: 'object',
        required: ['text', 'author'],
        properties: {
          text: { type: 'string' },
          author: { type: 'string' }
        }
      }
    }
  }, classroomController.postLectureAnnouncement.bind(classroomController));

  /**
   * @swagger
   * /classroom/classwork/{lectureId}:
   *   get:
   *     summary: Get classwork (homeworks, quizzes, projects) for a lecture
   *     tags:
   *       - Classroom
   *     parameters:
   *       - in: path
   *         name: lectureId
   *         required: true
   *         schema:
   *           type: string
   *         description: The lecture's ID
   *     responses:
   *       200:
   *         description: List of classwork
   *       404:
   *         description: Lecture not found
   */
  fastify.get('/classwork/:lectureId', classroomController.getLectureClasswork.bind(classroomController));

  /**
   * @swagger
   * /classroom/classwork/{lectureId}:
   *   post:
   *     summary: Create a new assignment for a lecture
   *     tags:
   *       - Classroom
   *     parameters:
   *       - in: path
   *         name: lectureId
   *         required: true
   *         schema:
   *           type: string
   *         description: The lecture's ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - title
   *               - dueDate
   *               - topic
   *               - points
   *             properties:
   *               title:
   *                 type: string
   *               dueDate:
   *                 type: string
   *                 format: date-time
   *               topic:
   *                 type: string
   *               points:
   *                 type: number
   *     responses:
   *       200:
   *         description: Assignment created successfully
   *       404:
   *         description: Classroom not found
   *       500:
   *         description: Internal server error
   */
  fastify.post('/classwork/:lectureId', {
    schema: {
      body: {
        type: 'object',
        required: ['title', 'dueDate', 'topic', 'points'],
        properties: {
          title: { type: 'string' },
          dueDate: { type: 'string', format: 'date-time' },
          topic: { type: 'string' },
          points: { type: 'number' }
        }
      }
    }
  }, classroomController.postLectureAssignment.bind(classroomController));

  /**
   * @swagger
   * /classroom/classrooms/{id}/students:
   *   post:
   *     summary: Add a student to a classroom
   *     tags:
   *       - Classroom
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The classroom's ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - studentId
   *             properties:
   *               studentId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Student added successfully
   *       404:
   *         description: Classroom not found
   *       500:
   *         description: Internal server error
   */
  fastify.post('/classrooms/:id/students', {
    schema: {
      body: {
        type: 'object',
        required: ['studentId'],
        properties: {
          studentId: { type: 'string' }
        }
      }
    }
  }, classroomController.addStudentToClassroom.bind(classroomController));

  // Get all classrooms
  fastify.get('/classrooms', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get all classrooms',
      description: 'Retrieve a list of all classrooms',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              code: { type: 'string' },
              title: { type: 'string' },
              instructor: { type: 'string' },
              room: { type: 'string' },
              time: { type: 'string' },
              color: { type: 'string' },
              banner: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      }
    }
  }, classroomController.getAllClassrooms);

  // Get classroom details
  fastify.get('/classrooms/:id', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get classroom details',
      description: 'Get detailed information about a specific classroom',
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
            code: { type: 'string' },
            title: { type: 'string' },
            instructor: { type: 'string' },
            room: { type: 'string' },
            time: { type: 'string' },
            color: { type: 'string' },
            banner: { type: 'string' },
            description: { type: 'string' },
            students: { type: 'array', items: { type: 'object' } },
            materials: { type: 'array', items: { type: 'object' } },
            assignments: { type: 'array', items: { type: 'object' } }
          }
        }
      }
    }
  }, classroomController.getClassroomDetails);

  // Get classroom schedule
  fastify.get('/classrooms/:id/schedule', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get classroom schedule',
      description: 'Get schedule information for a specific classroom',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, classroomController.getClassroomSchedule);

  // Get classroom grades
  fastify.get('/classrooms/:id/grades', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get classroom grades',
      description: 'Get grades for all students in a specific classroom',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, classroomController.getClassroomGrades);

  // Get classroom materials
  fastify.get('/classrooms/:id/materials', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get classroom materials',
      description: 'Get all materials for a specific classroom',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, classroomController.getClassroomMaterials);

  // Get classroom assignments
  fastify.get('/classrooms/:id/assignments', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get classroom assignments',
      description: 'Get all assignments for a specific classroom',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, classroomController.getClassroomAssignments);

  // Get classroom students
  fastify.get('/classrooms/:id/students', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get classroom students',
      description: 'Get all students enrolled in a specific classroom',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, classroomController.getClassroomStudents);

  // Get course details by ID
  fastify.get('/course-details/:id', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get course details by ID',
      description: 'Get detailed information about a specific course',
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
            code: { type: 'string' },
            title: { type: 'string' },
            instructor: { type: 'string' },
            room: { type: 'string' },
            time: { type: 'string' },
            color: { type: 'string' },
            banner: { type: 'string' },
            description: { type: 'string' },
            students: { type: 'array', items: { type: 'object' } },
            materials: { type: 'array', items: { type: 'object' } },
            assignments: { type: 'array', items: { type: 'object' } },
            lecture: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                title: { type: 'string' },
                credits: { type: 'number' },
                evaluationType: { type: 'string' },
                lectureSchedule: { type: 'object' }
              }
            }
          }
        }
      }
    }
  }, classroomController.getCoursesById.bind(classroomController));

  // Get lecture stream (announcements)
  fastify.get('/lecture-stream/:lectureId', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get lecture stream',
      description: 'Get announcements for a specific lecture',
      params: {
        type: 'object',
        required: ['lectureId'],
        properties: {
          lectureId: { type: 'string' }
        }
      }
    }
  }, classroomController.getLectureStream.bind(classroomController));

  // Get lecture classwork
  fastify.get('/lecture-classwork/:lectureId', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get lecture classwork',
      description: 'Get homeworks, quizzes, and projects for a specific lecture',
      params: {
        type: 'object',
        required: ['lectureId'],
        properties: {
          lectureId: { type: 'string' }
        }
      }
    }
  }, classroomController.getLectureClasswork.bind(classroomController));

  // Get lecture people
  fastify.get('/classrooms/:id/people', {
    schema: {
      tags: ['Classroom'],
      summary: 'Get classroom people',
      description: 'Get teachers and students for a specific classroom',
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
            teacher: {
              type: ['object', 'null'],
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                phone: { type: 'string' },
                academicInfo: { type: 'object' }
              }
            },
            students: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  matriculationNumber: { type: 'string' },
                  academicInfo: { type: 'object' }
                }
              }
            },
            studentCount: { type: 'number' },
            classroomInfo: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                title: { type: 'string' },
                instructor: { type: 'string' },
                room: { type: 'string' },
                time: { type: 'string' },
                group: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, classroomController.getLecturePeople.bind(classroomController));
} 