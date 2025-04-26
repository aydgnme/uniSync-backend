import { User, IUser, IUserDocument, IUserBase } from '../models/user.model';
import * as bcrypt from 'bcryptjs';
import { FirebaseService } from './firebase.service';
import { DocumentData } from 'firebase-admin/firestore';

export class UserService {
  static async createUser(userData: IUserBase): Promise<IUser> {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      const savedUser = await user.save();

      // Create Firebase profile
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
      console.error('Error creating user:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create user');
    }
  }

  static async findUserByCnpAndMatriculation(
    cnp: string,
    matriculationNumber: string
  ): Promise<IUser | null> {
    try {
      const user = await User.findOne({ cnp, matriculationNumber });
      if (!user) return null;
      return this.mapToIUser(user);
    } catch (error: unknown) {
      console.error('Error finding user by CNP and Matriculation number:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to find user');
    }
  }

  static async getAllUsers(): Promise<IUser[]> {
    try {
      // Fetch all users without password field
      const users = await User.find().select('-password');
      
      // Fetch Firebase profiles for all users in parallel
      const usersWithFirebase = await Promise.all(
        users.map(async (user) => {
          const firebaseProfile = await FirebaseService.getUserProfile(user._id.toString());
          return this.mapToIUser(user, firebaseProfile || undefined);
        })
      );
      
      return usersWithFirebase;
    } catch (error: unknown) {
      console.error('Error fetching all users:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }

  static async getUserById(id: string): Promise<IUser | null> {
    try {
      const user = await User.findById(id).select('-password');
      if (!user) return null;

      const firebaseProfile = await FirebaseService.getUserProfile(id);
      return this.mapToIUser(user, firebaseProfile || undefined);
    } catch (error: unknown) {
      console.error('Error fetching user by ID:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  static async getUserByEmail(email: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ email });
      if (!user) return null;
      return this.mapToIUser(user);
    } catch (error: unknown) {
      console.error('Error fetching user by email:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  static async getUserByCnp(cnp: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ cnp });
      if (!user) return null;
      return this.mapToIUser(user);
    } catch (error: unknown) {
      console.error('Error fetching user by CNP:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  static async getUserByMatriculationNumber(matriculationNumber: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ matriculationNumber });
      if (!user) return null;
      return this.mapToIUser(user);
    } catch (error: unknown) {
      console.error('Error fetching user by matriculation number:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
    }
  }

  static async updateUser(id: string, userData: Partial<IUserBase>): Promise<IUser | null> {
    try {
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      const user = await User.findByIdAndUpdate(id, userData, { new: true }).select('-password');
      if (!user) return null;

      // Update Firebase profile if needed
      if (userData.academicInfo) {
        await FirebaseService.updateUserProfile(id, {
          academicInfo: userData.academicInfo
        });
      }

      const firebaseProfile = await FirebaseService.getUserProfile(id);
      return this.mapToIUser(user, firebaseProfile || undefined);
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update user');
    }
  }

  static async deleteUser(id: string): Promise<IUser | null> {
    try {
      const user = await User.findByIdAndDelete(id);
      if (user) {
        await FirebaseService.deleteUserProfile(id);
        return this.mapToIUser(user);
      }
      return null;
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  }

  static async updatePassword(id: string, newPassword: string): Promise<IUser | null> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const user = await User.findByIdAndUpdate(
        id,
        { password: hashedPassword },
        { new: true }
      ).select('-password');
      if (!user) return null;
      return this.mapToIUser(user);
    } catch (error: unknown) {
      console.error('Error updating password:', error);
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
      if (!user) return null;
      return this.mapToIUser(user);
    } catch (error: unknown) {
      console.error('Error setting reset code:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to set reset code');
    }
  }

  static async verifyResetCode(cnp: string, matriculationNumber: string, code: string): Promise<boolean> {
    try {
      const user = await User.findOne({ cnp, matriculationNumber });
  
      if (!user || !user.resetCode || !user.resetCodeExpiry) {
        return false;
      }
  
      const isCodeValid = user.resetCode === code;
      const isNotExpired = Date.now() <= user.resetCodeExpiry;
  
      return isCodeValid && isNotExpired;
    } catch (error: unknown) {
      console.error('Error verifying reset code:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to verify reset code');
    }
  }

  static async updatePasswordByCnpAndMatriculation(
    cnp: string,
    matriculationNumber: string,
    newPassword: string
  ): Promise<IUser | null> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const user = await User.findOneAndUpdate(
        { cnp, matriculationNumber },
        { 
          password: hashedPassword,
          resetCode: null,
          resetCodeExpiry: null
        },
        { new: true }
      ).select('-password');
      
      if (!user) return null;
      return this.mapToIUser(user);
    } catch (error: unknown) {
      console.error('Error updating password:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update password');
    }
  }

  private static mapToIUser(user: IUserDocument, firebaseData?: DocumentData): IUser {
    const { _id, ...rest } = user.toObject();
    return {
      ...rest,
      _id: _id.toString(),
      firebaseData
    };
  }
} 