import { FastifyReply, FastifyRequest } from 'fastify';
import { Professor, IProfessorDocument } from '../models/professor.model';
import { Types } from 'mongoose';

export class ProfessorController {
  static async getAllProfessors(request: FastifyRequest, reply: FastifyReply) {
    try {
      const professors = await Professor.find().populate('user');
      return reply.code(200).send(professors);
    } catch (error: unknown) {
      console.error('Error fetching professors:', error);
      return reply.code(500).send({
        message: 'Error fetching professors',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getProfessorById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const professor = await Professor.findById(request.params.id)
        .populate('user')
        .populate('courses');

      if (!professor) {
        return reply.code(404).send({
          message: 'Professor not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      return reply.code(200).send(professor);
    } catch (error: unknown) {
      console.error('Error fetching professor:', error);
      return reply.code(500).send({
        message: 'Error fetching professor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async createProfessor(
    request: FastifyRequest<{
      Body: {
        user: string;
        lastName: string;
        firstName: string;
        department: string;
        faculty: string;
        title: string;
        position: string;
        office: string;
        phoneNumber: string;
        email?: string;
        phd?: string;
        otherTitle?: string;
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const { 
        user, 
        lastName,
        firstName,
        department, 
        faculty, 
        title, 
        position,
        office, 
        phoneNumber,
        email,
        phd,
        otherTitle
      } = request.body;

      // Check for required fields
      const requiredFields = {
        user,
        lastName,
        firstName,
        department,
        faculty,
        title,
        position,
        office,
        phoneNumber
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        return reply.code(400).send({
          message: 'Missing required fields',
          fields: missingFields,
          code: 'BAD_REQUEST',
          statusCode: 400
        });
      }

      // Check if professor already exists for this user
      const existingProfessor = await Professor.findOne({ user: new Types.ObjectId(user) });
      if (existingProfessor) {
        return reply.code(400).send({
          message: 'Professor profile already exists for this user',
          code: 'BAD_REQUEST',
          statusCode: 400
        });
      }

      // Create professor object
      const professorData: Partial<IProfessorDocument> = {
        user: new Types.ObjectId(user),
        lastName,
        firstName,
        department,
        faculty,
        title,
        position,
        office,
        phoneNumber,
        email,
        phd,
        otherTitle
      };

      const professor = new Professor(professorData);
      await professor.save();

      // Populate references before sending response
      await professor.populate('user');
      
      return reply.code(201).send(professor);
    } catch (error: unknown) {
      console.error('Error creating professor:', error);
      return reply.code(500).send({
        message: 'Error creating professor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async updateProfessor(
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        lastName?: string;
        firstName?: string;
        department?: string;
        faculty?: string;
        title?: string;
        position?: string;
        office?: string;
        phoneNumber?: string;
        email?: string;
        phd?: string;
        otherTitle?: string;
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const { 
        lastName,
        firstName,
        department, 
        faculty, 
        title, 
        position,
        office, 
        phoneNumber,
        email,
        phd,
        otherTitle
      } = request.body;

      // Prepare update data
      const updateData: any = {};
      if (lastName) updateData.lastName = lastName;
      if (firstName) updateData.firstName = firstName;
      if (department) updateData.department = department;
      if (faculty) updateData.faculty = faculty;
      if (title) updateData.title = title;
      if (position) updateData.position = position;
      if (office) updateData.office = office;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (email !== undefined) updateData.email = email;
      if (phd !== undefined) updateData.phd = phd;
      if (otherTitle !== undefined) updateData.otherTitle = otherTitle;

      const professor = await Professor.findByIdAndUpdate(
        request.params.id,
        updateData,
        { new: true }
      ).populate('user');

      if (!professor) {
        return reply.code(404).send({
          message: 'Professor not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      return reply.code(200).send(professor);
    } catch (error: unknown) {
      console.error('Error updating professor:', error);
      return reply.code(500).send({
        message: 'Error updating professor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async deleteProfessor(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const professor = await Professor.findByIdAndDelete(request.params.id);
      
      if (!professor) {
        return reply.code(404).send({
          message: 'Professor not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      return reply.code(200).send({
        message: 'Professor deleted successfully',
        code: 'SUCCESS',
        statusCode: 200
      });
    } catch (error: unknown) {
      console.error('Error deleting professor:', error);
      return reply.code(500).send({
        message: 'Error deleting professor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getProfessorByUserId(
    request: FastifyRequest<{ Params: { userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const professor = await Professor.findOne({ user: new Types.ObjectId(request.params.userId) })
        .populate('user')
        .populate('courses');

      if (!professor) {
        return reply.code(404).send({
          message: 'Professor not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      return reply.code(200).send(professor);
    } catch (error: unknown) {
      console.error('Error fetching professor:', error);
      return reply.code(500).send({
        message: 'Error fetching professor',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 