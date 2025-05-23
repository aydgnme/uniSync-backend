import { User, IUser, IUserDocument, IUserBase } from '../models/user.model';
import { FirebaseService } from './firebase.service';
import { DocumentData } from 'firebase-admin/firestore';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export class UserService {
  private static readonly SALT_ROUNDS = 10;

  static async createUser(userData: IUserBase): Promise<IUser> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, this.SALT_ROUNDS);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      const savedUser = await user.save();

      await FirebaseService.createUserProfile(savedUser._id.toString(), {
        profilePicture: null,
        notifications: [],
        lastOnline: new Date(),
        settings: {
          theme: 'light',
          language: 'en',
          notifications: true
        }
      });

      return this.mapToIUser(savedUser);
    } catch (error: unknown) {
      logger.error('Error creating user:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create user');
    }
  }

  static async findUserByCnpAndMatriculation(cnp: string, matriculationNumber: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ cnp, matriculationNumber });
      return user ? this.mapToIUser(user) : null;
    } catch (error: unknown) {
      logger.error('Error finding user by CNP and Matriculation number:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to find user');
    }
  }

  static async getAllUsers(): Promise<IUser[]> {
    try {
      const users = await User.find().select('-password');
      const usersWithFirebase = await Promise.all(
        users.map(async (user) => {
          const firebaseProfile = await FirebaseService.getUserProfile(user._id.toString());
          return this.mapToIUser(user, firebaseProfile || undefined);
        })
      );
      return usersWithFirebase;
    } catch (error: unknown) {
      logger.error('Error fetching all users:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }

  static async getUserById(id: string): Promise<IUser | null> {
    try {
      logger.info('Fetching user with ID:', id);
      if (!mongoose.Types.ObjectId.isValid(id)) {
        logger.warn('Invalid MongoDB ObjectId format:', id);
        return null;
      }
      const user = await User.findById(id).select('-password');
      if (!user) {
        logger.warn('User not found in database');
        return null;
      }
      const firebaseProfile = await FirebaseService.getUserProfile(id);
      return this.mapToIUser(user, firebaseProfile || undefined);
    } catch (error: unknown) {
      logger.error('Error fetching user by ID:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  static async getUserByEmail(email: string, includePassword = false): Promise<IUser | null> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const query = User.findOne({ email: normalizedEmail });
      if (!includePassword) query.select('-password');
      const user = await query;
      return user ? this.mapToIUser(user) : null;
    } catch (error: unknown) {
      logger.error('Error fetching user by email:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  static async getUserByCnp(cnp: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ cnp });
      return user ? this.mapToIUser(user) : null;
    } catch (error: unknown) {
      logger.error('Error fetching user by CNP:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  static async getUserByMatriculationNumber(matriculationNumber: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ matriculationNumber });
      return user ? this.mapToIUser(user) : null;
    } catch (error: unknown) {
      logger.error('Error fetching user by matriculation number:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  static async updateUser(id: string, userData: Partial<IUserBase>): Promise<IUser | null> {
    try {
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, this.SALT_ROUNDS);
      }
      const user = await User.findByIdAndUpdate(id, userData, { new: true }).select('-password');
      if (!user) return null;

      if (userData.academicInfo) {
        await FirebaseService.updateUserProfile(id, { academicInfo: userData.academicInfo });
      }

      const firebaseProfile = await FirebaseService.getUserProfile(id);
      return this.mapToIUser(user, firebaseProfile || undefined);
    } catch (error: unknown) {
      logger.error('Error updating user:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update user');
    }
  }

  static async deleteUser(id: string): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) return null;
      await FirebaseService.deleteUserProfile(id);
      return this.mapToIUser(user);
    } catch (error: unknown) {
      logger.error('Error deleting user:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  }

  static async updatePassword(id: string, newPassword: string): Promise<IUser | null> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
      const user = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true }).select('-password');
      return user ? this.mapToIUser(user) : null;
    } catch (error: unknown) {
      logger.error('Error updating password:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update password');
    }
  }

  static async setResetCode(cnp: string, matriculationNumber: string, code: string, expiry: number): Promise<IUser | null> {
    try {
      const user = await User.findOneAndUpdate(
        { cnp, matriculationNumber },
        { resetCode: code, resetCodeExpiry: expiry },
        { new: true }
      );
      return user ? this.mapToIUser(user) : null;
    } catch (error: unknown) {
      logger.error('Error setting reset code:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to set reset code');
    }
  }

  static async verifyResetCode(cnp: string, matriculationNumber: string, code: string): Promise<boolean> {
    try {
      const user = await User.findOne({ cnp, matriculationNumber });
      return !!(user && user.resetCode === code && Date.now() <= user.resetCodeExpiry);
    } catch (error: unknown) {
      logger.error('Error verifying reset code:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to verify reset code');
    }
  }

  static async updatePasswordByCnpAndMatriculation(cnp: string, matriculationNumber: string, newPassword: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ cnp, matriculationNumber });
      if (!user) throw new Error('User not found');

      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
      const updatedUser = await User.findOneAndUpdate(
        { cnp, matriculationNumber },
        { password: hashedPassword, resetCode: null, resetCodeExpiry: null },
        { new: true }
      );
      if (!updatedUser) throw new Error('Failed to update password');

      const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password);
      if (!isPasswordValid) throw new Error('Password update verification failed');

      return this.mapToIUser(updatedUser);
    } catch (error: unknown) {
      logger.error('Error updating password by CNP and Matriculation:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update password');
    }
  }

  private static mapToIUser(user: IUserDocument, firebaseData?: DocumentData): IUser {
    const userObj = user.toObject();
    return {
      _id: userObj._id.toString(),
      email: userObj.email,
      password: userObj.password,
      cnp: userObj.cnp,
      matriculationNumber: userObj.matriculationNumber,
      name: userObj.name,
      role: userObj.role,
      phone: userObj.phone,
      address: userObj.address,
      academicInfo: userObj.academicInfo,
      resetCode: userObj.resetCode,
      resetCodeExpiry: userObj.resetCodeExpiry,
      firebaseData
    };
  }
}