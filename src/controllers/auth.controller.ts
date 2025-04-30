import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service';
import { IUserBase } from '../models/user.model';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetCodeEmail } from '../services/email.service';
import * as bcrypt from 'bcryptjs';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const findUserSchema = z.object({
  cnp: z.string(),
  matriculationNumber: z.string()
});

const checkUserSchema = z.object({
  email: z.string().email(),
  matriculationNumber: z.string()
});

const generateResetCodeSchema = z.object({
  cnp: z.string(),
  matriculationNumber: z.string()
});

const resetPasswordSchema = z.object({
  cnp: z.string(),
  matriculationNumber: z.string(),
  code: z.string(),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(6)
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const AuthController = {
  async login(request: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) {
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

      const token = request.server.jwt.sign({ 
        userId: user._id,
        email: user.email
      });

      return reply.code(200).send({ 
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  },

  async checkUser(request: FastifyRequest<{ Body: { email: string; matriculationNumber: string } }>, reply: FastifyReply) {
    try {
      const parsed = checkUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          message: 'Invalid user data',
          errors: parsed.error.errors 
        });
      }

      const user = await UserService.getUserByEmail(parsed.data.email);
      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      if (user.matriculationNumber !== parsed.data.matriculationNumber) {
        return reply.code(400).send({ message: 'Matriculation number does not match' });
      }

      return reply.code(200).send({ 
        message: 'User verified successfully',
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          matriculationNumber: user.matriculationNumber
        }
      });
    } catch (error) {
      console.error('Check user error:', error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  },

  async findUserByCnpAndMatriculation(request: FastifyRequest<{ Body: { cnp: string; matriculationNumber: string } }>, reply: FastifyReply) {
    try {
      const parsed = findUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          message: 'Invalid user data',
          errors: parsed.error.errors 
        });
      }

      const user = await UserService.findUserByCnpAndMatriculation(
        parsed.data.cnp,
        parsed.data.matriculationNumber
      );

      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      return reply.code(200).send({ user });
    } catch (error) {
      console.error('Find user error:', error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  },

  async generateResetCode(request: FastifyRequest<{ Body: { cnp: string; matriculationNumber: string } }>, reply: FastifyReply) {
    try {
      const parsed = generateResetCodeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          message: 'Invalid user data',
          errors: parsed.error.errors 
        });
      }

      const user = await UserService.findUserByCnpAndMatriculation(
        parsed.data.cnp,
        parsed.data.matriculationNumber
      );

      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      // Generate 6-digit code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      await UserService.setResetCode(parsed.data.cnp, parsed.data.matriculationNumber, resetCode, expiry);
      await sendPasswordResetCodeEmail(user.email, resetCode);

      return reply.code(200).send({ 
        message: 'Password reset code sent to your email'
      });
    } catch (error) {
      console.error('Reset code generation error:', error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  },

  async resetPassword(request: FastifyRequest<{ Body: { cnp: string; matriculationNumber: string; code: string; newPassword: string; confirmPassword: string } }>, reply: FastifyReply) {
    try {
      const parsed = resetPasswordSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          message: 'Invalid reset data',
          errors: parsed.error.errors 
        });
      }

      const user = await UserService.findUserByCnpAndMatriculation(
        parsed.data.cnp,
        parsed.data.matriculationNumber
      );

      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      const isValid = await UserService.verifyResetCode(
        parsed.data.cnp,
        parsed.data.matriculationNumber,
        parsed.data.code
      );

      if (!isValid) {
        return reply.code(400).send({ message: 'Invalid or expired reset code' });
      }

      const updatedUser = await UserService.updatePasswordByCnpAndMatriculation(
        parsed.data.cnp,
        parsed.data.matriculationNumber,
        parsed.data.newPassword
      );

      if (!updatedUser) {
        return reply.code(500).send({ message: 'Failed to update password' });
      }

      return reply.code(200).send({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  }
}; 