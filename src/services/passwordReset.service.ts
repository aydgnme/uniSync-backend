import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PasswordReset } from '../models/PasswordReset.model';
import { User } from '../models/user.model';
import { generateCode } from '../utils/generateCode';

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
    const key = this.generateKey(cnp, matriculationNumber);
    const resetData = await PasswordReset.findOne({ key, code });
  
    if (!resetData) return false;
    if (resetData.expiresAt < new Date()) return false;
  
    const user = await User.findOne({ cnp, matriculationNumber });
    if (!user) return false;
  
    // ✅ Şifreyi hashle
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
  
    await user.save();
    await PasswordReset.deleteOne({ key });
  
    return true;
  }
} 