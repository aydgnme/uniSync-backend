import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.model';
import { config } from '../config';
import { logger } from '../utils/logger';

// Rate limiting için basit bir cache
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 dakika
const MAX_REQUESTS = 100; // 15 dakikada maksimum istek sayısı

export async function authJWT(
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
        // Süre dolmuşsa sıfırla
        rateLimit.set(clientIP, { count: 1, timestamp: now });
      } else if (clientRateLimit.count >= MAX_REQUESTS) {
        return reply.code(429).send({
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - clientRateLimit.timestamp)) / 1000)
        });
      } else {
        // İstek sayısını artır
        clientRateLimit.count++;
      }
    } else {
      // İlk istek
      rateLimit.set(clientIP, { count: 1, timestamp: now });
    }

    // Token kontrolü
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        message: 'Invalid authorization header format',
        code: 'INVALID_AUTH_HEADER'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return reply.code(401).send({
        message: 'Authentication token is required',
        code: 'AUTH_TOKEN_REQUIRED'
      });
    }

    // JWT doğrulama
    const decoded = await request.jwtVerify();
    
    // Token tipi kontrolü
    if (decoded.tokenType !== config.tokenTypes.access) {
      return reply.code(403).send({
        message: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Kullanıcı kontrolü
    const user = await User.findOne({ 
      userId: decoded.user.userId,
      isActive: true // Aktif kullanıcı kontrolü
    });
    
    if (!user) {
      return reply.code(404).send({
        message: 'User not found or inactive',
        code: 'USER_NOT_FOUND'
      });
    }

    // Kullanıcı bilgilerini request'e ekle
    request.user = {
      userId: user.userId,
      email: user.email,
      role: user.role
    };

    // Security headers
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  } catch (error) {
    logger.error('JWT Authentication error:', error);
    
    // Güvenlik için genel hata mesajı
    return reply.code(401).send({
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
}
