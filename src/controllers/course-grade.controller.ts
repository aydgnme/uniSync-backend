import { FastifyRequest, FastifyReply } from 'fastify';
import { CourseGrade } from '../models/course-grade.model';

export const getStudentGrades = async (
  request: FastifyRequest<{ 
    Params: { studentId: string }, 
    Querystring: { academicYear?: string, semester?: number } 
  }>,
  reply: FastifyReply
) => {
  try {
    const { studentId } = request.params;
    const { academicYear, semester } = request.query;

    const query: any = { studentId };
    if (academicYear) query.academicYear = academicYear;
    if (semester) query.semester = semester;

    const grades = await CourseGrade.find(query);
    return reply.send({
      success: true,
      data: grades
    });
  } catch (error) {
    return reply.status(500).send({ 
      success: false,
      message: 'Error fetching grades', 
      error 
    });
  }
};

export const updateGrade = async (
  request: FastifyRequest<{ 
    Params: { id: string },
    Body: { midtermGrade: number, finalGrade: number }
  }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const { midtermGrade, finalGrade } = request.body;

    // Validate grade range
    if (midtermGrade < 1 || midtermGrade > 10 || finalGrade < 1 || finalGrade > 10) {
      return reply.status(400).send({ 
        success: false,
        message: 'Grades must be between 1-10' 
      });
    }

    const grade = await CourseGrade.findById(id);
    if (!grade) {
      return reply.status(404).send({ 
        success: false,
        message: 'Grade not found'
      });
    }

    grade.midtermGrade = midtermGrade;
    grade.finalGrade = finalGrade;
    grade.totalGrade = +(midtermGrade * 0.4 + finalGrade * 0.6).toFixed(2);
    grade.status = grade.totalGrade >= 5 ? 'Passed' : 'Failed';

    await grade.save();
    return reply.send({
      success: true,
      data: grade
    });
  } catch (error) {
    return reply.status(500).send({ 
      success: false,
      message: 'Error updating grade', 
      error 
    });
  }
};

export const createGrade = async (
  request: FastifyRequest<{
    Body: {
      code: string;
      title: string;
      instructor: string;
      semester: number;
      academicYear: string;
      credits: number;
      midtermGrade: number;
      finalGrade: number;
      studentId: string;
    }
  }>,
  reply: FastifyReply
) => {
  try {
    const { midtermGrade, finalGrade, ...rest } = request.body;

    // Validate grade range
    if (midtermGrade < 1 || midtermGrade > 10 || finalGrade < 1 || finalGrade > 10) {
      return reply.status(400).send({ 
        success: false,
        message: 'Grades must be between 1-10' 
      });
    }

    const totalGrade = +(midtermGrade * 0.4 + finalGrade * 0.6).toFixed(2);
    const status = totalGrade >= 5 ? 'Passed' : 'Failed';

    const grade = new CourseGrade({
      ...rest,
      midtermGrade,
      finalGrade,
      totalGrade,
      status
    });

    await grade.save();
    return reply.status(201).send({
      success: true,
      data: grade
    });
  } catch (error) {
    return reply.status(500).send({ 
      success: false,
      message: 'Error creating grade', 
      error 
    });
  }
}; 