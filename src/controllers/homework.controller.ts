import { FastifyRequest, FastifyReply } from 'fastify';
import { Homework, IHomework } from '../models/homework.model';
import { User } from '../models/user.model';
import { Lecture } from '../models/lecture.model';
import { GridFSService } from '../services/gridfs.service';
import { Types } from 'mongoose';

interface UploadHomeworkBody {
  file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
  studentId: string;
  lectureId: string;
  lectureCode: string;
  group: string;
  subgroup: string;
}

interface CreateHomeworkBody {
  lectureCode: string;
  group: string;
  subgroup: string;
  title: string;
  description: string;
  dueDate?: Date;
  isUnlimited?: boolean;
}

interface UpdateHomeworkBody {
  title?: string;
  description?: string;
  dueDate?: Date;
  isUnlimited?: boolean;
  status?: 'pending' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
}

interface SubmitHomeworkBody {
  studentId: string;
  fileId: string;
  fileName: string;
}

interface GradeHomeworkBody {
  grade: number;
  feedback?: string;
}

export class HomeworkController {
  async createHomework(
    request: FastifyRequest<{ Body: CreateHomeworkBody }>,
    reply: FastifyReply
  ) {
    try {
      const { lectureCode, group, subgroup, title, description, dueDate, isUnlimited } = request.body;

      // Validate input
      if (!isUnlimited && !dueDate) {
        return reply.status(400).send({ error: 'Due date is required for non-unlimited homeworks' });
      }

      // Check if lecture exists
      const lecture = await Lecture.findOne({ 
        code: lectureCode,
        group,
        subgroup
      });

      if (!lecture) {
        return reply.code(404).send({ message: 'Course not found' });
      }

      // Create homework record
      const homework = await Homework.create({
        lecture: lecture._id,
        lectureCode,
        group,
        subgroup,
        title,
        description,
        dueDate: isUnlimited ? undefined : dueDate,
        isUnlimited: isUnlimited || false,
        status: 'pending'
      });

      return reply.code(201).send({
        message: 'Homework successfully created',
        homework
      });
    } catch (error: any) {
      console.error('Homework creation error:', error);
      return reply.code(500).send({ message: 'An error occurred while creating the homework' });
    }
  }

