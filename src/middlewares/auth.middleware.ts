import { FastifyRequest, FastifyReply } from 'fastify';

export async function verifyAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    if (!request.user) {
      return reply.code(401).send({
        message: 'Unauthorized',
        code: 'UNAUTHORIZED',
        statusCode: 401
      });
    }

    const user = request.user as any;
    if (user.role !== 'Admin') {
      return reply.code(403).send({
        message: 'Access denied. Admin privileges required.',
        code: 'FORBIDDEN',
        statusCode: 403
      });
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    return reply.code(500).send({
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      statusCode: 500
    });
  }
} 