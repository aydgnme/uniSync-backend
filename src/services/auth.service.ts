import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  generateResetCodeSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  checkUserSchema,
  findUserSchema
} from '../schemas/auth.schemas';
import jwt from 'jsonwebtoken';
import { config } from '../config';

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type GenerateResetCodeInput = z.infer<typeof generateResetCodeSchema>;
type VerifyResetCodeInput = z.infer<typeof verifyResetCodeSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
type CheckUserInput = z.infer<typeof checkUserSchema>;
type FindUserInput = z.infer<typeof findUserSchema>;

interface AcademicInfo {
  is_modular: boolean;
  faculty_id?: string | null;
  group_name?: string | null;
  gpa?: number | null;
  study_year?: number;
  semester?: number;
  subgroup?: string;
  advisor?: string;
  specialization_id?: string;
}

interface UserData {
  email: string;
  date_of_birth?: string;
  academicInfo?: AcademicInfo;
  matriculationNumber?: string;
}

interface Student {
  matriculation_number: string;
}

interface User {
  id: string;
  email: string;
  students: Student | Student[] | null;
}

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
    date_of_birth?: string;
    academicInfo?: AcademicInfo;
  }) {
    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const { data: user, error } = await supabase
      .from('users')
      .insert({
          email: data.email,
          password_hash: hashedPassword,
        first_name: data.first_name,
        last_name: data.last_name,
          role: data.role,
          date_of_birth: data.date_of_birth,
          academic_info: data.academicInfo
      })
      .select()
      .single();

      if (error) throw error;
      return user;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(data: LoginInput) {
    const normalizedEmail = data.email.toLowerCase().trim();

    const { data: user, error } = await supabase
      .from('users')
      .select('*, students!inner(matriculation_number)')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return user;
  }

  async checkUser(data: CheckUserInput) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*, students(matriculation_number)')
      .eq('email', data.email)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    // @ts-ignore - Supabase response type is not correctly inferred
    const typedUser = user as User;
    const student = Array.isArray(typedUser.students) ? typedUser.students[0] : typedUser.students;
    if (!student || student.matriculation_number !== data.matriculation_number) {
      throw new Error('Matriculation number does not match');
    }

    return typedUser;
  }

  async findUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, students(matriculation_number)')
        .eq('email', email)
        .single();

      if (error) throw error;

      const user = data as User;
      return user;
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  async findUserByCnpAndMatriculation(cnp: string, matriculationNumber: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('cnp', cnp)
        .eq('matriculation_number', matriculationNumber)
      .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Find user error:', error);
      throw error;
    }
  }

  async generateResetCode(cnp: string, matriculationNumber: string) {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { error } = await supabase
        .from('password_resets')
      .insert({
          cnp,
          matriculation_number: matriculationNumber,
          reset_code: code,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });

      if (error) throw error;
      return code;
    } catch (error) {
      logger.error('Generate reset code error:', error);
      throw error;
    }
  }

  async verifyResetCode(cnp: string, matriculationNumber: string, code: string) {
    try {
      const { data, error } = await supabase
        .from('password_resets')
      .select('*')
        .eq('cnp', cnp)
        .eq('matriculation_number', matriculationNumber)
        .eq('reset_code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

      if (error) throw error;
      return !!data;
    } catch (error) {
      logger.error('Verify reset code error:', error);
      throw error;
    }
  }

  async resetPassword(data: {
    code: string;
    cnp: string;
    matriculationNumber: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    try {
      if (data.newPassword !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      const { error: resetError } = await supabase
        .from('password_resets')
        .update({ used: true })
      .eq('cnp', data.cnp)
        .eq('matriculation_number', data.matriculationNumber)
        .eq('reset_code', data.code);

      if (resetError) throw resetError;

    const { error: updateError } = await supabase
      .from('users')
        .update({ password_hash: hashedPassword })
        .eq('cnp', data.cnp)
        .eq('matriculation_number', data.matriculationNumber);

      if (updateError) throw updateError;
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  async createSession(userId: string, deviceInfo: string) {
    try {
      logger.info('Creating session for user:', { userId, deviceInfo });

      const { data: session, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          device_info: deviceInfo,
          login_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        logger.error('Supabase error creating session:', error);
        throw error;
      }

      logger.info('Session created successfully:', { sessionId: session.id });
      return session;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  async endSession(sessionId: string) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error ending session:', error);
      throw error;
    }
  }

  async getUserSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  async getActiveSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching active sessions:', error);
      throw error;
    }
  }
}
