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

const verifyResetCodeSchema = z.object({
  cnp: z.string(),
  matriculationNumber: z.string(),
  code: z.string().length(6, 'Reset code must be 6 digits')
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  cnp: z.string(),
  matriculationNumber: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  academicInfo: z.object({
    program: z.string(),
    semester: z.number(),
    groupName: z.string(),
    subgroupIndex: z.string(),
    advisor: z.string(),
    gpa: z.number(),
    specializationShortName: z.string(),
    facultyId: z.string()
  })
});

export const AuthController = {
  async login(request: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) {
    try {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        console.log('Login validation failed:', parsed.error.errors);
        return reply.code(400).send({ 
          message: 'Invalid login data',
          errors: parsed.error.errors 
        });
      }

      const normalizedEmail = parsed.data.email.toLowerCase().trim();
      console.log('Attempting login for normalized email:', normalizedEmail);
      
      const user = await UserService.getUserByEmail(normalizedEmail, true);
      if (!user) {
        console.log('User not found for email:', normalizedEmail);
        return reply.code(401).send({ message: 'Invalid email or password' });
      }

      console.log('User found:', {
        userId: user._id,
        email: user.email,
        hasPassword: !!user.password,
        passwordLength: user.password?.length
      });

      const isPasswordValid = await bcrypt.compare(parsed.data.password, user.password);
      console.log('Password validation details:', {
        isPasswordValid,
        inputPasswordLength: parsed.data.password.length,
        storedPasswordLength: user.password.length
      });

      if (!isPasswordValid) {
        console.log('Invalid password for user:', user.email);
        return reply.code(401).send({ message: 'Invalid email or password' });
      }

      const token = request.server.jwt.sign({ 
        tokenType: 'access',
        user: {
          userId: user._id.toString(),
          email: user.email,
          role: user.role || 'Student'
        }
      });

      console.log('Login successful for user:', user.email);
      return reply.code(200).send({ 
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role || 'Student'
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
  },

  async verifyResetCode(request: FastifyRequest<{ Body: { cnp: string; matriculationNumber: string; code: string } }>, reply: FastifyReply) {
    try {
      const parsed = verifyResetCodeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          message: 'Invalid data',
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

      return reply.code(200).send({ 
        message: 'Reset code verified successfully',
        isValid: true
      });
    } catch (error) {
      console.error('Reset code verification error:', error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  },

  async register(request: FastifyRequest<{ Body: z.infer<typeof registerSchema> }>, reply: FastifyReply) {
    try {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) {
        console.log('Registration validation failed:', parsed.error.errors);
        return reply.code(400).send({ 
          message: 'Invalid registration data',
          errors: parsed.error.errors 
        });
      }

      console.log('Attempting registration for email:', parsed.data.email);
      
      const existingUser = await UserService.getUserByEmail(parsed.data.email);
      if (existingUser) {
        console.log('Email already registered:', parsed.data.email);
        return reply.code(400).send({ message: 'Email already registered' });
      }

      const userData: IUserBase = {
        email: parsed.data.email,
        password: parsed.data.password,
        name: parsed.data.name,
        cnp: parsed.data.cnp,
        matriculationNumber: parsed.data.matriculationNumber,
        phone: parsed.data.phone || '',
        address: parsed.data.address || '',
        role: 'Student',
        academicInfo: {
          ...parsed.data.academicInfo,
          studentId: parsed.data.matriculationNumber
        }
      };

      const user = await UserService.createUser(userData);

      console.log('User registered successfully:', {
        userId: user._id,
        email: user.email
      });

      const token = request.server.jwt.sign({ 
        tokenType: 'access',
        user: {
          userId: user._id,
          email: user.email,
          role: user.role
        }
      });

      return reply.code(201).send({ 
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          academicInfo: user.academicInfo
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  }
}; 