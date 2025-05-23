import { FastifyRequest, FastifyReply } from 'fastify';
import { Student, IStudentDocument } from '../models/student.model';

interface StudentParams {
  id?: string;
  program?: string;
  advisor?: string;
}

interface StudentBody {
  // Required fields for student model
  name: string;
  surname: string;
  email: string;
  studentId: string;
  academicInfo: {
    program: string;
    advisor: string;
  };
}

export class StudentController {
  // Create new student
  public async createStudent(
    request: FastifyRequest<{ Body: StudentBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const student = new Student(request.body);
      const result = await student.save();
      reply.code(201).send(result);
    } catch (error) {
      reply.code(500).send({ error: 'An error occurred while creating the student.' });
    }
  }

  // Get student by ID
  public async getStudentById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const student = await Student.findById(request.params.id).populate('user');
      if (!student) {
        reply.code(404).send({ error: 'Student not found.' });
        return;
      }
      reply.code(200).send(student);
    } catch (error) {
      reply.code(500).send({ error: 'An error occurred while fetching student information.' });
    }
  }

  // Update student information
  public async updateStudent(
    request: FastifyRequest<{ Params: { id: string }, Body: StudentBody }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const updatedStudent = await Student.findByIdAndUpdate(
        request.params.id,
        request.body,
        { new: true }
      );
      if (!updatedStudent) {
        reply.code(404).send({ error: 'Student not found.' });
        return;
      }
      reply.code(200).send(updatedStudent);
    } catch (error) {
      reply.code(500).send({ error: 'An error occurred while updating the student.' });
    }
  }

  // Delete student
  public async deleteStudent(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const deletedStudent = await Student.findByIdAndDelete(request.params.id);
      if (!deletedStudent) {
        reply.code(404).send({ error: 'Student not found.' });
        return;
      }
      reply.code(200).send({ message: 'Student successfully deleted.' });
    } catch (error) {
      reply.code(500).send({ error: 'An error occurred while deleting the student.' });
    }
  }

  // Get students by program
  public async getStudentsByProgram(
    request: FastifyRequest<{ Params: { program: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const students = await Student.find({
        'academicInfo.program': request.params.program
      }).populate('user');
      reply.code(200).send(students);
    } catch (error) {
      reply.code(500).send({ error: 'An error occurred while fetching students.' });
    }
  }

  // Get students by advisor
  public async getStudentsByAdvisor(
    request: FastifyRequest<{ Params: { advisor: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    try {
      const students = await Student.find({
        'academicInfo.advisor': request.params.advisor
      }).populate('user');
      reply.code(200).send(students);
    } catch (error) {
      reply.code(500).send({ error: 'An error occurred while fetching students.' });
    }
  }
} 