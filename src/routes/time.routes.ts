import { FastifyInstance } from 'fastify';
import { getAcademicCalendarInfo } from '../controllers/time.controller';

export default async function timeRoutes(fastify: FastifyInstance) {
  fastify.get('/academic-calendar', {
    schema: {
      tags: ['Time'],
      summary: 'Get academic calendar information',
      description: 'Returns current academic week number and parity',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                weekNumber: { type: 'number' },
                parity: { type: 'string', enum: ['ODD', 'EVEN'] },
                currentDate: { type: 'string', format: 'date-time' }
              }
            }
          }
        }
      }
    }
  }, getAcademicCalendarInfo);
} 