import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';

interface Faculty {
  name: string;
}

interface Specialization {
  name: string;
  short_name: string;
}

interface Group {
  name: string;
  subgroup: string;
  semester: number;
  study_year: number;
  specialization_id: string;
  is_modular: boolean;
  specializations: Specialization[];
}

interface Student {
  cnp: string;
  matriculation_number: string;
  advisor: string;
  is_modular: boolean;
  gpa: number;
  group_id: string;
  faculty_id: string;
  groups: Group;
  faculty?: Faculty;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone_number: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  created_at: string;
  updated_at: string;
  last_login: string;
  is_active: boolean;
  students: Student | null;
}

interface UpdateUserBody {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  academicInfo?: {
    study_year?: number;
    semester?: number;
    group_name?: string;
    subgroup?: string;
    advisor?: string;
    is_modular?: boolean;
    gpa?: number;
    faculty_id?: string;
    specialization_id?: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  students: {
    matriculation_number: string;
  }[];
}

interface UpdateProfileBody {
  fullName?: string;
  matriculationNumber?: string;
}

const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['student', 'staff', 'admin'], {
    errorMap: () => ({ message: 'Role must be one of: student, staff, admin' })
  }),
  phone_number: z.string()
    .regex(/^\+[0-9]{10,15}$/, 'Phone number must start with + and contain 10-15 digits')
    .optional(),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Gender must be one of: male, female, other' })
  }).optional(),
  date_of_birth: z.string()
    .regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Date of birth must be in format DD.MM.YYYY')
    .optional(),
  nationality: z.string().optional(),
  cnp: z.string()
    .regex(/^[0-9]{13}$/, 'CNP must be exactly 13 digits')
    .optional(),
  matriculation_number: z.string().optional(),
  academicInfo: z.object({
    faculty_id: z.string().uuid().optional().nullable(),
    group_id: z.string().uuid().optional().nullable(),
    is_modular: z.boolean().optional().default(false),
    gpa: z.number().optional().nullable()
  }).optional()
});


