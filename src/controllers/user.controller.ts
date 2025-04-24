import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service';
import { IUser, IUserBase } from '../models/user.model';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  cnp: z.string().length(13),
  matriculationNumber: z.string(),
  name: z.string(),
  role: z.enum(['Student', 'Teacher', 'Admin']),
  phone: z.string(),
  address: z.string(),
  academicInfo: z.object({
    program: z.string(),
    semester: z.number(),
    groupName: z.string(),
    subgroupIndex: z.string(),
    studentId: z.string(),
    advisor: z.string(),
    gpa: z.number()
  })
});

const updateUserSchema = createUserSchema.partial();

export async function userRoutes(fastify: FastifyInstance) {
  // Get all users
  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await UserService.getAllUsers();
      return reply.code(200).send(users);
    } catch (error: unknown) {
      console.error('Error fetching users:', error);
      return reply.code(500).send({ 
        message: 'Error fetching users', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get user by ID
  fastify.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await UserService.getUserById(request.params.id);
      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }
      return reply.code(200).send(user);
    } catch (error: unknown) {
      console.error('Error fetching user:', error);
      return reply.code(500).send({ 
        message: 'Error fetching user', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Create user
  fastify.post('/', async (request: FastifyRequest<{ Body: IUserBase }>, reply: FastifyReply) => {
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

      const user = await UserService.createUser(parsed.data);
      return reply.code(201).send(user);
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      return reply.code(500).send({ 
        message: 'Error creating user', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Update user
  fastify.put('/:id', async (request: FastifyRequest<{ Params: { id: string }, Body: Partial<IUserBase> }>, reply: FastifyReply) => {
    try {
      const parsed = updateUserSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ 
          message: 'Invalid user data',
          errors: parsed.error.errors 
        });
      }

      const user = await UserService.updateUser(request.params.id, parsed.data);
      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }
      return reply.code(200).send(user);
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      return reply.code(500).send({ 
        message: 'Error updating user', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Delete user
  fastify.delete('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await UserService.deleteUser(request.params.id);
      if (!user) {
        return reply.code(404).send({ message: 'User not found' });
      }
      return reply.code(200).send({ message: 'User deleted successfully' });
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      return reply.code(500).send({ 
        message: 'Error deleting user', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
} 