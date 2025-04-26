import { FastifyReply } from 'fastify';

export const responseSender = {
  sendErrorResponse: (reply: FastifyReply, statusCode: number, message: string) => {
    return reply.status(statusCode).send({
      success: false,
      message
    });
  },
  sendSuccessResponse: (reply: FastifyReply, data: any) => {
    return reply.status(200).send({
      success: true,
      data
    });
  }
};
