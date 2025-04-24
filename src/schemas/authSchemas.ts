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
  phone: z.string().optional(),
  address: z.string().optional(),
  program: z.string().optional(),
  semester: z.coerce.number().optional(),
  groupName: z.string().optional(),
  subgroupIndex: z.string().optional(),
  advisor: z.string().optional(),
  gpa: z.coerce.number().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// ✅ Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// ✅ Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

// ✅ Reset password schema
export const resetPasswordSchema = z.object({
  cnp: z.string().length(13, 'CNP must be 13 digits'),
  matriculationNumber: z.string().min(5, 'Matriculation number is required'),
  newPassword: passwordValidation,
  confirmPassword: passwordValidation
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});
