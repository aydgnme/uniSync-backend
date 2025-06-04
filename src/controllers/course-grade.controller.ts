import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';

interface Grade {
  id: string;
  student_id: string;
  course_id: string;
  exam_type: 'midterm' | 'final' | 'project' | 'homework';
  score: number;
  letter_grade: string;
  graded_at: string;
  created_by: string;
  last_updated: string;
  lectures?: {
    code: string;
    title: string;
    credits: number;
    teacher_id: string;
    teacher_name: string;
  };
  total_grade?: number;
  status?: 'PASSED' | 'FAILED';
  retake_count?: number;
  academic_year?: string;
  semester?: number;
}

export interface Course {
  code: string;
  title: string;
  credits: number;
  teacherId: string;
  teacherName: string;
}

export interface SummarizedGrade {
  student_id: string;
  course_code: string;
  course_title: string;
  credits: number;
  academic_year: string;
  semester: number | string;
  midterm_score?: number;
  final_score?: number;
  project_score?: number;
  homework_score?: number;
  midterm_weight?: string;
  final_weight?: string;
  project_weight?: string;
  homework_weight?: string;
  teacher_names: string;
}

export class CourseGradeController {

  async createGrade(req: FastifyRequest<{
    Body: {
      student_id: string;
      course_id: string;
      exam_type: 'midterm' | 'final' | 'project' | 'homework';
      score: number;
      letter_grade: string;
      graded_at: string;
      created_by: string;
    }
  }>, reply: FastifyReply) {
    try {
      const gradeData = req.body;

      // Validate student exists
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('id')
        .eq('id', gradeData.student_id)
        .eq('role', 'student')
        .single();

      if (studentError || !student) {
        return reply.status(404).send({ error: 'Student not found' });
      }

      // Validate course exists
      const { data: course, error: courseError } = await supabase
        .from('lectures')
        .select('id')
        .eq('id', gradeData.course_id)
        .single();

      if (courseError || !course) {
        return reply.status(404).send({ error: 'Course not found' });
      }

      // Create the grade
      const { data: grade, error: gradeError } = await supabase
        .from('grades')
        .insert({
          student_id: gradeData.student_id,
          course_id: gradeData.course_id,
          exam_type: gradeData.exam_type,
          score: gradeData.score,
          letter_grade: gradeData.letter_grade,
          graded_at: gradeData.graded_at,
          created_by: gradeData.created_by,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();

      if (gradeError) {
        logger.error('Error creating grade:', gradeError);
        return reply.status(500).send({ error: 'Internal server error' });
      }

      return reply.status(201).send(grade);
    } catch (error) {
      logger.error('Error creating grade:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getGrade(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };

      const { data: grade, error: gradeError } = await supabase
        .from('grades')
        .select(`
          *,
          lectures:course_id (code, title),
          students:student_id (full_name, matriculation_number)
        `)
        .eq('id', id)
        .single();

      if (gradeError || !grade) {
        return reply.status(404).send({ error: 'Grade not found' });
      }

      const response = {
        ...grade,
        lecture: {
          code: grade.lectures.code,
          title: grade.lectures.title
        }
      };

      delete response.lectures;
      delete response.students;

      return reply.send(response);
    } catch (error) {
      logger.error('Error getting grade:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async updateGrade(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const updates = req.body as Partial<Grade>;

      const { data: grade, error: gradeError } = await supabase
        .from('grades')
        .select('*')
        .eq('id', id)
        .single();

      if (gradeError || !grade) {
        return reply.status(404).send({ error: 'Grade not found' });
      }

      const { data: lecture, error: lectureError } = await supabase
        .from('lectures')
        .select('evaluation_weight')
        .eq('id', grade.course_id)
        .single();

      if (lectureError || !lecture) {
        return reply.status(404).send({ error: 'Lecture not found' });
      }

      const totalGrade = this.calculateTotalGrade({ ...grade, ...updates }, lecture.evaluation_weight);

      const { data: updatedGrade, error: updateError } = await supabase
        .from('grades')
        .update({
          ...updates,
          total_grade: totalGrade,
          status: totalGrade >= 5 ? 'PASSED' : 'FAILED',
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        logger.error('Error updating grade:', updateError);
        return reply.status(500).send({ error: 'Internal server error' });
      }

      return reply.send(updatedGrade);
    } catch (error) {
      logger.error('Error updating grade:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getStudentGrades(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { studentId } = req.params as { studentId: string };
      const { academicYear, semester } = req.query as { academicYear: string; semester: string };

      // Validate required parameters
      if (!academicYear || !semester) {
        return reply.status(400).send({
          error: 'Missing required parameters',
          message: 'academicYear and semester are required'
        });
      }

      // Validate academic year format
      if (!/^\d{4}-\d{4}$/.test(academicYear)) {
        return reply.status(400).send({
          error: 'Invalid academic year format',
          message: 'Academic year must be in YYYY-YYYY format'
        });
      }

      // Validate semester
      const semesterNum = parseInt(semester);
      if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 2) {
        return reply.status(400).send({
          error: 'Invalid semester',
          message: 'Semester must be 1 or 2'
        });
      }

      const query = {
        student_id: studentId,
        academic_year: academicYear,
        semester: semesterNum
      };

      // Populate lectureId with code and title
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          lectures:course_id (code, title)
        `)
        .match(query);

      if (gradesError) {
        logger.error('Error getting student grades:', gradesError);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'An error occurred while fetching student grades'
        });
      }

      if (!grades || grades.length === 0) {
        return reply.status(404).send({
          error: 'No grades found',
          message: `No grades found for student ${studentId} in ${academicYear} semester ${semesterNum}`
        });
      }

      // Map grades to include lecture.code and lecture.title, remove lectureId
      const mappedGrades = grades.map((grade) => {
        const gradeObj = grade as Grade;
        const lectureData = gradeObj.lectures as any;
        let lecture = undefined;
        if (
          lectureData &&
          typeof lectureData === 'object' &&
          'code' in lectureData &&
          'title' in lectureData
        ) {
          lecture = {
            code: lectureData.code,
            title: lectureData.title
          };
        }
        // Remove only lectureId, keep all other fields
        const { course_id, ...rest } = gradeObj;
        return {
          ...rest,
          ...(lecture && { lecture })
        };
      });

      return reply.send(mappedGrades);
    } catch (error) {
      logger.error('Error getting student grades:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'An error occurred while fetching student grades'
      });
    }
  }

  async getLectureGrades(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { lectureId } = req.params as { lectureId: string };
      const { academicYear, semester } = req.query as { academicYear?: string; semester?: number };

      const query: any = { course_id: lectureId };
      if (academicYear) query.academic_year = academicYear;
      if (semester) query.semester = semester;

      // Populate studentId and lectureId
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          students:student_id (full_name, matriculation_number)
        `)
        .match(query)
        .order('total_grade', { ascending: false });

      if (gradesError) {
        logger.error('Error getting lecture grades:', gradesError);
        return reply.status(500).send({ error: 'Internal server error' });
      }

      if (!grades || grades.length === 0) {
        return reply.status(404).send({ error: 'No grades found' });
      }

      // Map grades to include lecture.code and lecture.title, remove lectureId
      const mappedGrades = grades.map((grade) => {
        const gradeObj = grade as Grade;
        const lectureData = gradeObj.lectures as any;
        let lecture = undefined;
        if (
          lectureData &&
          typeof lectureData === 'object' &&
          'code' in lectureData &&
          'title' in lectureData
        ) {
          lecture = {
            code: lectureData.code,
            title: lectureData.title
          };
        }
        // Remove only lectureId, keep all other fields
        const { course_id, ...rest } = gradeObj;
        return {
          ...rest,
          ...(lecture && { lecture })
        };
      });

      return reply.send(mappedGrades);
    } catch (error) {
      logger.error('Error getting lecture grades:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getLectureStatistics(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { lectureId } = req.params as { lectureId: string };
      const { academicYear, semester } = req.query as { academicYear?: string; semester?: number };

      const query: any = { course_id: lectureId };
      if (academicYear) query.academic_year = academicYear;
      if (semester) query.semester = semester;

      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .match(query);

      if (gradesError) {
        logger.error('Error getting lecture statistics:', gradesError);
        return reply.status(500).send({ error: 'Internal server error' });
      }

      const statistics = {
        totalStudents: grades.length,
        passedStudents: grades.filter(g => g.status === 'PASSED').length,
        failedStudents: grades.filter(g => g.status === 'FAILED').length,
        averageGrade: grades.length > 0 ?
          Math.round((grades.reduce((acc, g) => acc + g.total_grade, 0) / grades.length) * 100) / 100 : 0,
        gradeDistribution: {
          '9-10': grades.filter(g => g.total_grade >= 9).length,
          '7-8': grades.filter(g => g.total_grade >= 7 && g.total_grade < 9).length,
          '5-6': grades.filter(g => g.total_grade >= 5 && g.total_grade < 7).length,
          '1-4': grades.filter(g => g.total_grade < 5).length
        }
      };

      return reply.send(statistics);
    } catch (error) {
      logger.error('Error getting lecture statistics:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getStructuredGrades(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { studentId } = req.params as { studentId: string };

      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('id')
        .eq('id', studentId)
        .eq('role', 'student')
        .single();

      if (studentError || !student) {
        return reply.status(404).send({ error: 'Student not found' });
      }

      // Populate lectureId with code, title, credits
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          *,
          lectures:course_id (code, title, credits)
        `)
        .eq('student_id', studentId);

      if (gradesError) {
        logger.error('Error generating structured grades:', gradesError);
        return reply.status(500).send({ error: 'Internal server error' });
      }

      if (!grades || grades.length === 0) {
        return reply.status(404).send({ error: 'No grades found' });
      }

      // Map: { [year]: { year, semesters: [{ semester, courses: [...] }] } }
      const yearsMap = new Map<string, { year: string, semesters: any[] }>();

      for (const grade of grades) {
        const yearKey = grade.academic_year;
        const semesterKey = grade.semester;
        const lectureData = grade.lectures as any;
        let lecture = undefined;
        if (
          lectureData &&
          typeof lectureData === 'object' &&
          'code' in lectureData &&
          'title' in lectureData
        ) {
          lecture = {
            code: lectureData.code,
            title: lectureData.title,
            grade: grade.total_grade
          };
        }
        if (!yearsMap.has(yearKey)) {
          yearsMap.set(yearKey, {
            year: yearKey,
            semesters: []
          });
        }
        const yearObj = yearsMap.get(yearKey)!;
        let semesterObj = yearObj.semesters.find((s: any) => s.semester === semesterKey);
        if (!semesterObj) {
          semesterObj = { semester: semesterKey, courses: [] };
          yearObj.semesters.push(semesterObj);
        }
        semesterObj.courses.push(lecture || { code: grade.course_id, grade: grade.total_grade });
      }

      return reply.send({
        academicYears: Array.from(yearsMap.values())
      });
    } catch (error) {
      logger.error('Error generating structured grades:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  // Get all grades for a student (all years and semesters)
 async getAllStudentGrades(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { studentId } = req.params as { studentId: string };

    const { data, error } = await supabase
      .from('view_student_course_grades')
      .select('*')
      .eq('student_id', studentId);

    if (error) {
      logger.error('Error getting student grades:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }

    if (!data || data.length === 0) {
      return reply.status(404).send({
        success: false,
        message: `No grades found for student ${studentId}`
      });
    }

    const grades = data.flatMap((item) => {
      const {
        student_id,
        course_code,
        course_title,
        credits,
        academic_year,
        semester,
        teacher_names,
        midterm_score,
        final_score,
        project_score,
        homework_score,
        midterm_weight,
        final_weight,
        project_weight,
        homework_weight
      } = item;

      const examTypes = [
        { type: 'midterm', score: midterm_score, weight: midterm_weight },
        { type: 'final', score: final_score, weight: final_weight },
        { type: 'project', score: project_score, weight: project_weight },
        { type: 'homework', score: homework_score, weight: homework_weight }
      ];

      return examTypes
        .filter(e => e.score !== null)
        .map(e => ({
          studentId: student_id,
          course: {
            code: course_code,
            title: course_title,
            credits
          },
          academicYear: academic_year,
          semester: Number(semester),
          examType: e.type,
          score: e.score,
          weight: parseFloat(e.weight ?? '0'),
          teacherNames: teacher_names
        }));
    });

    return reply.send({
      success: true,
      data: grades
    });

  } catch (err) {
    logger.error('Unhandled error in getAllStudentGrades:', err);
    return reply.status(500).send({
      success: false,
      message: 'Unexpected server error'
    });
  }
}

  async getMyGrades(req: FastifyRequest, reply: FastifyReply) {
    try {
      if (!req.user) {
        return reply.status(401).send({
          success: false,
          message: 'Unauthorized'
        });
      }

      const { data: grades, error: gradesError } = await supabase
        .from('view_student_grades_with_course_info')
        .select(`
          id,
          student_id,
          course_id,
          exam_type,
          score,
          letter_grade,
          graded_at,
          created_by,
          academic_year,
          semester,
          credits,
          title,
          code,
          teacher_id,
          teacher_name
        `)
        .eq('student_id', req.user.userId)
        .order('graded_at', { ascending: false });

      if (gradesError) {
        logger.error('Error getting user grades:', gradesError);
        return reply.status(500).send({
          success: false,
          message: 'Failed to fetch grades from database.'
        });
      }

      if (!grades || grades.length === 0) {
        return reply.status(404).send({
          success: false,
          message: 'No grades found for the authenticated user.'
        });
      }

      const formattedGrades = grades.map((grade: any) => ({
        id: grade.id,
        studentId: grade.student_id,
        courseId: grade.course_id,
        examType: grade.exam_type,
        score: grade.score,
        letterGrade: grade.letter_grade,
        gradedAt: grade.graded_at,
        createdBy: grade.created_by,
        academicYear: grade.academic_year,
        semester: isNaN(parseInt(grade.semester)) ? grade.semester : parseInt(grade.semester),
        course: {
          code: grade.code ?? '',
          title: grade.title ?? '',
          credits: grade.credits ?? 0,
          teacherId: grade.teacher_id ?? '',
          teacherName: grade.teacher_name ?? ''
        }
      }));

      return reply
        .header('Content-Type', 'application/json')
        .send(JSON.stringify({
          success: true,
          data: formattedGrades
        }, (_key, value) => value === undefined ? null : value));

    } catch (error) {
      logger.error('Unhandled error in getMyGrades:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error.'
      });
    }
  }

  async getSummarizedGrades(req: FastifyRequest, reply: FastifyReply) {
    try {
      if (!req.user) {
        return reply.status(401).send({ success: false, message: 'Unauthorized' });
      }

      logger.info('Fetching summarized grades for user:', req.user.userId);

      const { data, error } = await supabase
        .from('view_student_course_grades')
        .select(`
          *
        `)
        .eq('student_id', req.user.userId)
        .order('academic_year', { ascending: false })
        .order('semester', { ascending: false });

      if (error) {
        logger.error('Error fetching summarized grades:', error);
        return reply.status(500).send({ success: false, message: 'Database error' });
      }

      if (!data || data.length === 0) {
        return reply.status(404).send({ 
          success: false, 
          message: 'No grades found for the authenticated user.' 
        });
      }

      // Provide the entire query output without calculation
      const processedData = data.map(course => ({
        ...course
      }));

      return reply.send({
        success: true,
        data: processedData
      });

    } catch (err) {
      logger.error('Unhandled error in getSummarizedGrades:', err);
      return reply.status(500).send({ success: false, message: 'Internal server error' });
    }
  }

  private calculateTotalGrade(grades: any, weights: any): number {
    let total = 0;
    let totalWeight = 0;

    for (const key of ['midterm', 'final', 'project', 'homework', 'attendance']) {
      const gradeKey = `${key}_grade`;
      if (grades[gradeKey] !== undefined && weights[key] !== undefined) {
        total += grades[gradeKey] * weights[key];
        totalWeight += weights[key];
      }
    }

    return totalWeight > 0 ? Math.round((total / totalWeight) * 10) / 10 : 0;
  }
}
