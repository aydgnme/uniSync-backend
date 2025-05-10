import { FastifyRequest, FastifyReply } from 'fastify';
import ApiKey from '../models/api-key.model';
import { logger } from '../utils/logger';

// Rate limiting için basit bir cache
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 saat
const MAX_REQUESTS = 1000; // 1 saatte maksimum istek sayısı

export async function authApiKey(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Rate limiting kontrolü
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

    // API Key kontrolü
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || typeof apiKey !== 'string') {
      return reply.code(401).send({
        message: 'API key is required',
        code: 'API_KEY_REQUIRED'
      });
    }

    // API Key formatı kontrolü (UUID v4 formatı)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(apiKey)) {
      return reply.code(401).send({
        message: 'Invalid API key format',
        code: 'INVALID_API_KEY_FORMAT'
      });
    }

    // API Key doğrulama
    const key = await ApiKey.findOne({ 
      key: apiKey,
      isActive: true,
      expiresAt: { $gt: new Date() } // Süresi dolmamış
    });

    if (!key) {
      return reply.code(401).send({
        message: 'Invalid or expired API key',
        code: 'INVALID_API_KEY'
      });
    }

    // Kullanım limiti kontrolü
    if (key.usageLimit && key.usageCount >= key.usageLimit) {
      return reply.code(429).send({
        message: 'API key usage limit exceeded',
        code: 'API_KEY_LIMIT_EXCEEDED'
      });
    }

    // Kullanım sayısını artır
    await ApiKey.updateOne(
      { _id: key._id },
      { $inc: { usageCount: 1 } }
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
    
    // Güvenlik için genel hata mesajı
    return reply.code(500).send({
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
}