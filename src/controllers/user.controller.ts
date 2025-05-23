import { FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service';
import { createUserSchema, updateUserSchema } from '../schemas/auth.schemas';
import { logger } from '../utils/logger';
import { IUserBase } from '../models/user.model';

export class UserController {
  static async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user || request.user.role !== 'admin') {
        return reply.code(403).send({
          message: 'Access denied',
          code: 'FORBIDDEN',
          statusCode: 403
        });
      }

      const users = await UserService.getAllUsers();
      return reply.code(200).send({ users });
    } catch (error: unknown) {
      logger.error('Error fetching users:', error);
      return reply.code(500).send({
        message: 'Error fetching users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getUserById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      logger.info('getUserById called with params:', request.params);
      logger.info('User from request:', request.user);

      if (!request.user) {
        logger.warn('No user found in request');
        return reply.code(401).send({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
          statusCode: 401
        });
      }

      // Check if user is admin or requesting their own profile
      const isAdmin = request.user.role.toLowerCase() === 'admin';
      const isOwnProfile = request.user.userId.toString() === request.params.id;
      
      logger.info('Auth check:', { isAdmin, isOwnProfile, userId: request.params.id });

      if (!isAdmin && !isOwnProfile) {
        logger.warn('Access denied - not admin and not own profile');
        return reply.code(403).send({
          message: 'Access denied',
          code: 'FORBIDDEN',
          statusCode: 403
        });
      }

      const user = await UserService.getUserById(request.params.id);
      logger.info('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        logger.warn('User not found in database');
        return reply.code(404).send({
          message: 'User not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      return reply.code(200).send(user);
    } catch (error: unknown) {
      logger.error('Error fetching user:', error);
      return reply.code(500).send({
        message: 'Error fetching user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async createUser(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const parsed = createUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          message: 'Invalid user data',
          errors: parsed.error.errors
        });
      }

      const existingUser = await UserService.getUserByEmail(parsed.data.email);
      if (existingUser) {
        return reply.code(400).send({ message: 'User with this email already exists' });
      }

      // Ensure academicInfo has all required fields
      const userData: IUserBase = {
        ...parsed.data,
        academicInfo: {
          ...parsed.data.academicInfo,
          studyYear: parsed.data.academicInfo.studyYear || 1, // Default to first year if not provided
          isModular: parsed.data.academicInfo.isModular || false // Default to false if not provided
        }
      };

      const user = await UserService.createUser(userData);
      return reply.code(201).send(user);
    } catch (error: unknown) {
      logger.error('Error creating user:', error);
      return reply.code(500).send({
        message: 'Error creating user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async updateUser(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
          statusCode: 401
        });
      }

      // Check if user is admin or updating their own profile
      const isAdmin = request.user.role === 'admin';
      const isOwnProfile = request.user.userId === request.params.id;

      if (!isAdmin && !isOwnProfile) {
        return reply.code(403).send({
          message: 'Access denied',
          code: 'FORBIDDEN',
          statusCode: 403
        });
      }

      const parsed = updateUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          message: 'Invalid user data',
          errors: parsed.error.errors
        });
      }

      // If academicInfo is being updated, ensure it has all required fields
      const updateData = parsed.data;
      if (updateData.academicInfo) {
        updateData.academicInfo = {
          ...updateData.academicInfo,
          studyYear: updateData.academicInfo.studyYear || 1,
          isModular: updateData.academicInfo.isModular || false
        };
      }

      const user = await UserService.updateUser(request.params.id, updateData);
      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }
      return reply.code(200).send(user);
    } catch (error: unknown) {
      logger.error('Error updating user:', error);
      return reply.code(500).send({
        message: 'Error updating user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async deleteUser(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user || request.user.role !== 'admin') {
        return reply.code(403).send({
          message: 'Access denied. Admin privileges required.',
          code: 'FORBIDDEN',
          statusCode: 403
        });
      }

      const user = await UserService.deleteUser(request.params.id);
      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }
      return reply.code(200).send({ message: 'User deleted successfully' });
    } catch (error: unknown) {
      logger.error('Error deleting user:', error);
      return reply.code(500).send({
        message: 'Error deleting user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async updateUserRole(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user || request.user.role !== 'admin') {
        return reply.code(403).send({
          message: 'Access denied. Admin privileges required.',
          code: 'FORBIDDEN',
          statusCode: 403
        });
      }

      const userId = request.params.id;
      const updatedUser = await UserService.updateUser(userId, { role: 'Admin' });
      
      if (!updatedUser) {
        return reply.code(404).send({ message: 'User not found' });
      }

      return reply.code(200).send({ 
        message: 'User role updated successfully',
        user: {
          _id: updatedUser._id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role
        }
      });
    } catch (error) {
      logger.error('Update user role error:', error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  }
}
