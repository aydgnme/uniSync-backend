import { z } from 'zod';

const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const passwordValidation = z
  .string()
  .regex(passwordRegex, {
    message:
      'Password must be at least 8 characters long, contain at least one uppercase letter and one special character.'
  });

// ✅ Register schema
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

// ✅ Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// ✅ Step 1: CNP + Matriculation
export const generateResetCodeSchema = z.object({
  cnp: z.string().length(13, 'CNP must be 13 digits'),
  matriculationNumber: z.string().min(5, 'Matriculation number is required')
});

// ✅ Step 2: Email + ResetCode + New Password
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  resetCode: z.string(),
  newPassword: passwordValidation,
  confirmPassword: passwordValidation
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// ✅ User schemas
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