export const UserController = {
  async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user || request.user.role !== 'admin') {
        return reply.code(403).send({
          message: 'Access denied',
          code: 'FORBIDDEN',
          statusCode: 403
        });
      }

      const { data: users, error } = await supabase
        .from('users')
        .select('*, students(*)')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return reply.code(200).send({ users });
    } catch (error: unknown) {
      logger.error('Error fetching users:', error);
      return reply.code(500).send({
        message: 'Error fetching users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  async getUserById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      logger.info('getUserById called with params:', request.params);
      logger.info('User from request:', request.user);
  
      if (!request.user) {
        logger.warn('No user found in request');
        return reply.code(401).send({
          success: false,
          message: 'Unauthorized'
        });
      }
  
      const isAdmin = request.user.role.toLowerCase() === 'admin';
      const isOwnProfile = request.user.userId === request.params.id;
  
      logger.info('Auth check:', { isAdmin, isOwnProfile, userId: request.params.id });
  
      if (!isAdmin && !isOwnProfile) {
        logger.warn('Access denied - not admin and not own profile');
        return reply.code(403).send({
          success: false,
          message: 'Access denied'
        });
      }
  
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          email,
          role,
          phone_number,
          gender,
          date_of_birth,
          nationality,
          created_at,
          last_login,
          is_active,
          students (
            cnp,
            matriculation_number,
            advisor,
            is_modular,
            gpa,
            group_id,
            faculty_id,
            faculty:faculties (
              name
            ),
            groups (
              id,
              name,
              subgroup,
              semester,
              study_year,
              specialization_id,
              is_modular,
              specializations (
                name,
                short_name
              )
            )
          )
        `)
        .eq('id', request.params.id)
        .single();
  
      if (userError) {
        logger.error('Error fetching user:', userError);
        return reply.code(500).send({
          success: false,
          message: 'Error fetching user'
        });
      }
  
      if (!user) {
        logger.warn('User not found in database');
        return reply.code(404).send({
          success: false,
          message: 'User not found'
        });
      }
  
      // Handle array responses from Supabase
      const student = Array.isArray(user.students) ? user.students[0] : user.students;
      const group = Array.isArray(student?.groups) ? student.groups[0] : student?.groups;
      const facultyName = Array.isArray(student?.faculty) ? (student.faculty[0] as Faculty)?.name : (student?.faculty as Faculty)?.name;
      const specialization = Array.isArray(group?.specializations) ? group.specializations[0] : group?.specializations;

      logger.info('Debug group data:', {
        student,
        group,
        groupId: group?.id,
        groupName: group?.name
      });

      const response = {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          phone_number: user.phone_number || '',
          gender: user.gender || '',
          date_of_birth: user.date_of_birth || '',
          nationality: user.nationality || '',
          created_at: user.created_at,
          last_login: user.last_login,
          is_active: user.is_active,
          student_info: student
            ? {
                cnp: student.cnp || '',
                matriculation_number: student.matriculation_number || '',
                advisor: student.advisor || '',
                gpa: student.gpa || 0,
                faculty_id: student.faculty_id || '',
                faculty_name: facultyName || '[N/A]',
                group_id: group?.id || '',
                group_name: group?.name || '[N/A]',
                subgroup_index: group?.subgroup || '[N/A]',
                semester: group?.semester ?? null,
                study_year: group?.study_year ?? null,
                is_modular: group?.is_modular ?? student.is_modular ?? false,
                specialization_id: group?.specialization_id || null,
                specialization_short_name: specialization?.short_name ?? '[N/A]',
                specialization_name: specialization?.name ?? '[N/A]'
              }
            : null
        }
      };

      // Log the exact response being sent
      logger.info('Sending response:', JSON.stringify(response, null, 2));
      return reply.code(200).send(response);
    } catch (error: unknown) {
      logger.error('Error fetching user:', error);
      return reply.code(500).send({
        success: false,
        message: 'Error fetching user'
      });
    }
  },

  async updateUser(
    request: FastifyRequest<{
      Params: { id: string };
      Body: UpdateUserBody;
    }>,
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

      const { data: user, error: userError } = await supabase
        .from('users')
        .update({
          first_name: request.body.first_name,
          last_name: request.body.last_name,
          phone_number: request.body.phone_number,
          gender: request.body.gender,
          date_of_birth: request.body.date_of_birth,
          nationality: request.body.nationality
        })
        .eq('id', request.params.id)
        .select()
        .single();

      if (userError || !user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      // Update student info if provided
      if (request.body.academicInfo) {
        const { error: studentError } = await supabase
          .from('students')
          .update({
            study_year: request.body.academicInfo.study_year,
            semester: request.body.academicInfo.semester,
            group_name: request.body.academicInfo.group_name,
            subgroup: request.body.academicInfo.subgroup,
            advisor: request.body.academicInfo.advisor,
            is_modular: request.body.academicInfo.is_modular,
            gpa: request.body.academicInfo.gpa,
            faculty_id: request.body.academicInfo.faculty_id,
            specialization_id: request.body.academicInfo.specialization_id
          })
          .eq('user_id', request.params.id);

        if (studentError) {
          return reply.code(500).send({ message: 'Failed to update student information' });
        }
      }

      // Get updated user with student info
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*, students(*)')
        .eq('id', request.params.id)
        .single();

      if (fetchError || !updatedUser) {
        return reply.code(500).send({ message: 'Failed to fetch updated user' });
      }

      return reply.code(200).send(updatedUser);
    } catch (error: unknown) {
      logger.error('Error updating user:', error);
      return reply.code(500).send({
        message: 'Error updating user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  async deleteUser(
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

      // Delete student record first (due to foreign key constraint)
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('user_id', request.params.id);

      if (studentError) {
        return reply.code(500).send({ message: 'Failed to delete student record' });
      }

      // Delete user record
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', request.params.id);

      if (userError) {
        return reply.code(500).send({ message: 'Failed to delete user' });
      }

      return reply.code(200).send({ message: 'User deleted successfully' });
    } catch (error: unknown) {
      logger.error('Error deleting user:', error);
      return reply.code(500).send({
        message: 'Error deleting user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  async updateUserRole(
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

      const { data: user, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', request.params.id)
        .select()
        .single();

      if (error || !user) {
        return reply.code(404).send({ message: 'User not found' });
      }

      return reply.code(200).send({
        message: 'User role updated successfully',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      logger.error('Update user role error:', error);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  },

  async register(req: FastifyRequest, reply: FastifyReply) {
    try {
      logger.info('Register request received:', { body: req.body });

      const body = registerSchema.parse(req.body);
      logger.info('Request body validated successfully');

      // Check if user already exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('email', body.email)
        .maybeSingle();

      if (fetchError) {
        logger.error('Error checking existing user:', fetchError);
        throw fetchError;
      }

      if (existingUser) {
        logger.warn('Email already registered:', { email: body.email });
        return reply.status(409).send({
          message: 'Email already registered',
          code: 'EMAIL_EXISTS'
        });
      }

      // Hash password
      const password_hash = await bcrypt.hash(body.password, 10);
      logger.info('Password hashed successfully');

      // Format date of birth (from dd.mm.yyyy to yyyy-mm-dd)
      const formattedDob = body.date_of_birth
        ? new Date(body.date_of_birth.split('.').reverse().join('-'))
        : null;

      logger.info('Creating user record...');
      // Insert user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          first_name: body.first_name,
          last_name: body.last_name,
          email: body.email,
          password_hash,
          role: body.role,
          phone_number: body.phone_number,
          gender: body.gender,
          date_of_birth: formattedDob,
          nationality: body.nationality
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Error creating user:', insertError);
        throw insertError;
      }

      logger.info('User created successfully:', { userId: newUser.id });

      // If user is a student, create student record
      if (body.role === 'student' && newUser) {
        logger.info('Creating student record...', {
          userId: newUser.id,
          matriculationNumber: body.matriculation_number
        });

        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: newUser.id,
            matriculation_number: body.matriculation_number,
            cnp: body.cnp,
            faculty_id: body.academicInfo?.faculty_id || null,
            group_id: body.academicInfo?.group_id || null,
            is_modular: body.academicInfo?.is_modular ?? false,
            gpa: body.academicInfo?.gpa ?? null
          });

        if (studentError) {
          logger.error('Error creating student record:', studentError);
          // Rollback user creation if student creation fails
          await supabase.from('users').delete().eq('id', newUser.id);
          throw studentError;
        }

        logger.info('Student record created successfully');
      }

      return reply.status(201).send({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role
        }
      });
    } catch (err: any) {
      logger.error('Register error:', {
        error: err,
        message: err.message,
        code: err.code,
        details: err.details
      });

      if (err instanceof z.ZodError) {
        return reply.status(400).send({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: err.errors.map(error => ({
            path: error.path.join('.'),
            message: error.message
          }))
        });
      }

      if (err.code === '23505') { // Unique violation
        return reply.status(409).send({
          message: 'User already exists',
          code: 'USER_EXISTS'
        });
      }

      return reply.status(400).send({
        message: err.message || 'Invalid request',
        code: 'VALIDATION_ERROR',
        details: err.details || err
      });
    }
  },

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          message: 'Unauthorized'
        });
      }
  
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          first_name,
          last_name,
          phone_number,
          gender,
          date_of_birth,
          nationality,
          students (
            cnp,
            matriculation_number,
            advisor,
            is_modular,
            gpa,
            group_id,
            faculty_id,
            faculty:faculties ( name ),
            groups (
              id,
              name,
              subgroup,
              semester,
              study_year,
              specialization_id,
              is_modular,
              specializations (
                name,
                short_name
              )
            )
          )
        `)
        .eq('id', request.user.userId)
        .single();
  
      if (error) {
        logger.error('Error fetching user profile:', error);
        return reply.code(500).send({
          success: false,
          message: 'Error fetching user profile'
        });
      }
  
      if (!user) {
        return reply.code(404).send({
          success: false,
          message: 'User not found'
        });
      }
  
      const student = Array.isArray(user.students) ? user.students[0] : user.students;
      const group = Array.isArray(student?.groups) ? student.groups[0] : student?.groups;
      const facultyName = Array.isArray(student?.faculty) ? student.faculty[0]?.name : student?.faculty?.name;
      const specialization = Array.isArray(group?.specializations) ? group.specializations[0] : group?.specializations;
  
      const response = {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: `${user.first_name} ${user.last_name}`,
          phone: user.phone_number,
          gender: user.gender,
          dateOfBirth: user.date_of_birth,
          nationality: user.nationality,
          cnp: student?.cnp,
          matriculationNumber: student?.matriculation_number,
          academicInfo: {
            advisor: student?.advisor || null,
            facultyId: student?.faculty_id,
            facultyName: facultyName,
            gpa: student?.gpa || 0,
            groupName: group?.name,
            isModular: group?.is_modular ?? student?.is_modular ?? false,
            program: group?.name,
            semester: group?.semester || 1,
            specializationId: group?.specialization_id,
            specializationShortName: specialization?.short_name,
            studentId: user.id,
            studyYear: group?.study_year || 1,
            subgroupIndex: group?.subgroup
          }
        }
      };
  
      logger.info('Sending response:', JSON.stringify(response, null, 2));
      return reply.code(200).send(response);
    } catch (error: unknown) {
      logger.error('Error fetching user profile:', error);
      return reply.code(500).send({
        success: false,
        message: 'Error fetching user profile'
      });
    }
  },

  async updateProfile(request: FastifyRequest<{ Body: UpdateProfileBody }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
          statusCode: 401
        });
      }

      const { fullName, matriculationNumber } = request.body;

      // Update user name if provided
      if (fullName) {
        const [firstName, ...lastNameParts] = fullName.split(' ');
        const lastName = lastNameParts.join(' ');

        const { error: userError } = await supabase
          .from('users')
          .update({
            first_name: firstName,
            last_name: lastName
          })
          .eq('id', request.user.userId);

        if (userError) {
          logger.error('Error updating user name:', userError);
          return reply.code(500).send({
            message: 'Error updating user profile',
            code: 'DATABASE_ERROR',
            statusCode: 500
          });
        }
      }

      // Update matriculation number if provided
      if (matriculationNumber) {
        const { error: studentError } = await supabase
          .from('students')
          .update({
            matriculation_number: matriculationNumber
          })
          .eq('user_id', request.user.userId);

        if (studentError) {
          logger.error('Error updating matriculation number:', studentError);
          return reply.code(500).send({
            message: 'Error updating user profile',
            code: 'DATABASE_ERROR',
            statusCode: 500
          });
        }
      }

      // Get updated user data
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          role,
          first_name,
          last_name,
          created_at,
          updated_at,
          students (
            matriculation_number
          )
        `)
        .eq('id', request.user.userId)
        .single();

      if (fetchError || !user) {
        logger.error('Error fetching updated user:', fetchError);
        return reply.code(500).send({
          message: 'Error fetching updated user profile',
          code: 'DATABASE_ERROR',
          statusCode: 500
        });
      }

      const userProfile = user as UserProfile;
      const student = Array.isArray(userProfile.students) ? userProfile.students[0] : userProfile.students;

      return reply.code(200).send({
        success: true,
        data: {
          id: userProfile.id,
          email: userProfile.email,
          fullName: `${userProfile.first_name} ${userProfile.last_name}`,
          role: userProfile.role,
          matriculationNumber: student?.matriculation_number || '',
          createdAt: userProfile.created_at,
          updatedAt: userProfile.updated_at
        }
      });
    } catch (error: unknown) {
      logger.error('Error updating user profile:', error);
      return reply.code(500).send({
        message: 'Error updating user profile',
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'INTERNAL_SERVER_ERROR',
        statusCode: 500
      });
    }
  }
};
