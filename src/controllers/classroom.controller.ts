import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.model';
import { Lecture } from '../models/lecture.model';
import { Homework } from '../models/homework.model';
import { Announcement } from '../models/announcement.model';
import { Classroom } from '../models/classroom.model';
import { Types } from 'mongoose';

interface IAssignment {
  _id: Types.ObjectId;
  title: string;
  description: string;
  dueDate?: Date;
  isUnlimited?: boolean;
  submissions: Array<{
    studentId: Types.ObjectId;
    fileId: string;
    fileName: string;
    submittedAt: Date;
    status: 'pending' | 'submitted' | 'graded';
    grade?: number;
    feedback?: string;
  }>;
}

export class ClassroomController {
  // Get all classrooms
  async getAllClassrooms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const classrooms = await Classroom.find()
        .select('code title instructor room time color banner description')
        .lean();
      return reply.send(classrooms);
    } catch (error: any) {
      console.error('Error fetching classrooms:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  // POST /lecture-stream/:lectureId
  async postLectureAnnouncement(
    req: FastifyRequest<{ Params: { lectureId: string }, Body: { text: string; author: string } }>,
    res: FastifyReply
  ) {
    try {
      const classroom = await Classroom.findById(req.params.lectureId);
      if (!classroom) {
        return res.status(404).send({ message: 'Classroom not found' });
      }

      const newAnnouncement = new Announcement({
        text: req.body.text,
        author: req.body.author,
        lecture: classroom.code,
        createdAt: new Date()
      });
      await newAnnouncement.save();
      return res.send(newAnnouncement);
    } catch (err) {
      console.error('Error posting announcement:', err);
      return res.status(500).send({ error: 'Internal server error' });
    }
  }

  // POST /lecture-classwork/:lectureId
  async postLectureAssignment(
    req: FastifyRequest<{
      Params: { lectureId: string },
      Body: { title: string; dueDate: string; topic: string; points: number }
    }>,
    res: FastifyReply
  ) {
    try {
      const classroom = await Classroom.findById(req.params.lectureId);
      if (!classroom) {
        return res.status(404).send({ message: 'Classroom not found' });
      }

      const assignment = {
        _id: new Types.ObjectId(),
        title: req.body.title,
        description: req.body.topic,
        dueDate: new Date(req.body.dueDate),
        points: req.body.points,
        isUnlimited: false,
        submissions: []
      };

      classroom.assignments.push(assignment);
      await classroom.save();

      return res.send({ success: true, assignment });
    } catch (err) {
      console.error('Error posting assignment:', err);
      return res.status(500).send({ error: 'Internal server error' });
    }
  }

  // POST /classrooms/:id/students
  async addStudentToClassroom(
    req: FastifyRequest<{ Params: { id: string }, Body: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const classroom = await Classroom.findById(req.params.id);
      if (!classroom) return reply.status(404).send({ message: 'Classroom not found' });

      if (!classroom.students.includes(new Types.ObjectId(req.body.studentId))) {
        classroom.students.push(new Types.ObjectId(req.body.studentId));
        await classroom.save();
      }

      return reply.send({ success: true });
    } catch (error) {
      console.error('Error adding student:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  // Get all courses for a student
  async getStudentCourses(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      console.log('Searching for student with ID/matriculationNumber:', request.params.id);

      // Önce ObjectId ile deneyelim
      let student = null;
      try {
        student = await User.findById(request.params.id).lean();
        console.log('Search result by ObjectId:', student ? 'Found' : 'Not found');
      } catch (error) {
        console.log('Error searching by ObjectId:', error);
      }

      // Eğer bulunamazsa matriculationNumber ile deneyelim
      if (!student) {
        try {
          student = await User.findOne({ 
            matriculationNumber: request.params.id
          }).lean();
          console.log('Search result by matriculationNumber:', student ? 'Found' : 'Not found');
        } catch (error) {
          console.log('Error searching by matriculationNumber:', error);
        }
      }

      if (!student) {
        console.log('Student not found with ID/matriculationNumber:', request.params.id);
        return reply.status(404).send({ error: 'Student not found' });
      }

      console.log('Student found:', {
        id: student._id,
        matriculationNumber: student.matriculationNumber,
        role: student.role
      });

      // Öğrencinin kayıtlı olduğu sınıfları bul
      const classrooms = await Classroom.find({
        students: student._id
      }).lean();

      console.log('Found classrooms:', classrooms.map(c => ({
        id: c._id,
        code: c.code,
        title: c.title
      })));

      if (!classrooms || classrooms.length === 0) {
        console.log('No classrooms found for student');
        return reply.send([]);
      }

      // Her sınıf için ders bilgilerini al
      const courses = await Promise.all(classrooms.map(async (classroom) => {
        const lecture = await Lecture.findOne({ code: classroom.code }).lean();
        
        return {
          _id: classroom._id.toString(),
          code: classroom.code,
          title: classroom.title,
          credits: lecture?.credits,
          evaluationType: lecture?.evaluationType,
          type: lecture?.type || 'LECTURE',
          instructor: classroom.instructor,
          room: classroom.room,
          time: classroom.time,
          color: classroom.color,
          banner: classroom.banner,
          description: classroom.description,
          schedule: lecture?.lectureSchedule ? {
            weekDay: lecture.lectureSchedule.weekDay,
            startTime: lecture.lectureSchedule.startTime,
            endTime: lecture.lectureSchedule.endTime,
            room: lecture.lectureSchedule.room,
            weeks: lecture.lectureSchedule.weeks,
            parity: lecture.lectureSchedule.parity
          } : null
        };
      }));

      console.log('Returning courses:', courses.map(c => ({
        id: c._id,
        code: c.code,
        title: c.title
      })));

      return reply.send(courses);
    } catch (error: any) {
      console.error('Error fetching student courses:', error);
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
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      console.log('Fetching people for classroom:', request.params.id);

      // Classroom'u bul
      const classroom = await Classroom.findById(request.params.id);
      if (!classroom) {
        console.log('Classroom not found');
        return reply.status(404).send({ error: 'Classroom not found' });
      }

      // Öğretmen bilgilerini al
      const teacher = await User.findOne({
        $or: [
          { 'academicInfo.advisor': classroom.instructor },
          { name: { $regex: new RegExp(classroom.instructor, 'i') } }
        ],
        role: 'Teacher'
      }).select('-password');

      console.log('Found teacher:', teacher ? {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email
      } : 'Not found');

      // Öğrenci bilgilerini al
      const students = await User.find({
        _id: { $in: classroom.students },
        role: 'Student'
      }).select('-password');

      console.log('Found students:', students.length);

      // Öğrenci sayısını hesapla
      const studentCount = classroom.students.length;

      return reply.send({
        teacher: teacher ? {
          _id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          role: teacher.role,
          phone: teacher.phone,
          academicInfo: teacher.academicInfo
        } : null,
        students: students.map(student => ({
          _id: student._id,
          name: student.name,
          email: student.email,
          role: student.role,
          matriculationNumber: student.matriculationNumber,
          academicInfo: student.academicInfo
        })),
        studentCount,
        classroomInfo: {
          code: classroom.code,
          title: classroom.title,
          instructor: classroom.instructor,
          room: classroom.room,
          time: classroom.time,
          group: classroom.description.split('\nGroup: ')[1]?.split('\n')[0] || 'N/A'
        }
      });
    } catch (error: any) {
      console.error('Error fetching classroom people:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getClassroomDetails(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const classroom = await Classroom.findById(request.params.id)
        .populate('students', 'name email')
        .populate('materials')
        .populate('assignments');

      if (!classroom) {
        return reply.status(404).send({ message: 'Classroom not found' });
      }

      return reply.send(classroom);
    } catch (error) {
      console.error('Error getting classroom details:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async getClassroomSchedule(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const classroom = await Classroom.findById(request.params.id);
      if (!classroom) {
        return reply.status(404).send({ message: 'Classroom not found' });
      }

      const lecture = await Lecture.findOne({ code: classroom.code });
      if (!lecture) {
        return reply.status(404).send({ message: 'Lecture not found' });
      }

      return reply.send({
        time: classroom.time,
        room: classroom.room,
        schedule: lecture.lectureSchedule
      });
    } catch (error) {
      console.error('Error getting classroom schedule:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async getClassroomGrades(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const classroom = await Classroom.findById(request.params.id)
        .populate('assignments');

      if (!classroom) {
        return reply.status(404).send({ message: 'Classroom not found' });
      }

      const grades = (classroom.assignments as IAssignment[]).map(assignment => ({
        assignmentId: assignment._id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        submissions: assignment.submissions.map(submission => ({
          studentId: submission.studentId,
          grade: submission.grade,
          feedback: submission.feedback
        }))
      }));

      return reply.send(grades);
    } catch (error) {
      console.error('Error getting classroom grades:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async getClassroomMaterials(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const classroom = await Classroom.findById(request.params.id)
        .populate('materials');

      if (!classroom) {
        return reply.status(404).send({ message: 'Classroom not found' });
      }

      return reply.send(classroom.materials);
    } catch (error) {
      console.error('Error getting classroom materials:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async getClassroomAssignments(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const classroom = await Classroom.findById(request.params.id)
        .populate('assignments');

      if (!classroom) {
        return reply.status(404).send({ message: 'Classroom not found' });
      }

      return reply.send(classroom.assignments);
    } catch (error) {
      console.error('Error getting classroom assignments:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  async getClassroomStudents(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const classroom = await Classroom.findById(request.params.id)
        .populate('students', 'name email role');

      if (!classroom) {
        return reply.status(404).send({ message: 'Classroom not found' });
      }

      return reply.send(classroom.students);
    } catch (error) {
      console.error('Error getting classroom students:', error);
      return reply.status(500).send({ message: 'Internal server error' });
    }
  }

  // Get courses by ID
  async getCoursesById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const classroom = await Classroom.findById(request.params.id)
        .populate('students', 'name email')
        .populate('materials')
        .populate('assignments');

      if (!classroom) {
        return reply.status(404).send({ error: 'Classroom not found' });
      }

      // Get lecture details
      const lecture = await Lecture.findOne({ code: classroom.code });
      if (!lecture) {
        return reply.status(404).send({ error: 'Lecture not found' });
      }

      // Combine classroom and lecture information
      const courseInfo = {
        ...classroom.toObject(),
        lecture: {
          code: lecture.code,
          title: lecture.title,
          credits: lecture.credits,
          evaluationType: lecture.evaluationType,
          lectureSchedule: {
            weekDay: lecture.weekDay,
            startTime: lecture.startTime,
            endTime: lecture.endTime,
            room: lecture.room,
            weeks: lecture.weeks,
            parity: lecture.parity
          }
        }
      };

      return reply.send(courseInfo);
    } catch (error: any) {
      console.error('Error fetching course details:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
} 