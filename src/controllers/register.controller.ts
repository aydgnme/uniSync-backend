import { FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { registerSchema } from '../schemas/auth.schemas';

export class RegisterController {
  static async handleRegister(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          success: false,
          message: 'Invalid registration data',
          errors: parsed.error.errors
        });
      }

      const {
        email,
        password,
        cnp,
        matriculationNumber,
        name,
        phone,
        address,
        program,
        semester,
        groupName,
        subgroupIndex,
        advisor,
        gpa
      } = parsed.data;

      const existingUser = await UserService.getUserByEmail(email);
      if (existingUser) {
        return reply.code(400).send({
          success: false,
          message: 'Email already registered'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await UserService.createUser({
        email,
        password: hashedPassword,
        cnp,
        matriculationNumber,
        name,
        phone,
        address,
        academicInfo: {
          program,
          semester,
          groupName,
          subgroupIndex,
          advisor,
          gpa,
          studentId: matriculationNumber
        },
        role: 'Student' // Bu kısmı istersen parsed.data.role'den al
      });

      return reply.code(201).send({
        success: true,
        message: 'User registered successfully',
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          academicInfo: user.academicInfo
        }
      });
    } catch (error: unknown) {
      console.error('Error registering user:', error);
      return reply.code(500).send({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}