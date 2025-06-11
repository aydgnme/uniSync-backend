import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export class HomeworkController {
  async getAllClassrooms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { data: classrooms, error } = await supabase
        .from('classrooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return reply.send(classrooms);
    } catch (error) {
      logger.error('Error fetching classrooms:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getClassroomById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const { data: classroom, error } = await supabase
        .from('classrooms')
        .select('*, students(*), materials(*), assignments(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!classroom) {
        return reply.status(404).send({ error: 'Classroom not found' });
      }

      return reply.send(classroom);
    } catch (error) {
      logger.error('Error fetching classroom:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async createClassroom(request: FastifyRequest<{
    Body: {
      code: string;
      title: string;
      instructor: string;
      room?: string;
      time?: string;
      color?: string;
      banner?: string;
      description?: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { code, title, instructor, room, time, color, banner, description } = request.body;

      const { data, error } = await supabase
        .from('classrooms')
        .insert({
          code,
          title,
          instructor,
          room,
          time,
          color,
          banner,
          description
        })
        .select()
        .single();

      if (error) throw error;

      return reply.status(201).send({
        message: 'Classroom created successfully',
        classroom: data
      });
    } catch (error) {
      logger.error('Error creating classroom:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async addMaterial(request: FastifyRequest<{
    Params: { id: string };
    Body: {
      title: string;
      description?: string;
      fileId: string;
      fileName: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { title, description, fileId, fileName } = request.body;

      const { data, error } = await supabase
        .from('materials')
        .insert({
          classroom_id: id,
          title,
          description,
          file_id: fileId,
          file_name: fileName
        })
        .select()
        .single();

      if (error) throw error;

      return reply.status(201).send(data);
    } catch (error) {
      logger.error('Error adding material:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async createAssignment(request: FastifyRequest<{
    Params: { id: string };
    Body: {
      title: string;
      description: string;
      dueDate?: string;
      isUnlimited?: boolean;
    }
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { title, description, dueDate, isUnlimited } = request.body;

      const { data, error } = await supabase
        .from('assignments')
        .insert({
          classroom_id: id,
          title,
          description,
          due_date: dueDate,
          is_unlimited: isUnlimited
        })
        .select()
        .single();

      if (error) throw error;

      return reply.status(201).send(data);
    } catch (error) {
      logger.error('Error creating assignment:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async submitAssignment(request: FastifyRequest<{
    Params: { classroomId: string; assignmentId: string };
    Body: {
      studentId: string;
      fileId: string;
      fileName: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { classroomId, assignmentId } = request.params;
      const { studentId, fileId, fileName } = request.body;

      const { data, error } = await supabase
        .from('submissions')
        .insert({
          classroom_id: classroomId,
          assignment_id: assignmentId,
          student_id: studentId,
          file_id: fileId,
          file_name: fileName
        })
        .select()
        .single();

      if (error) throw error;

      return reply.status(201).send(data);
    } catch (error) {
      logger.error('Error submitting assignment:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async gradeAssignment(request: FastifyRequest<{
    Params: { classroomId: string; assignmentId: string };
    Body: {
      studentId: string;
      grade: number;
      feedback?: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { classroomId, assignmentId } = request.params;
      const { studentId, grade, feedback } = request.body;

      const { data, error } = await supabase
        .from('submissions')
        .update({
          grade,
          feedback,
          graded_at: new Date().toISOString()
        })
        .eq('classroom_id', classroomId)
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .select()
        .single();

      if (error) throw error;

      return reply.send(data);
    } catch (error) {
      logger.error('Error grading assignment:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async enrollStudent(request: FastifyRequest<{
    Params: { id: string };
    Body: { studentId: string };
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { studentId } = request.body;

      const { data, error } = await supabase
        .from('classroom_students')
        .insert({
          classroom_id: id,
          student_id: studentId
        })
        .select()
        .single();

      if (error) throw error;

      return reply.status(201).send({
        message: 'Student enrolled successfully',
        enrollment: data
      });
    } catch (error) {
      logger.error('Error enrolling student:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
} 