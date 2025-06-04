import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export class ClassroomController {
  /**
   * Get all courses a student is enrolled in.
   * Accepts user_id OR matriculation_number as identifier.
   * 
   * GET /classroom/student/:id
   */
  async getStudentCourses(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const identifier = request.params.id;

      // 1. Find student by user_id or matriculation_number
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('user_id, matriculation_number')
        .or(`user_id.eq.${identifier},matriculation_number.eq.${identifier}`)
        .maybeSingle();

      if (studentError || !student) {
        logger.warn('Student not found:', studentError);
        return reply.status(404).send({ error: 'Student not found' });
      }

      // 2. Get enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses!enrollments_course_id_fkey (
            id,
            code,
            title,
            type,
            teacher_id,
            schedule: schedule (
              start_time,
              end_time,
              room
            ),
            teacher: staff (
              user: users (
                first_name,
                last_name
              )
            )
          )
        `)
        .eq('student_id', student.user_id);

      if (enrollError) {
        logger.error('Error fetching enrollments:', enrollError);
        return reply.status(500).send({ error: 'Failed to fetch courses' });
      }

      // 3. Format course list
      const courses = (enrollments || [])
        .map((e: any) => {
          const course = e.courses;
          if (!course) return null;

          const schedules = course.schedule || [];

          // Sort by earliest start time and get the first one
          const earliestSchedule = schedules.sort((a: any, b: any) =>
            a.start_time.localeCompare(b.start_time)
          )[0] || {};

          return {
            course_id: course.id,
            course_code: course.code,
            course_title: course.title,
            course_type: course.type,
            teacher_id: course.teacher_id,
            schedule_start_time: earliestSchedule.start_time || '',
            schedule_end_time: earliestSchedule.end_time || '',
            schedule_room: earliestSchedule.room || '',
            teacher_first_name: course.teacher?.user?.first_name || '',
            teacher_last_name: course.teacher?.user?.last_name || ''
          };
        })
        .filter(Boolean);

      return reply.send(courses);
    } catch (error) {
      logger.error('Unhandled error in getStudentCourses:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  getLectureStream() { }
  postLectureAnnouncement() { }
  getLectureClasswork() { }
  postLectureAssignment() { }
  addStudentToCourse() { }
  getAllCourses() { }
  getCourseDetails() { }
  getCourseSchedule() { }
}