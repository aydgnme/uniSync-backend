import { supabase } from '../lib/supabase';
import * as bcrypt from 'bcryptjs';

export class PasswordResetService {
  static async createResetCode(cnp: string, matriculationNumber: string): Promise<string> {
    // Find student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('cnp', cnp)
      .eq('matriculation_number', matriculationNumber)
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
        cnp,
        matriculation_number: matriculationNumber,
        reset_code,
        expires_at
      });

    if (resetError) {
      throw new Error('Failed to generate reset code');
    }

    return reset_code;
  }

  static async validateResetCode(
    cnp: string,
    matriculationNumber: string,
    code: string
  ): Promise<boolean> {
    const { data: resetRequest, error } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('cnp', cnp)
      .eq('matriculation_number', matriculationNumber)
      .eq('reset_code', code)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (error || !resetRequest) {
      return false;
    }

    return true;
  }

  static async resetPassword(
    cnp: string,
    matriculationNumber: string,
    code: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      // Verify reset code
      const { data: resetRequest, error: resetError } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('cnp', cnp)
        .eq('matriculation_number', matriculationNumber)
        .eq('reset_code', code)
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
        .eq('cnp', cnp)
        .eq('matriculation_number', matriculationNumber)
        .single();

      if (!student) {
        throw new Error('User not found');
      }

      // Update password
      const password_hash = await bcrypt.hash(newPassword, 10);
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
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return false;
    }
  }
} 