import { z } from 'zod';

// Base types
export const UserRole = z.enum(['student', 'staff', 'admin']);
export const Gender = z.enum(['male', 'female', 'other']);
export const AddressType = z.enum(['permanent', 'temporary', 'correspondence']);
export const CourseType = z.enum(['LECTURE', 'SEMINAR', 'LAB']);
export const WeekDay = z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
export const Parity = z.enum(['ODD', 'EVEN', 'ALL']);
export const Subgroup = z.enum(['A', 'B', 'C']);
export const DocumentRequestType = z.enum(['transcript', 'adeverinta']);
export const DocumentRequestStatus = z.enum(['pending', 'approved', 'denied', 'completed']);
export const ExamType = z.enum(['midterm', 'final', 'project', 'homework']);

// Type inference for base types
export type UserRole = z.infer<typeof UserRole>;
export type Gender = z.infer<typeof Gender>;
export type AddressType = z.infer<typeof AddressType>;
export type CourseType = z.infer<typeof CourseType>;
export type WeekDay = z.infer<typeof WeekDay>;
export type Parity = z.infer<typeof Parity>;
export type Subgroup = z.infer<typeof Subgroup>;
export type DocumentRequestType = z.infer<typeof DocumentRequestType>;
export type DocumentRequestStatus = z.infer<typeof DocumentRequestStatus>;
export type ExamType = z.infer<typeof ExamType>;

// Database table types
export const StudentInfo = z.object({
  group_id: z.string().uuid(),
  matriculation_number: z.string()
});

export const User = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: UserRole,
  student_info: StudentInfo.optional()
});

export const Address = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: AddressType.default('permanent'),
  country: z.string(),
  county: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  street_address: z.string().optional(),
  created_at: z.date()
});

export const Faculty = z.object({
  id: z.string().uuid(),
  name: z.string(),
  short_name: z.string()
});

export const Department = z.object({
  id: z.string().uuid(),
  name: z.string(),
  short_name: z.string().optional(),
  faculty_id: z.string().uuid()
});

export const Specialization = z.object({
  id: z.string().uuid(),
  faculty_id: z.string().uuid(),
  name: z.string(),
  short_name: z.string()
});

export const Staff = z.object({
  user_id: z.string().uuid(),
  title: z.string().optional(),
  faculty_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional()
});

export const Grade = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  course_id: z.string().uuid(),
  exam_type: ExamType,
  score: z.number().optional(),
  letter_grade: z.string().optional(),
  graded_at: z.date(),
  created_by: z.string().uuid()
});

export const Student = z.object({
  user_id: z.string().uuid(),
  cnp: z.string().length(13),
  matriculation_number: z.string(),
  study_year: z.number().min(1).max(4),
  semester: z.number().min(1).max(2),
  group_name: z.string(),
  subgroup: Subgroup.optional(),
  advisor: z.string().optional(),
  is_modular: z.boolean().default(false),
  gpa: z.number().min(0).max(10).optional(),
  faculty_id: z.string().uuid(),
  specialization_id: z.string().uuid(),
  grades: z.array(Grade).optional()
});

export const Course = z.object({
  id: z.string().uuid(),
  code: z.string(),
  title: z.string(),
  type: CourseType.optional(),
  faculty: z.string(),
  academic_year: z.string().optional(),
  teacher_id: z.string().uuid().optional()
});

export const Assignment = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  due_date: z.date().optional(),
  is_unlimited: z.boolean().default(false)
});

export const Submission = z.object({
  assignment_id: z.string().uuid(),
  student_id: z.string().uuid(),
  file_url: z.string(),
  submitted_at: z.date(),
  grade: z.number().optional(),
  feedback: z.string().optional()
});

export const Schedule = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  week_day: WeekDay,
  start_time: z.string(),
  end_time: z.string(),
  room: z.string().optional(),
  parity: Parity.default('ALL'),
  group_id: z.string().uuid(),
  weeks: z.array(z.number()),
  courses: Course
});

export const DocumentRequest = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  type: DocumentRequestType,
  status: DocumentRequestStatus.default('pending'),
  requested_at: z.date(),
  processed_by: z.string().uuid().optional(),
  resolved_at: z.date().optional()
});

export const Notification = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  message: z.string(),
  read: z.boolean().default(false),
  created_at: z.date()
});

export const UserSession = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  login_time: z.date(),
  logout_time: z.date().optional(),
  ip_address: z.string().optional(),
  device_info: z.string().optional()
});

export const PasswordResetRequest = z.object({
  id: z.string().uuid(),
  cnp: z.string(),
  matriculation_number: z.string(),
  reset_code: z.string().length(6),
  expires_at: z.date(),
  used_at: z.date().optional(),
  created_at: z.date()
});

// Type inference for all database types
export type StudentInfo = z.infer<typeof StudentInfo>;
export type User = z.infer<typeof User>;
export type Address = z.infer<typeof Address>;
export type Faculty = z.infer<typeof Faculty>;
export type Department = z.infer<typeof Department>;
export type Specialization = z.infer<typeof Specialization>;
export type Staff = z.infer<typeof Staff>;
export type Grade = z.infer<typeof Grade>;
export type Student = z.infer<typeof Student>;
export type Course = z.infer<typeof Course>;
export type Assignment = z.infer<typeof Assignment>;
export type Submission = z.infer<typeof Submission>;
export type Schedule = z.infer<typeof Schedule>;
export type DocumentRequest = z.infer<typeof DocumentRequest>;
export type Notification = z.infer<typeof Notification>;
export type UserSession = z.infer<typeof UserSession>;
export type PasswordResetRequest = z.infer<typeof PasswordResetRequest>;