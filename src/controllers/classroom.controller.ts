import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.model';
import { Lecture } from '../models/lecture.model';
import { Homework } from '../models/homework.model';
import { Announcement } from '../models/announcement.model';

export class ClassroomController {
  // Get all courses for a student
  async getStudentCourses(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const student = await User.findById(request.params.studentId);
      if (!student) {
        return reply.status(404).send({ error: 'Student not found' });
      }
      const lectures = await Lecture.find({ _id: { $in: student.enrolledLectures } });
      return reply.send(lectures);
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  // Get stream (announcements) for a lecture
  async getLectureStream(
    request: FastifyRequest<{ Params: { lectureId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const stream = await Announcement.find({ lecture: request.params.lectureId })
        .populate('author', 'name')
        .sort({ createdAt: -1 });
      return reply.send(stream);
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  // Get classwork (homeworks, quizzes, projects) for a lecture
  async getLectureClasswork(
    request: FastifyRequest<{ Params: { lectureId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const homeworks = await Homework.find({ lecture: request.params.lectureId }).sort({ dueDate: 1 });
      return reply.send(homeworks);
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  // Get people (teachers and students) for a lecture
  async getLecturePeople(
    request: FastifyRequest<{ Params: { lectureId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const lecture = await Lecture.findById(request.params.lectureId);
      if (!lecture) {
        return reply.status(404).send({ error: 'Lecture not found' });
      }
      // Teacher info
      // Note: Additional logic may be needed here to find User from teacherInfo
      const teacher = await User.findOne({ name: new RegExp(lecture.teacherInfo.lastName, 'i'), role: 'Teacher' });
      // Students
      const students = await User.find({ enrolledLectures: lecture._id, role: 'Student' });
      return reply.send({
        teacher,
        students
      });
    } catch (error: any) {
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
} 