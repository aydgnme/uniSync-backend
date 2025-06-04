import { FastifyInstance } from 'fastify';
import { ClassroomController } from '../controllers/classroom.controller';

const classroomController = new ClassroomController();

export default async function classroomRoutes(fastify: FastifyInstance) {
  // Add /api prefix to all routes
  fastify.register(async function (fastify) {
    // Get all courses for a student
    fastify.get('/student/:id', classroomController.getStudentCourses.bind(classroomController));

    // Get announcements for a course
    fastify.get('/stream/:courseId', classroomController.getLectureStream.bind(classroomController));

    // Create a new announcement for a course
    fastify.post('/stream/:courseId', classroomController.postLectureAnnouncement.bind(classroomController));

    // Get assignments for a course
    fastify.get('/classwork/:courseId', classroomController.getLectureClasswork.bind(classroomController));

    // Create assignment for a course
    fastify.post('/classwork/:courseId', classroomController.postLectureAssignment.bind(classroomController));

    // Enroll student into a course
    fastify.post('/classrooms/:courseId/students', classroomController.addStudentToCourse.bind(classroomController));

    // Get all courses
    fastify.get('/classrooms', classroomController.getAllCourses.bind(classroomController));

    // Get course details
    fastify.get('/classrooms/:courseId', classroomController.getCourseDetails.bind(classroomController));

    // Get course schedule
    fastify.get('/classrooms/:courseId/schedule', classroomController.getCourseSchedule.bind(classroomController));
  });
}
