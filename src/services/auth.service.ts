import { supabase } from '../lib/supabase';
import * as bcrypt from 'bcryptjs';
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

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;
type GenerateResetCodeInput = z.infer<typeof generateResetCodeSchema>;
type VerifyResetCodeInput = z.infer<typeof verifyResetCodeSchema>;
type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
type CheckUserInput = z.infer<typeof checkUserSchema>;
type FindUserInput = z.infer<typeof findUserSchema>;

export const AuthService = {
  async register(data: RegisterInput) {
    const normalizedEmail = data.email.toLowerCase().trim();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, 10);

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        password_hash,
        first_name: data.first_name,
        last_name: data.last_name,
        role: 'student',
        phone_number: data.phone_number,
        gender: data.gender,
        date_of_birth: data.date_of_birth.split('.').reverse().join('-'),
        nationality: data.nationality
      })
      .select()
      .single();

    if (userError || !user) {
      console.error('User creation error:', userError);
      throw new Error(`Failed to create user: ${userError?.message || 'Unknown error'}`);
    }

    // Create student record
    const { error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: user.id,
        cnp: data.cnp,
        matriculation_number: data.matriculation_number,
        study_year: data.academicInfo.study_year,
        semester: data.academicInfo.semester,
        group_name: data.academicInfo.group_name,
        subgroup: data.academicInfo.subgroup || null,
        advisor: data.academicInfo.advisor,
        is_modular: data.academicInfo.is_modular,
        gpa: data.academicInfo.gpa,
        faculty_id: data.academicInfo.faculty_id,
        specialization_id: data.academicInfo.specialization_id
      });

    if (studentError) {
      console.error('Student record creation error:', studentError);
      // Rollback user creation
      await supabase.from('users').delete().eq('id', user.id);
      throw new Error(`Failed to create student record: ${studentError.message}`);
    }

    return user;
  },

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
  },

  async checkUser(data: CheckUserInput) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*, students!inner(matriculation_number)')
      .eq('email', data.email)
      .single();

    if (error || !user) {
      throw new Error('User not found');
    }

    if (user.students.matriculation_number !== data.matriculation_number) {
      throw new Error('Matriculation number does not match');
    }

    return user;
  },

  async findUserByCnpAndMatriculation(data: FindUserInput) {
    const { data: student, error } = await supabase
      .from('students')
      .select('*, users(*)')
      .eq('cnp', data.cnp)
      .eq('matriculation_number', data.matriculation_number)
      .single();

    if (error || !student) {
      throw new Error('User not found');
    }

    return student;
  },

  async generateResetCode(data: GenerateResetCodeInput) {
    // Find student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('cnp', data.cnp)
      .eq('matriculation_number', data.matriculation_number)
      .single();

    if (studentError || !student) {
      throw new Error('User not found');
    }

    // Generate reset code
    const reset_code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Create reset request
    const { error: resetError } = await supabase
      .from('password_reset_requests')
      .insert({
        cnp: data.cnp,
        matriculation_number: data.matriculation_number,
        reset_code,
        expires_at
      });

    if (resetError) {
      throw new Error('Failed to generate reset code');
    }

    // Get user email
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', student.user_id)
      .single();

    return { email: user?.email, reset_code };
  },

  async verifyResetCode(data: VerifyResetCodeInput) {
    const { data: resetRequest, error } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('cnp', data.cnp)
      .eq('matriculation_number', data.matriculation_number)
      .eq('reset_code', data.reset_code)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (error || !resetRequest) {
      throw new Error('Invalid or expired reset code');
    }

    return true;
  },

  async resetPassword(data: ResetPasswordInput) {
    if (data.new_password !== data.confirm_password) {
      throw new Error('Passwords do not match');
    }

    // Verify reset code
    const { data: resetRequest, error: resetError } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('cnp', data.cnp)
      .eq('matriculation_number', data.matriculation_number)
      .eq('reset_code', data.reset_code)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (resetError || !resetRequest) {
      throw new Error('Invalid or expired reset code');
    }

    // Get user ID
    const { data: student } = await supabase
      .from('students')
      .select('user_id')
      .eq('cnp', data.cnp)
      .eq('matriculation_number', data.matriculation_number)
      .single();

    if (!student) {
      throw new Error('User not found');
    }

    // Update password
    const password_hash = await bcrypt.hash(data.new_password, 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', student.user_id);

    if (updateError) {
      throw new Error('Failed to update password');
    }

    // Mark reset code as used
    await supabase
      .from('password_reset_requests')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetRequest.id);

    return true;
  }
};
