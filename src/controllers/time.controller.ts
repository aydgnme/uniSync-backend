import { FastifyRequest, FastifyReply } from 'fastify';
import { getAcademicWeekNumber, getParity } from '../utils/time.utils';

export const getAcademicCalendarInfo = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const weekNumber = getAcademicWeekNumber();
    const parity = getParity(weekNumber);

    return reply.code(200).send({
      success: true,
      data: {
        weekNumber,
        parity,
        currentDate: new Date().toISOString()
      }
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: 'Error getting academic calendar information',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 