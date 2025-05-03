import { FastifyInstance } from 'fastify';
import { getStudentGrades, updateGrade, createGrade } from '../controllers/course-grade.controller';

export default async function courseGradeRoutes(fastify: FastifyInstance) {
  fastify.get('/student/:studentId', getStudentGrades);
  fastify.post('/', createGrade);
  fastify.put('/:id', updateGrade);
} 