import { z } from 'zod';

// Password rules: min 8 characters, at least 1 uppercase letter and 1 special character
const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const passwordValidation = z
  .string()
  .regex(passwordRegex, {
    message:
      'Password must be at least 8 characters long, contain at least one uppercase letter and one special character.'
  });

// Academic info sub-schema
const academicInfoSchema = z.object({
  faculty_id: z.string().uuid(),
  specialization_id: z.string().uuid(),
  study_year: z.number().min(1).max(4),
  semester: z.number().min(1).max(2),
  group_name: z.string(),
  subgroup: z.union([z.enum(['A', 'B', 'C']), z.literal('')]).optional(),
  advisor: z.string(),
  gpa: z.number().min(0).max(10).optional(),
  is_modular: z.boolean().default(false)
});

// Register schema
export const registerSchema = z.object({
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
    .regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Date of birth must be in DD.MM.YYYY format')
    .optional(),
  nationality: z.string().optional(),
  cnp: z.string()
    .regex(/^[0-9]{13}$/, 'CNP must be exactly 13 digits')
    .optional(),
  matriculation_number: z.string().optional(),
  academicInfo: z.object({
    faculty_id: z.string().uuid().optional().nullable(),
    group_name: z.string().optional().nullable(),
    is_modular: z.boolean().optional().default(false),
    gpa: z.number().optional().nullable()
  }).optional()
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Reset code generation schema
export const generateResetCodeSchema = z.object({
  cnp: z.string().regex(/^[0-9]{13}$/, 'CNP must be exactly 13 digits'),
  matriculationNumber: z.string().min(1, 'Matriculation number is required')
});

// Reset code verification
export const verifyResetCodeSchema = z.object({
  cnp: z.string().regex(/^[0-9]{13}$/, 'CNP must be exactly 13 digits'),
  matriculationNumber: z.string().min(1, 'Matriculation number is required'),
  reset_code: z.string().length(6, 'Reset code must be 6 characters')
});

// Password reset schema
export const resetPasswordSchema = z.object({
  cnp: z.string().regex(/^[0-9]{13}$/, 'CNP must be 13 digits'),
  matriculationNumber: z.string().min(1, 'Matriculation number is required'),
  code: z.string().regex(/^[0-9]{6}$/, 'Reset code must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// User check schema (e.g., for validation on frontend)
export const checkUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  matriculation_number: z.string().min(1, 'Matriculation number is required')
});

// Find user by CNP & matriculation
export const findUserSchema = z.object({
  cnp: z.string().regex(/^[0-9]{13}$/, 'CNP must be exactly 13 digits'),
  matriculationNumber: z.string().min(1, 'Matriculation number is required')
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

// OpenAPI definitions
export const authSchemas = {
  AuthResponse: {
    type: 'object',
    required: ['token', 'user'],
    properties: {
      token: { type: 'string' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          role: { type: 'string', enum: ['student', 'staff', 'admin'] }
        }
      }
    }
  },
  RegisterRequest: {
    type: 'object',
    required: [
      'email',
      'password',
      'first_name',
      'last_name',
      'cnp',
      'matriculation_number',
      'gender',
      'date_of_birth',
      'nationality',
      'academicInfo'
    ],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      first_name: { type: 'string', minLength: 1 },
      last_name: { type: 'string', minLength: 1 },
      cnp: { type: 'string', minLength: 13, maxLength: 13 },
      matriculation_number: { type: 'string', minLength: 5 },
      phone_number: { type: 'string' },
      gender: { type: 'string', enum: ['male', 'female', 'other'] },
      date_of_birth: { type: 'string', description: 'Date in format dd.MM.yyyy' },
      nationality: { type: 'string' },
      academicInfo: {
        type: 'object',
        required: ['faculty_id', 'specialization_id', 'study_year', 'semester', 'group_name', 'advisor'],
        properties: {
          faculty_id: { type: 'string', format: 'uuid' },
          specialization_id: { type: 'string', format: 'uuid' },
          study_year: { type: 'number', minimum: 1, maximum: 4 },
          semester: { type: 'number', minimum: 1, maximum: 2 },
          group_name: { type: 'string' },
          subgroup: { type: 'string', enum: ['A', 'B', 'C'], nullable: true },
          advisor: { type: 'string' },
          gpa: { type: 'number', minimum: 0, maximum: 10 },
          is_modular: { type: 'boolean' }
        }
      }
    }
  }
};