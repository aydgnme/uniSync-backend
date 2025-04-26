import { FastifyRequest, FastifyReply } from 'fastify';
import ApiKey from '../models/api-key.model';
import { responseSender } from '../utils/response.sender'

async function authApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const apiKey = request.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    return responseSender.sendErrorResponse(reply, 401, 'Invalid API key');
  }

  const key = await ApiKey.findOne({ key: apiKey });

  if (!key) {
    return responseSender.sendErrorResponse(reply, 401, 'Invalid API key');
  }

  if (!key.isActive) {
    return responseSender.sendErrorResponse(reply, 401, 'Inactive API key');
  }
}

export default authApiKey;