import { FastifyRequest, FastifyReply } from 'fastify';
import { CourseGrade, ICourseGradeDocument } from '../models/course-grade.model';
import { Lecture } from '../models/lecture.model';
import { User } from '../models/user.model';
import { logger } from '../utils/logger';

export class CourseGradeController {
  async createGrade(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { studentId, lectureId, academicYear, semester, ...grades } = req.body as any;

      const lecture = await Lecture.findById(lectureId);
      if (!lecture) {
        return reply.status(404).send({ error: 'Lecture not found' });
      }

      const totalGrade = this.calculateTotalGrade(grades, lecture.evaluationWeight);

      const grade = await CourseGrade.create({
        studentId,
        lectureId,
        academicYear,
        semester,
        ...grades,
        totalGrade,
        status: totalGrade >= 5 ? 'PASSED' : 'FAILED',
        lastUpdated: new Date()
      });

      return reply.status(201).send(grade);
    } catch (error) {
      logger.error('Error creating grade:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getGrade(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const grade = await CourseGrade.findById(id)
        .populate('lectureId', 'code title')
        .populate('studentId', 'fullName matriculationNumber');

      if (!grade) {
        return reply.status(404).send({ error: 'Grade not found' });
      }

      const gradeObj = grade.toObject();
      let lecture = undefined;
      const lectureData = gradeObj.lectureId as any;
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

      const response: any = {
        ...gradeObj,
        ...(lecture && { lecture })
      };
      if (lecture && 'lectureId' in response) {
        delete response.lectureId;
      }

      return reply.send(response);
    } catch (error) {
      logger.error('Error getting grade:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async updateGrade(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const updates = req.body as Partial<ICourseGradeDocument>;

      const grade = await CourseGrade.findById(id);
      if (!grade) {
        return reply.status(404).send({ error: 'Grade not found' });
      }

      const lecture = await Lecture.findById(grade.lectureId);
      if (!lecture) {
        return reply.status(404).send({ error: 'Lecture not found' });
      }

      const newGrades = { ...grade.toObject(), ...updates };
      const totalGrade = this.calculateTotalGrade(newGrades, lecture.evaluationWeight);

      const updatedGrade = await CourseGrade.findByIdAndUpdate(
        id,
        {
          ...updates,
          totalGrade,
          status: totalGrade >= 5 ? 'PASSED' : 'FAILED',
          lastUpdated: new Date()
        },
        { new: true }
      );

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
        studentId,
        academicYear,
        semester: semesterNum
      };

      // Populate lectureId with code and title
      const grades = await CourseGrade.find(query)
        .populate('lectureId', 'code title')
        .sort({ academicYear: -1, semester: -1 });

      if (!grades || grades.length === 0) {
        return reply.status(404).send({ 
          error: 'No grades found',
          message: `No grades found for student ${studentId} in ${academicYear} semester ${semesterNum}`
        });
      }

      // Map grades to include lecture.code and lecture.title, remove lectureId
      const mappedGrades = grades.map((grade) => {
        const gradeObj = grade.toObject ? grade.toObject() : grade;
        const lectureData = gradeObj.lectureId as any;
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
        const { lectureId, ...rest } = gradeObj;
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

      const query: any = { lectureId };
      if (academicYear) query.academicYear = academicYear;
      if (semester) query.semester = semester;

      // Populate studentId and lectureId
      const grades = await CourseGrade.find(query)
        .populate('studentId', 'fullName matriculationNumber')
        .populate('lectureId', 'code title')
        .sort({ totalGrade: -1 });

      // Map grades to include lecture.code and lecture.title, remove lectureId
      const mappedGrades = grades.map((grade) => {
        const gradeObj = grade.toObject ? grade.toObject() : grade;
        const lectureData = gradeObj.lectureId as any;
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
        const { lectureId, ...rest } = gradeObj;
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

  async requestReview(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = req.params as { id: string };
      const { reason } = req.body as { reason: string };

      const grade = await CourseGrade.findById(id);
      if (!grade) {
        return reply.status(404).send({ error: 'Grade not found' });
      }

      if (grade.retakeCount >= 3) {
        return reply.status(400).send({ error: 'Maximum review requests reached' });
      }

      grade.retakeCount += 1;
      grade.lastUpdated = new Date();
      await grade.save();

      // TODO: Notification system for professors

      return reply.send({ message: 'Review request submitted successfully' });
    } catch (error) {
      logger.error('Error requesting grade review:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getLectureStatistics(req: FastifyRequest, reply: FastifyReply) {
    try {
      const { lectureId } = req.params as { lectureId: string };
      const { academicYear, semester } = req.query as { academicYear?: string; semester?: number };

      const query: any = { lectureId };
      if (academicYear) query.academicYear = academicYear;
      if (semester) query.semester = semester;

      const grades = await CourseGrade.find(query);

      const statistics = {
        totalStudents: grades.length,
        passedStudents: grades.filter(g => g.status === 'PASSED').length,
        failedStudents: grades.filter(g => g.status === 'FAILED').length,
        averageGrade: grades.length > 0 ?
          Math.round((grades.reduce((acc, g) => acc + g.totalGrade, 0) / grades.length) * 100) / 100 : 0,
        gradeDistribution: {
          '9-10': grades.filter(g => g.totalGrade >= 9).length,
          '7-8': grades.filter(g => g.totalGrade >= 7 && g.totalGrade < 9).length,
          '5-6': grades.filter(g => g.totalGrade >= 5 && g.totalGrade < 7).length,
          '1-4': grades.filter(g => g.totalGrade < 5).length
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

      const student = await User.findById(studentId).lean();
      if (!student || student.role !== 'Student') {
        return reply.status(404).send({ error: 'Student not found' });
      }

      // Populate lectureId with code, title, credits
      const grades = await CourseGrade.find({ studentId })
        .populate('lectureId', 'code title credits')
        .lean();

      // Map: { [year]: { year, semesters: [{ semester, courses: [...] }] } }
      const yearsMap = new Map<string, { year: string, semesters: any[] }>();

      for (const grade of grades) {
        const yearKey = grade.academicYear;
        const semesterKey = grade.semester;
        const lectureData = grade.lectureId as any;
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
            grade: grade.totalGrade
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
        semesterObj.courses.push(lecture || { code: grade.lectureId, grade: grade.totalGrade });
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

      // Find all grades for the student, populate lecture info
      const grades = await CourseGrade.find({ studentId })
        .populate('lectureId', 'code title')
        .sort({ academicYear: -1, semester: -1 });

      if (!grades || grades.length === 0) {
        return reply.status(404).send({
          error: 'No grades found',
          message: `No grades found for student ${studentId}`
        });
      }

      // Map grades to include lecture.code and lecture.title, remove lectureId
      const mappedGrades = grades.map((grade) => {
        const gradeObj = grade.toObject ? grade.toObject() : grade;
        const lectureData = gradeObj.lectureId as any;
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
        const { lectureId, ...rest } = gradeObj;
        return {
          ...rest,
          ...(lecture && { lecture })
        };
      });

      return reply.send(mappedGrades);
    } catch (error) {
      logger.error('Error getting all student grades:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'An error occurred while fetching all student grades'
      });
    }
  }

  private calculateTotalGrade(grades: any, weights: any): number {
    let total = 0;
    let totalWeight = 0;

    for (const key of ['midterm', 'final', 'project', 'homework', 'attendance']) {
      const gradeKey = `${key}Grade`;
      if (grades[gradeKey] !== undefined && weights[key] !== undefined) {
        total += grades[gradeKey] * weights[key];
        totalWeight += weights[key];
      }
    }

    return totalWeight > 0 ? Math.round((total / totalWeight) * 10) / 10 : 0;
  }
}
