import { z } from 'zod';

const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const passwordValidation = z
  .string()
  .regex(passwordRegex, {
    message:
      'Password must be at least 8 characters long, contain at least one uppercase letter and one special character.'
  });

// Zod schemas for validation
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordValidation,
  confirmPassword: passwordValidation,
  cnp: z.string().length(13, 'CNP must be 13 digits'),
  matriculationNumber: z.string().min(5, 'Matriculation number is required'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string(),
  address: z.string(),
  program: z.string(),
  semester: z.coerce.number(),
  groupName: z.string(),
  subgroupIndex: z.string(),
  advisor: z.string(),
  gpa: z.coerce.number()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const generateResetCodeSchema = z.object({
  cnp: z.string().length(13, 'CNP must be 13 digits'),
  matriculationNumber: z.string().min(5, 'Matriculation number is required')
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  resetCode: z.string(),
  newPassword: passwordValidation,
  confirmPassword: passwordValidation
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export const createUserSchema = z.object({
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

export const updateUserSchema = createUserSchema.partial();

export const checkUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  matriculationNumber: z.string().min(1, 'Matriculation number is required')
});

export const findUserSchema = z.object({
  cnp: z.string().min(1, 'CNP is required'),
  matriculationNumber: z.string().min(1, 'Matriculation number is required')
});

// OpenAPI schemas for documentation
export const authSchemas = {
  AuthResponse: {
    type: 'object',
    required: ['token', 'user'],
    properties: {
      token: { type: 'string' },
      user: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['Student', 'Teacher', 'Admin'] }
        }
      }
    }
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 }
    }
  },
  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'confirmPassword', 'cnp', 'matriculationNumber', 'name'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      confirmPassword: { type: 'string', minLength: 8 },
      cnp: { type: 'string', minLength: 13, maxLength: 13 },
      matriculationNumber: { type: 'string', minLength: 5 },
      name: { type: 'string', minLength: 1 },
      phone: { type: 'string' },
      address: { type: 'string' },
      program: { type: 'string' },
      semester: { type: 'number' },
      groupName: { type: 'string' },
      subgroupIndex: { type: 'string' },
      advisor: { type: 'string' },
      gpa: { type: 'number' }
    }
  },
  ResetPasswordRequest: {
    type: 'object',
    required: ['email', 'resetCode', 'newPassword', 'confirmPassword'],
    properties: {
      email: { type: 'string', format: 'email' },
      resetCode: { type: 'string' },
      newPassword: { type: 'string', minLength: 8 },
      confirmPassword: { type: 'string', minLength: 8 }
    }
  }
};
