import { FastifyInstance } from 'fastify';
import { getAllProfessorsByFacultyId } from '../controllers/professor.controller';

export default async function professorRoutes(fastify: FastifyInstance) {
  // Get all faculty members by faculty ID
  fastify.get('/faculty/:facultyId', getAllProfessorsByFacultyId);
} 