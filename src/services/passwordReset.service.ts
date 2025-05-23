import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PasswordReset } from '../models/PasswordReset.model';
import { User } from '../models/user.model';
import { generateCode } from '../utils/generateCode';
import { UserService } from './user.service';

export class PasswordResetService {
  private static generateKey(cnp: string, matriculationNumber: string): string {
    return createHash('sha256')
      .update(`${cnp}:${matriculationNumber}`)
      .digest('hex');
  }

  static async createResetCode(cnp: string, matriculationNumber: string): Promise<string> {
    const key = this.generateKey(cnp, matriculationNumber);
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await PasswordReset.create({
      key,
      code,
      expiresAt
    });

    return code;
  }

  static async validateResetCode(
    cnp: string,
    matriculationNumber: string,
    code: string
  ): Promise<boolean> {
    const key = this.generateKey(cnp, matriculationNumber);
    const resetData = await PasswordReset.findOne({ key, code });

    if (!resetData) return false;
    if (resetData.expiresAt < new Date()) return false;

    return true;
  }

  static async resetPassword(
    cnp: string,
    matriculationNumber: string,
    code: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const key = this.generateKey(cnp, matriculationNumber);
      const resetData = await PasswordReset.findOne({ key, code });
    
      if (!resetData) return false;
      if (resetData.expiresAt < new Date()) return false;
    
      // Update password using UserService
      const updatedUser = await UserService.updatePasswordByCnpAndMatriculation(
        cnp,
        matriculationNumber,
        newPassword
      );

      if (!updatedUser) return false;
    
      // Reset kodunu sil
      await PasswordReset.deleteOne({ key });
    
      return true;
    } catch (error) {
      console.error('Error in resetPassword:', error);
      return false;
    }
  }
} 