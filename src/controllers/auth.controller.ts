import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { sendPasswordResetCodeEmail } from '../services/email.service';
import { AuthService } from '../services/auth.service';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';
import { config } from '../config';
import {
  registerSchema,
  loginSchema,
  generateResetCodeSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  checkUserSchema,
  findUserSchema,
  changePasswordSchema
} from '../schemas/auth.schemas';

interface JwtPayload {
  tokenType: string;
  user: {
    userId: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
    matriculationNumber: string;
    iat?: number;
    exp?: number;
  };
}

export class AuthController {
  private authService: AuthService;
  private fastify: FastifyInstance;

  constructor(fastify: FastifyInstance) {
    this.authService = new AuthService();
    this.fastify = fastify;
  }

  async login(request: FastifyRequest<{ Body: z.infer<typeof loginSchema> }>, reply: FastifyReply) {
    try {
      const body = loginSchema.parse(request.body);
      logger.info('Login attempt:', { email: body.email });

      // Get user from database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*, students(*)')
        .eq('email', body.email)
        .single();

      if (userError) {
        logger.error('Database error during login:', userError);
        return reply.code(500).send({
          message: 'Internal server error',
          code: 'DATABASE_ERROR'
        });
      }

      if (!user) {
        logger.warn('User not found:', { email: body.email });
        return reply.code(401).send({
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(body.password, user.password_hash);
      if (!isValidPassword) {
        logger.warn('Invalid password:', { email: body.email });
        return reply.code(401).send({
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate JWT token
      const token = request.server.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role
      }, {
        expiresIn: '24h'
      });

      // Create session
      const ipAddress = request.ip;
      const deviceInfo = request.headers['user-agent'] || 'Unknown';
      
      try {
        const session = await this.authService.createSession(user.id, deviceInfo);
        logger.info('Login successful:', { userId: user.id, sessionId: session.id });

        return reply.code(200).send({
          token,
          sessionId: session.id,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            phone_number: user.phone_number,
            gender: user.gender,
            date_of_birth: user.date_of_birth,
            nationality: user.nationality,
            matriculation_number: user.students?.matriculation_number
          }
        });
      } catch (sessionError) {
        logger.error('Session creation failed:', sessionError);
        // Session oluşturulamasa bile login başarılı sayılabilir
        return reply.code(200).send({
          token,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            phone_number: user.phone_number,
            gender: user.gender,
            date_of_birth: user.date_of_birth,
            nationality: user.nationality,
            matriculation_number: user.students?.matriculation_number
          }
        });
      }
    } catch (error) {
      logger.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return reply.code(401).send({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const sessionId = request.headers['x-session-id'] as string;
      
      if (!sessionId) {
        logger.warn('No session ID provided for token refresh');
        return reply.code(401).send({
          message: 'No session ID provided',
          code: 'NO_SESSION_ID'
        });
      }

      // Get session from database
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*, users(*)')
        .eq('id', sessionId)
        .is('logout_time', null)
        .single();

      if (sessionError || !session) {
        logger.warn('Invalid or expired session:', { sessionId });
        return reply.code(401).send({
          message: 'Invalid or expired session',
          code: 'INVALID_SESSION'
        });
      }

      // Generate new JWT token
      const token = request.server.jwt.sign({
        userId: session.users.id,
        email: session.users.email,
        role: session.users.role
      }, {
        expiresIn: '24h'
      });

      logger.info('Token refreshed successfully:', { userId: session.users.id });

      return reply.code(200).send({
        token,
        user: {
          id: session.users.id,
          email: session.users.email,
          role: session.users.role
        }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      return reply.code(401).send({
        message: 'Failed to refresh token',
        code: 'REFRESH_FAILED'
      });
    }
  }

  async generateResetCode(request: FastifyRequest<{ Body: z.infer<typeof generateResetCodeSchema> }>, reply: FastifyReply) {
    try {
      const body = generateResetCodeSchema.parse(request.body);
      logger.info('Generate reset code request:', {
        cnp: body.cnp,
        matriculationNumber: body.matriculationNumber
      });

      // Find student by CNP and matriculation number
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*, users!inner(*)')
        .eq('cnp', body.cnp)
        .eq('matriculation_number', body.matriculationNumber)
        .single();

      if (studentError || !student) {
        logger.warn('Student not found:', {
          cnp: body.cnp,
          matriculationNumber: body.matriculationNumber
        });
        return reply.code(404).send({
          message: 'Student not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Generate reset code
      const reset_code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes in UTC

      // Store reset code
      const { error: resetError } = await supabase
        .from('password_reset_requests')
        .insert({
          cnp: body.cnp,
          matriculation_number: body.matriculationNumber,
          reset_code,
          expires_at
        });

      if (resetError) {
        logger.error('Error storing reset code:', resetError);
        throw resetError;
      }

      // Send email
      try {
        await sendPasswordResetCodeEmail(student.users.email, reset_code);
      } catch (emailError) {
        logger.error('Error sending reset code email:', emailError);
        // Delete the reset code if email sending fails
        await supabase
          .from('password_reset_requests')
          .delete()
          .eq('cnp', body.cnp)
          .eq('matriculation_number', body.matriculationNumber)
          .eq('reset_code', reset_code);
        throw emailError;
      }

      logger.info('Reset code generated successfully:', { userId: student.user_id });

      return reply.code(200).send({
        message: 'Password reset code sent to your email',
        success: true
      });
    } catch (error) {
      logger.error('Generate reset code error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return reply.code(500).send({
        message: 'Failed to generate reset code',
        code: 'RESET_CODE_GENERATION_FAILED'
      });
    }
  }

  async verifyResetCode(request: FastifyRequest<{ Body: z.infer<typeof verifyResetCodeSchema> }>, reply: FastifyReply) {
    try {
      const body = verifyResetCodeSchema.parse(request.body);
      logger.info('Verify reset code request:', {
        cnp: body.cnp,
        matriculationNumber: body.matriculationNumber
      });

      // Find student by CNP and matriculation number
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*, users!inner(*)')
        .eq('cnp', body.cnp)
        .eq('matriculation_number', body.matriculationNumber)
        .single();

      if (studentError || !student) {
        logger.warn('Student not found:', {
          cnp: body.cnp,
          matriculationNumber: body.matriculationNumber
        });
        return reply.code(404).send({
          message: 'Student not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Verify reset code
      const { data: reset, error: resetError } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('cnp', body.cnp)
        .eq('matriculation_number', body.matriculationNumber)
        .eq('reset_code', body.reset_code)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (resetError || !reset) {
        logger.warn('Invalid or expired reset code:', {
          cnp: body.cnp,
          matriculationNumber: body.matriculationNumber
        });
        return reply.code(400).send({
          message: 'Invalid or expired reset code',
          code: 'INVALID_RESET_CODE'
        });
      }

      logger.info('Reset code verified successfully:', { userId: student.user_id });

      return reply.code(200).send({
        message: 'Reset code verified successfully',
        isValid: true
      });
    } catch (error) {
      logger.error('Verify reset code error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return reply.code(400).send({
        message: 'Invalid or expired reset code',
        code: 'INVALID_RESET_CODE'
      });
    }
  }

  async resetPassword(request: FastifyRequest<{ Body: z.infer<typeof resetPasswordSchema> }>, reply: FastifyReply) {
    try {
      const body = resetPasswordSchema.parse(request.body);
      logger.info('Reset password request:', {
        cnp: body.cnp,
        matriculationNumber: body.matriculationNumber
      });

      // Validate passwords match
      if (body.newPassword !== body.confirmPassword) {
        return reply.code(400).send({
          message: 'Passwords do not match',
          code: 'PASSWORDS_DONT_MATCH'
        });
      }

      // Find student by CNP and matriculation number
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*, users!inner(*)')
        .eq('cnp', body.cnp)
        .eq('matriculation_number', body.matriculationNumber)
        .single();

      if (studentError || !student) {
        logger.warn('Student not found:', {
          cnp: body.cnp,
          matriculationNumber: body.matriculationNumber
        });
        return reply.code(404).send({
          message: 'Student not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      // Verify reset code
      const { data: reset, error: resetError } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('cnp', body.cnp)
        .eq('matriculation_number', body.matriculationNumber)
        .eq('reset_code', body.code)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (resetError || !reset) {
        logger.warn('Invalid or expired reset code:', {
          cnp: body.cnp,
          matriculationNumber: body.matriculationNumber
        });
        return reply.code(400).send({
          message: 'Invalid or expired reset code',
          code: 'INVALID_RESET_CODE'
        });
      }

      // Hash new password
      const password_hash = await bcrypt.hash(body.newPassword, 10);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash })
        .eq('id', student.user_id);

      if (updateError) {
        logger.error('Error updating password:', updateError);
        throw updateError;
      }

      // Delete used reset code
      await supabase
        .from('password_reset_requests')
        .delete()
        .eq('id', reset.id);

      logger.info('Password reset successful:', { userId: student.user_id });

      return reply.code(200).send({
        message: 'Password reset successful'
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return reply.code(400).send({
        message: 'Password reset failed',
        code: 'PASSWORD_RESET_FAILED'
      });
    }
  }

  async checkUser(request: FastifyRequest<{ Body: z.infer<typeof checkUserSchema> }>, reply: FastifyReply) {
    try {
      const body = checkUserSchema.parse(request.body);
      logger.info('Check user request:', { email: body.email });

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*, students(*)')
        .eq('email', body.email)
        .single();

      if (userError || !user) {
        logger.warn('User not found:', { email: body.email });
        return reply.code(404).send({
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      logger.info('User verified successfully:', { userId: user.id });

      return reply.code(200).send({
        message: 'User verified successfully',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          matriculation_number: user.students?.matriculation_number
        }
      });
    } catch (error) {
      logger.error('Check user error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return reply.code(404).send({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }
  }

  async findUserByCnpAndMatriculation(request: FastifyRequest<{ Body: z.infer<typeof findUserSchema> }>, reply: FastifyReply) {
    try {
      const body = findUserSchema.parse(request.body);
      logger.info('Find user request:', {
        cnp: body.cnp,
        matriculationNumber: body.matriculationNumber
      });

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*, users!inner(*)')
        .eq('cnp', body.cnp)
        .eq('matriculation_number', body.matriculationNumber)
        .single();

      if (studentError || !student) {
        logger.warn('Student not found:', {
          cnp: body.cnp,
          matriculationNumber: body.matriculationNumber
        });
        return reply.code(404).send({
          message: 'Student not found',
          code: 'STUDENT_NOT_FOUND'
        });
      }

      logger.info('Student found successfully:', { userId: student.user_id });

      return reply.code(200).send({
        user: {
          id: student.users.id,
          email: student.users.email,
          first_name: student.users.first_name,
          last_name: student.users.last_name,
          matriculation_number: student.matriculation_number,
          cnp: student.cnp,
          role: student.users.role
        }
      });
    } catch (error) {
      logger.error('Find user error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return reply.code(404).send({
        message: 'Student not found',
        code: 'STUDENT_NOT_FOUND'
      });
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const sessionId = request.headers['x-session-id'] as string;
      
      if (sessionId) {
        await this.authService.endSession(sessionId);
        logger.info('Session ended:', { sessionId });
      }

      logger.info('Logout successful');
      return reply.code(200).send({
        message: 'Logout successful',
        success: true
      });
    } catch (error) {
      logger.error('Logout error:', error);
      return reply.code(500).send({
        message: 'Server error',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  async getUserSessions(request: FastifyRequest<{
    Params: { userId: string }
  }>, reply: FastifyReply) {
    try {
      const { userId } = request.params;
      const sessions = await this.authService.getUserSessions(userId);
      return reply.send(sessions);
    } catch (error) {
      logger.error('Error fetching user sessions:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getActiveSessions(request: FastifyRequest<{
    Params: { userId: string }
  }>, reply: FastifyReply) {
    try {
      const { userId } = request.params;
      const sessions = await this.authService.getActiveSessions(userId);
      return reply.send(sessions);
    } catch (error) {
      logger.error('Error fetching active sessions:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async changePassword(request: FastifyRequest<{ Body: z.infer<typeof changePasswordSchema> }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED'
        });
      }

      const body = changePasswordSchema.parse(request.body);
      logger.info('Change password request:', { userId: request.user.userId });

      // Get user from database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', request.user.userId)
        .single();

      if (userError || !user) {
        logger.warn('User not found:', { userId: request.user.userId });
        return reply.code(404).send({
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(body.currentPassword, user.password_hash);
      if (!isValidPassword) {
        logger.warn('Invalid current password:', { userId: request.user.userId });
        return reply.code(401).send({
          message: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        });
      }

      // Hash new password
      const password_hash = await bcrypt.hash(body.newPassword, 10);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash })
        .eq('id', request.user.userId);

      if (updateError) {
        logger.error('Error updating password:', updateError);
        return reply.code(500).send({
          message: 'Failed to update password',
          code: 'UPDATE_FAILED'
        });
      }

      logger.info('Password changed successfully:', { userId: request.user.userId });

      return reply.code(200).send({
        message: 'Password changed successfully',
        success: true
      });
    } catch (error) {
      logger.error('Change password error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return reply.code(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  async createSession(request: FastifyRequest<{
    Body: {
      userId: string;
      deviceInfo: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { userId, deviceInfo } = request.body;
      const session = await this.authService.createSession(userId, deviceInfo);
      return reply.status(201).send(session);
    } catch (error) {
      logger.error('Error creating session:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async endSession(request: FastifyRequest<{
    Params: { sessionId: string }
  }>, reply: FastifyReply) {
    try {
      const { sessionId } = request.params;
      await this.authService.endSession(sessionId);
      return reply.send({ message: 'Session ended successfully' });
    } catch (error) {
      logger.error('Error ending session:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async register(request: FastifyRequest<{ Body: z.infer<typeof registerSchema> }>, reply: FastifyReply) {
    try {
      const body = registerSchema.parse(request.body);
      logger.info('Register attempt:', { email: body.email });

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', body.email)
        .single();

      if (existingUser) {
        logger.warn('User already exists:', { email: body.email });
        return reply.code(400).send({
          message: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(body.password, 10);

      // Create user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: body.email,
          password_hash: passwordHash,
          first_name: body.first_name,
          last_name: body.last_name,
          role: 'student'
        })
        .select()
        .single();

      if (userError) {
        logger.error('Error creating user:', userError);
        return reply.code(500).send({
          message: 'Error creating user',
          code: 'CREATE_USER_ERROR'
        });
      }

      // Create student record
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          matriculation_number: body.matriculation_number,
          cnp: body.cnp
        });

      if (studentError) {
        logger.error('Error creating student record:', studentError);
        // Rollback user creation
        await supabase.from('users').delete().eq('id', user.id);
        return reply.code(500).send({
          message: 'Error creating student record',
          code: 'CREATE_STUDENT_ERROR'
        });
      }

      logger.info('User registered successfully:', { userId: user.id });
      return reply.code(201).send({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return reply.code(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async getMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED'
        });
      }

      // Get user details from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, students(*)')
        .eq('id', user.userId)
        .single();

      if (userError || !userData) {
        logger.error('Error fetching user data:', userError);
        return reply.code(500).send({
          message: 'Error fetching user data',
          code: 'FETCH_USER_ERROR'
        });
      }

      return reply.send({
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role,
        phone_number: userData.phone_number,
        gender: userData.gender,
        date_of_birth: userData.date_of_birth,
        nationality: userData.nationality,
        matriculation_number: userData.students?.matriculation_number
      });
    } catch (error) {
      logger.error('Get me error:', error);
      return reply.code(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async validate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = request.user;
      if (!user) {
        return reply.code(401).send({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED'
        });
      }

      // Get user details from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, students(*)')
        .eq('id', user.userId)
        .single();

      if (userError || !userData) {
        logger.error('Error fetching user data:', userError);
        return reply.code(401).send({
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }

      return reply.send({
        valid: true,
        user: {
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          phone_number: userData.phone_number,
          gender: userData.gender,
          date_of_birth: userData.date_of_birth,
          nationality: userData.nationality,
          matriculation_number: userData.students?.matriculation_number
        }
      });
    } catch (error) {
      logger.error('Token validation error:', error);
      return reply.code(401).send({
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
  }
} 