  async getStudentEnrolledLectures(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const student = await User.findById(request.params.studentId);
      if (!student) {
        return reply.status(404).send({ error: 'Student not found' });
      }

      const lectures = await Lecture.find({
        _id: { $in: student.enrolledLectures }
      });

      return reply.send(lectures);
    } catch (error: any) {
      console.error('Error fetching enrolled lectures:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getStudentClassroomHomeworks(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const student = await User.findById(request.params.studentId);
      if (!student) {
        return reply.status(404).send({ error: 'Student not found' });
      }

      const homeworks = await Homework.find({
        lecture: { $in: student.enrolledLectures }
      })
      .populate('lecture')
      .populate('student')
      .sort({ createdAt: -1 });

      return reply.send(homeworks);
    } catch (error: any) {
      console.error('Error fetching classroom homeworks:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getUpcomingHomeworks(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const student = await User.findById(request.params.studentId);
      if (!student) {
        return reply.status(404).send({ error: 'Student not found' });
      }

      const now = new Date();
      const homeworks = await Homework.find({
        lecture: { $in: student.enrolledLectures },
        dueDate: { $gt: now },
        status: 'pending'
      })
      .populate('lecture')
      .sort({ dueDate: 1 });

      return reply.send(homeworks);
    } catch (error: any) {
      console.error('Error fetching upcoming homeworks:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getSubmittedHomeworks(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const student = await User.findById(request.params.studentId);
      if (!student) {
        return reply.status(404).send({ error: 'Student not found' });
      }

      const homeworks = await Homework.find({
        student: student._id,
        status: { $in: ['submitted', 'graded'] }
      })
      .populate('lecture')
      .sort({ submittedAt: -1 });

      return reply.send(homeworks);
    } catch (error: any) {
      console.error('Error fetching submitted homeworks:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async submitHomework(
    request: FastifyRequest<{ 
      Params: { id: string },
      Body: SubmitHomeworkBody 
    }>,
    reply: FastifyReply
  ) {
    try {
      const homework = await Homework.findById(request.params.id);
      
      if (!homework) {
        return reply.status(404).send({ error: 'Homework not found' });
      }

      // Check if homework is already submitted
      if (homework.status === 'submitted' || homework.status === 'graded') {
        return reply.status(400).send({ error: 'Homework is already submitted' });
      }

      // Check if homework is past due date (if not unlimited)
      if (!homework.isUnlimited && homework.dueDate && new Date() > homework.dueDate) {
        return reply.status(400).send({ error: 'Homework is past due date' });
      }

      const updatedHomework = await Homework.findByIdAndUpdate(
        request.params.id,
        {
          student: new Types.ObjectId(request.body.studentId),
          fileId: request.body.fileId,
          fileName: request.body.fileName,
          submittedAt: new Date(),
          status: 'submitted'
        },
        { new: true }
      ).populate('lecture').populate('student');

      return reply.send(updatedHomework);
    } catch (error: any) {
      console.error('Error submitting homework:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async gradeHomework(
    request: FastifyRequest<{ 
      Params: { id: string },
      Body: GradeHomeworkBody 
    }>,
    reply: FastifyReply
  ) {
    try {
      const homework = await Homework.findById(request.params.id);
      
      if (!homework) {
        return reply.status(404).send({ error: 'Homework not found' });
      }

      // Check if homework is submitted
      if (homework.status !== 'submitted') {
        return reply.status(400).send({ error: 'Homework must be submitted before grading' });
      }

      const updatedHomework = await Homework.findByIdAndUpdate(
        request.params.id,
        {
          grade: request.body.grade,
          feedback: request.body.feedback,
          status: 'graded'
        },
        { new: true }
      ).populate('lecture').populate('student');

      return reply.send(updatedHomework);
    } catch (error: any) {
      console.error('Error grading homework:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  getHomework = async (
    request: FastifyRequest<{ Params: { homeworkId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const homework = await Homework.findById(request.params.homeworkId)
        .populate('student')
        .populate('lecture');

      if (!homework) {
        return reply.code(404).send({ message: 'Homework not found' });
      }

      return reply.send(homework);
    } catch (error) {
      console.error('Get homework error:', error);
      return reply.code(500).send({ message: 'An error occurred while fetching homework information' });
    }
  };

  getGroupHomeworks = async (
    request: FastifyRequest<{ 
      Params: { 
        lectureCode: string;
        group: string;
        subgroup?: string;
      }
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { lectureCode, group, subgroup } = request.params;
      
      const query: any = { lectureCode, group };
      if (subgroup) {
        query.subgroup = subgroup;
      }

      const homeworks = await Homework.find(query)
        .populate('student')
        .populate('lecture');

      return reply.send(homeworks);
    } catch (error) {
      console.error('Get group homeworks error:', error);
      return reply.code(500).send({ message: 'An error occurred while fetching group homework' });
    }
  };

  getStudentHomeworks = async (
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const student = await User.findById(request.params.studentId);
      if (!student) {
        return reply.code(404).send({ message: 'Student not found' });
      }

      const homeworks = await Homework.find({ student: request.params.studentId })
        .populate('student')
        .populate('lecture');

      return reply.send(homeworks);
    } catch (error) {
      console.error('Get student homeworks error:', error);
      return reply.code(500).send({ message: 'An error occurred while fetching student homework' });
    }
  };

  async getAllHomeworks(request: FastifyRequest, reply: FastifyReply) {
    try {
      const homeworks = await Homework.find()
        .populate('lecture')
        .populate('student');
      return reply.send(homeworks);
    } catch (error: any) {
      console.error('Error fetching homeworks:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getHomeworkById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const homework = await Homework.findById(request.params.id)
        .populate('lecture')
        .populate('student');

      if (!homework) {
        return reply.status(404).send({ error: 'Homework not found' });
      }
      return reply.send(homework);
    } catch (error: any) {
      console.error('Error fetching homework:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getHomeworksByLecture(
    request: FastifyRequest<{ Params: { lectureId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const homeworks = await Homework.find({ lecture: new Types.ObjectId(request.params.lectureId) })
        .populate('lecture')
        .populate('student');
      return reply.send(homeworks);
    } catch (error: any) {
      console.error('Error fetching lecture homeworks:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getHomeworksByStudent(
    request: FastifyRequest<{ Params: { studentId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const homeworks = await Homework.find({ student: new Types.ObjectId(request.params.studentId) })
        .populate('lecture')
        .populate('student');
      return reply.send(homeworks);
    } catch (error: any) {
      console.error('Error fetching student homeworks:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async updateHomework(
    request: FastifyRequest<{ 
      Params: { id: string },
      Body: UpdateHomeworkBody 
    }>,
    reply: FastifyReply
  ) {
    try {
      const { dueDate, isUnlimited, ...updateData } = request.body;

      // Validate input
      if (isUnlimited === false && !dueDate) {
        return reply.status(400).send({ error: 'Due date is required for non-unlimited homeworks' });
      }

      const updateFields: any = {
        ...updateData,
        isUnlimited: isUnlimited || false
      };

      if (!isUnlimited && dueDate) {
        updateFields.dueDate = dueDate;
      } else if (isUnlimited) {
        updateFields.dueDate = undefined;
      }

      const homework = await Homework.findByIdAndUpdate(
        request.params.id,
        updateFields,
        { new: true }
      ).populate('lecture').populate('student');

      if (!homework) {
        return reply.status(404).send({ error: 'Homework not found' });
      }
      return reply.send(homework);
    } catch (error: any) {
      console.error('Error updating homework:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async deleteHomework(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const homework = await Homework.findByIdAndDelete(request.params.id);
      if (!homework) {
        return reply.status(404).send({ error: 'Homework not found' });
      }
      return reply.status(204).send();
    } catch (error: any) {
      console.error('Error deleting homework:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
} 