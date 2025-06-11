import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';

interface Faculty {
  id: string;
  name: string;
}

interface Specialization {
  id: string;
  name: string;
  short_name: string;
}

interface Course {
  id: string;
  name: string;
  subgroup: string;
  semester: number;
  study_year: number;
  specialization_id: string;
  is_modular: boolean;
  specializations: Specialization[];
}

interface Group {
  id: string;
  name: string;
  subgroup: string;
  semester: number;
  study_year: number;
  specialization_id: string;
  is_modular: boolean;
  specializations: Specialization;
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
  faculty: Faculty;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone_number: string | null;
  gender: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  students: {
    cnp: string | null;
    matriculation_number: string | null;
    advisor: string | null;
    is_modular: boolean;
    gpa: number | null;
    group_id: string | null;
    faculty_id: string | null;
    faculty: {
      name: string;
    } | null;
    groups: {
      id: string;
      name: string;
      subgroup: string;
      semester: number;
      study_year: number;
      specialization_id: string;
      is_modular: boolean;
      specializations: {
        name: string;
        short_name: string;
      } | null;
    } | null;
  } | null;
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export const UserController = {
  async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return reply.send(data as User[]);
    } catch (error) {
      logger.error('Error fetching users:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  },

  async getUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const { data, error } = await supabase
        .from('users')
        .select('*, students(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Handle array responses from Supabase
      const student = Array.isArray(data.students) ? data.students[0] : data.students;
      const response = {
        ...data,
        students: student
      };

      return reply.send(response as User & { students: Student });
    } catch (error) {
      logger.error('Error fetching user:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  },

  async updateUser(request: FastifyRequest<{
    Params: { id: string };
    Body: UpdateUserBody;
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { first_name, last_name, phone_number, gender, date_of_birth, nationality } = request.body;

      const updateData: Partial<User> = {};
      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (phone_number) updateData.phone_number = phone_number;
      if (gender) updateData.gender = gender;
      if (date_of_birth) updateData.date_of_birth = date_of_birth;
      if (nationality) updateData.nationality = nationality;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return reply.send({
        message: 'User updated successfully',
        user: data as User
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  },

  async deleteUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return reply.send({ message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Error deleting user:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  },

  async getCourses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, specializations(*)')
        .order('name', { ascending: true });

      if (error) throw error;

      // Handle array responses from Supabase
      const courses = (data || []).map(course => {
        const specialization = Array.isArray(course.specializations) ? course.specializations[0] : course.specializations;
        return {
          ...course,
          name: course.name || '',
          specializations: specialization || { name: '', short_name: '' }
        };
      });

      return reply.send(courses as Course[]);
    } catch (error) {
      logger.error('Error fetching courses:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  },

  async getCourseById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const { data, error } = await supabase
        .from('courses')
        .select('*, specializations(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Handle array responses from Supabase
      const specialization = Array.isArray(data.specializations) ? data.specializations[0] : data.specializations;
      const course = {
        ...data,
        name: data.name || '',
        specializations: specialization || { name: '', short_name: '' }
      };

      return reply.send(course as Course);
    } catch (error) {
      logger.error('Error fetching course:', error);
      return reply.status(500).send({ error: 'Internal server error' });
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
        logger.warn('No user found in request');
        return reply.code(401).send({
          success: false,
          message: 'Unauthorized'
        });
      }

      logger.info('Fetching profile for user:', { userId: request.user.userId });

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
        logger.warn('User not found:', { userId: request.user.userId });
        return reply.code(404).send({
          success: false,
          message: 'User not found'
        });
      }

      // Fetch advisor information separately
      const student = Array.isArray(user.students) ? user.students[0] : user.students;
      let advisorName = null;

      if (student?.advisor) {
        const { data: advisor, error: advisorError } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', student.advisor)
          .single();

        if (!advisorError && advisor) {
          advisorName = `${advisor.first_name} ${advisor.last_name}`;
        }
      }

      const group = Array.isArray(student?.groups) ? student.groups[0] : student?.groups;
      const faculty = Array.isArray(student?.faculty) ? student.faculty[0] : student?.faculty;
      const facultyName = faculty?.name;
      const specialization = Array.isArray(group?.specializations) ? group.specializations[0] : group?.specializations;
      const groupName = group?.name;
      const specializationName = specialization?.name;

      logger.info('Successfully fetched user profile:', { userId: user.id });

      const response = {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: `${user.first_name} ${user.last_name}`,
          phone: user.phone_number || '',
          gender: user.gender || '',
          dateOfBirth: user.date_of_birth || '',
          nationality: user.nationality || '',
          cnp: student?.cnp || '',
          matriculationNumber: student?.matriculation_number || '',
          academicInfo: {
            advisor: advisorName,
            facultyId: student?.faculty_id || null,
            facultyName: facultyName || null,
            gpa: student?.gpa || 0,
            groupName: groupName || null,
            isModular: group?.is_modular ?? student?.is_modular ?? false,
            program: groupName || null,
            semester: group?.semester || null,
            specializationId: group?.specialization_id || null,
            specializationShortName: specializationName || null,
            studentId: user.id,
            studyYear: group?.study_year || null,
            subgroupIndex: group?.subgroup || null
          }
        }
      };

      return reply.code(200).send(response);
    } catch (error) {
      logger.error('Error in getProfile:', error);
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
  },

  async getStudentsByFacultyId(
    request: FastifyRequest<{ Params: { facultyId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { facultyId } = request.params;

      if (!facultyId) {
        return reply.code(400).send({
          success: false,
          message: 'Faculty ID is required'
        });
      }

      const { data: students, error } = await supabase
        .from('users')
        .select(`
          id,
          first_name,
          last_name,
          email,
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
        .eq('role', 'student')
        .eq('students.faculty_id', facultyId);

      if (error) {
        logger.error('Error fetching students:', error);
        return reply.code(500).send({
          success: false,
          message: 'An error occurred while fetching students'
        });
      }

      const formattedStudents = students.map(user => {
        const student = Array.isArray(user.students) ? user.students[0] : user.students;
        const group = Array.isArray(student?.groups) ? student.groups[0] : student?.groups;
        const faculty = Array.isArray(student?.faculty) ? student.faculty[0] : student?.faculty;
        const facultyName = faculty?.name;
        const specialization = Array.isArray(group?.specializations) ? group.specializations[0] : group?.specializations;
        const groupName = group?.name;
        const specializationName = specialization?.name;

        return {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phoneNumber: user.phone_number,
          gender: user.gender,
          dateOfBirth: user.date_of_birth,
          nationality: user.nationality,
          cnp: student?.cnp,
          matriculationNumber: student?.matriculation_number,
          isModular: group?.is_modular ?? student?.is_modular ?? false,
          gpa: student?.gpa || 0,
          groupId: group?.id,
          facultyId: student?.faculty_id,
          advisorName: student?.advisor,
          isActive: user.is_active,
          academicInfo: {
            groupName: groupName,
            subgroupIndex: group?.subgroup,
            semester: group?.semester,
            studyYear: group?.study_year,
            specializationId: group?.specialization_id,
            specializationName: specializationName,
            specializationShortName: specialization?.short_name,
            facultyName: facultyName
          }
        };
      });

      return reply.code(200).send({
        success: true,
        data: formattedStudents
      });

    } catch (error) {
      logger.error('Error fetching students:', error);
      return reply.code(500).send({
        success: false,
        message: 'An error occurred while fetching students'
      });
    }
  },

  async getMyStudentInfo(request: FastifyRequest, reply: FastifyReply) {
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
          first_name,
          last_name,
          email,
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
        .eq('id', request.user.userId)
        .single();

      if (error) {
        logger.error('Error fetching student info:', error);
        return reply.code(500).send({
          success: false,
          message: 'An error occurred while fetching student information'
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
      const faculty = Array.isArray(student?.faculty) ? student.faculty[0] : student?.faculty;
      const facultyName = faculty?.name;
      const specialization = Array.isArray(group?.specializations) ? group.specializations[0] : group?.specializations;
      const groupName = group?.name;
      const specializationName = specialization?.name;

      const response = {
        success: true,
        data: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          phoneNumber: user.phone_number,
          gender: user.gender,
          dateOfBirth: user.date_of_birth,
          nationality: user.nationality,
          cnp: student?.cnp,
          matriculationNumber: student?.matriculation_number,
          isModular: group?.is_modular ?? student?.is_modular ?? false,
          gpa: student?.gpa || 0,
          groupId: group?.id,
          facultyId: student?.faculty_id,
          advisorName: student?.advisor,
          isActive: user.is_active,
          academicInfo: {
            groupName: groupName,
            subgroupIndex: group?.subgroup,
            semester: group?.semester,
            studyYear: group?.study_year,
            specializationId: group?.specialization_id,
            specializationName: specializationName,
            specializationShortName: specialization?.short_name,
            facultyName: facultyName
          }
        }
      };

      return reply.code(200).send(response);

    } catch (error) {
      logger.error('Error fetching student info:', error);
      return reply.code(500).send({
        success: false,
        message: 'An error occurred while fetching student information'
      });
    }
  },

  async changePassword(request: FastifyRequest<{ Body: z.infer<typeof changePasswordSchema> }>, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED'
        });
      }

      const body = changePasswordSchema.parse(request.body);
      logger.info('Change password request:', { userId: request.user.userId });

      // Get user from database
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', request.user.userId)
        .single();

      if (userError || !user) {
        logger.warn('User not found:', { userId: request.user.userId });
        return reply.code(404).send({
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(body.currentPassword, user.password_hash);
      if (!isValidPassword) {
        logger.warn('Invalid current password:', { userId: request.user.userId });
        return reply.code(401).send({
          message: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        });
      }

      // Hash new password
      const password_hash = await bcrypt.hash(body.newPassword, 10);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash })
        .eq('id', request.user.userId);

      if (updateError) {
        logger.error('Error updating password:', updateError);
        return reply.code(500).send({
          message: 'Failed to update password',
          code: 'UPDATE_FAILED'
        });
      }

      logger.info('Password changed successfully:', { userId: request.user.userId });

      return reply.code(200).send({
        message: 'Password changed successfully',
        success: true
      });
    } catch (error) {
      logger.error('Change password error:', error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }
      return reply.code(500).send({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  },

  async getSessions(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({
          message: 'Unauthorized',
          code: 'UNAUTHORIZED'
        });
      }

      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', request.user.userId)
        .order('login_time', { ascending: false });

      if (error) {
        throw error;
      }

      return reply.code(200).send({
        sessions
      });
    } catch (error) {
      logger.error('Error fetching sessions:', error);
      return reply.code(500).send({
        message: 'Error fetching sessions',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  },

  async logoutAllSessions(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      }

      const { error } = await supabase
        .from('user_sessions')
        .update({ logout_time: new Date().toISOString() })
        .eq('user_id', request.user.userId)
        .is('logout_time', null);

      if (error) {
        return reply.code(500).send({ message: 'Failed to logout all sessions', code: 'LOGOUT_FAILED' });
      }

      return reply.code(200).send({ message: 'All sessions logged out successfully', success: true });
    } catch (err) {
      return reply.code(500).send({ message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
  },

  async logoutCurrentSession(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        return reply.code(401).send({ message: 'Unauthorized', code: 'UNAUTHORIZED' });
      }

      // Session ID'yi header'dan alıyoruz (ör: x-session-id)
      const sessionId = request.headers['x-session-id'] as string;
      if (!sessionId) {
        return reply.code(400).send({ message: 'Session ID is required in x-session-id header', code: 'SESSION_ID_REQUIRED' });
      }

      // Sadece kendi oturumunu sonlandırabilsin
      const { data: session, error: sessionError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', request.user.userId)
        .single();

      if (sessionError || !session) {
        return reply.code(404).send({ message: 'Session not found', code: 'SESSION_NOT_FOUND' });
      }

      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({ logout_time: new Date().toISOString() })
        .eq('id', sessionId);

      if (updateError) {
        return reply.code(500).send({ message: 'Failed to logout session', code: 'LOGOUT_FAILED' });
      }

      return reply.code(200).send({ message: 'Session logged out successfully', success: true });
    } catch (err) {
      return reply.code(500).send({ message: 'Internal server error', code: 'INTERNAL_SERVER_ERROR' });
    }
  }
};
