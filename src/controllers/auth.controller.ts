import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service';
import { IUserBase } from '../models/user.model';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetCodeEmail } from '../services/emailService';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  cnp: z.string().length(13),
  matriculationNumber: z.string(),
  name: z.string(),
  role: z.enum(['Student', 'Teacher', 'Admin']),
  phone: z.string(),
  address: z.string(),
  academicInfo: z.object({
    program: z.string(),
    semester: z.number(),
    groupName: z.string(),
    subgroupIndex: z.string(),
    studentId: z.string(),
    advisor: z.string(),
    gpa: z.number()
  })
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  resetCode: z.string(),
  newPassword: z.string().min(6)
});

export async function authRoutes(fastify: FastifyInstance) {
  // Register
  fastify.post('/register', async (request: FastifyRequest<{ Body: IUserBase }>, reply: FastifyReply) => {
    try {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          message: 'Invalid user data',
          errors: parsed.error.errors 
        });
      }

      const existingUser = await UserService.getUserByEmail(parsed.data.email);
      if (existingUser) {
        return reply.code(400).send({ message: 'User with this email already exists' });
      }

      const user = await UserService.createUser(parsed.data);
      return reply.code(201).send(user);
    } catch (error: unknown) {
      console.error('Error registering user:', error);
      return reply.code(500).send({ 
        message: 'Error registering user', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Login
  fastify.post('/login', async (request: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    try {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          message: 'Invalid login data',
          errors: parsed.error.errors 
        });
      }

      const user = await UserService.getUserByEmail(parsed.data.email);
      if (!user) {
        return reply.code(401).send({ message: 'Invalid email or password' });
      }

      const isPasswordValid = await bcrypt.compare(parsed.data.password, user.password);
      if (!isPasswordValid) {
        return reply.code(401).send({ message: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = fastify.jwt.sign({ 
        userId: user._id,
        email: user.email,
        role: user.role
      });

      return reply.code(200).send({ 
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          academicInfo: user.academicInfo
        }
      });
    } catch (error: unknown) {
      console.error('Error logging in:', error);
      return reply.code(500).send({ 
        message: 'Error logging in', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Forgot Password
  fastify.post('/forgot-password', async (request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) => {
    try {
      const parsed = forgotPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          message: 'Invalid email',
          errors: parsed.error.errors 
        });
      }

      const user = await UserService.getUserByEmail(parsed.data.email);
      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      const resetCode = uuidv4();
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      await UserService.setResetCode(parsed.data.email, resetCode, expiry);
      await sendPasswordResetCodeEmail(parsed.data.email, resetCode);

      return reply.code(200).send({ message: 'Password reset code sent to your email' });
    } catch (error: unknown) {
      console.error('Error sending reset code:', error);
      return reply.code(500).send({ 
        message: 'Error sending reset code', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Reset Password
  fastify.post('/reset-password', async (request: FastifyRequest<{ Body: { email: string; resetCode: string; newPassword: string } }>, reply: FastifyReply) => {
    try {
      const parsed = resetPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          message: 'Invalid reset data',
          errors: parsed.error.errors 
        });
      }

      const isValid = await UserService.verifyResetCode(parsed.data.email, parsed.data.resetCode);
      if (!isValid) {
        return reply.code(400).send({ message: 'Invalid or expired reset code' });
      }

      const user = await UserService.updatePassword(parsed.data.email, parsed.data.newPassword);
      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      return reply.code(200).send({ message: 'Password reset successful' });
    } catch (error: unknown) {
      console.error('Error resetting password:', error);
      return reply.code(500).send({ 
        message: 'Error resetting password', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
} 