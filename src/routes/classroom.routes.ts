import { FastifyInstance } from 'fastify';
import { ClassroomController } from '../controllers/classroom.controller';

const classroomController = new ClassroomController();

export async function classroomRoutes(fastify: FastifyInstance) {
  /**
   * @swagger
   * /classroom/courses/{studentId}:
   *   get:
   *     summary: Get all courses for a student
   *     tags:
   *       - Classroom
   *     parameters:
   *       - in: path
   *         name: studentId
   *         required: true
   *         schema:
   *           type: string
   *         description: The student's ID
   *     responses:
   *       200:
   *         description: List of courses
   *       404:
   *         description: Student not found
   */
  fastify.get('/classroom/courses/:studentId', {
    schema: {
      description: 'Get all courses for a student',
      tags: ['Classroom'],
      params: {
        type: 'object',
        properties: {
          studentId: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  }, classroomController.getStudentCourses.bind(classroomController));

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
  fastify.get('/classroom/stream/:lectureId', classroomController.getLectureStream.bind(classroomController));

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
  fastify.get('/classroom/classwork/:lectureId', classroomController.getLectureClasswork.bind(classroomController));

  /**
   * @swagger
   * /classroom/people/{lectureId}:
   *   get:
   *     summary: Get people (teachers and students) for a lecture
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
   *         description: Teacher and students for the lecture
   *       404:
   *         description: Lecture not found
   */
  fastify.get('/classroom/people/:lectureId', classroomController.getLecturePeople.bind(classroomController));
} 