import { FastifyRequest, FastifyReply } from 'fastify';
import ApiKey from '../models/api-key.model';
import { logger } from '../utils/logger';

// Simple cache for rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS = 1000; // Maximum requests per hour

export const verifyApiKey = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || Array.isArray(apiKey)) {
      throw new Error('API key is required');
    }

    const key = await ApiKey.findOne({ key: apiKey, isActive: true });
    if (!key) {
      throw new Error('Invalid API key');
    }

    request.apiKey = key;
  } catch (error) {
    logger.error('API key verification failed', error);
    return reply.status(401).send({ error: 'Unauthorized' });
  }
};

export async function authApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Rate limiting check
    const clientIP = request.ip;
    const now = Date.now();
    const clientRateLimit = rateLimit.get(clientIP);

    if (clientRateLimit) {
      if (now - clientRateLimit.timestamp > RATE_LIMIT_WINDOW) {
        rateLimit.set(clientIP, { count: 1, timestamp: now });
      } else if (clientRateLimit.count >= MAX_REQUESTS) {
        return reply.code(429).send({
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - clientRateLimit.timestamp)) / 1000)
        });
      } else {
        clientRateLimit.count++;
      }
    } else {
      rateLimit.set(clientIP, { count: 1, timestamp: now });
    }

    // API Key check
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || typeof apiKey !== 'string') {
      return reply.code(401).send({
        message: 'API key is required',
        code: 'API_KEY_REQUIRED'
      });
    }

    // API Key format check (UUID v4 format)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(apiKey)) {
      return reply.code(401).send({
        message: 'Invalid API key format',
        code: 'INVALID_API_KEY_FORMAT'
      });
    }

    // API Key validation
    const key = await ApiKey.findOne({ 
      key: apiKey,
      isActive: true,
      expiresAt: new Date() // Not expired
    });

    if (!key) {
      return reply.code(401).send({
        message: 'Invalid or expired API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Usage limit check
    if (key.usageLimit && key.usageCount >= key.usageLimit) {
      return reply.code(429).send({
        message: 'API key usage limit exceeded',
        code: 'API_KEY_LIMIT_EXCEEDED'
      });
    }

    // Increment usage count
    await ApiKey.updateOne(
      { _id: key.id },
      { usageCount: key.usageCount + 1 }
    );

    // API key bilgisini request'e ekle
    request.apiKey = key;

    // Security headers
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  } catch (error) {
    logger.error('API Key Authentication error:', error);
    
    // Generic error message for security
    return reply.code(500).send({
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}