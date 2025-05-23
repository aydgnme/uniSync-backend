import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/user.model';
import { config } from '../config/index';
import { logger } from '../utils/index';
import { Types } from 'mongoose';

// JWT payload type definition
interface JWTPayload {
  tokenType: string;
  user: {
    userId: string;
    email: string;
    role: string;
    matriculationNumber: string;
  };
  iat?: number;
  exp?: number;
}

// Simple cache for rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Maximum number of requests in 15 minutes

export const verifyJWT = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const payload = await request.jwtVerify<JWTPayload>();
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    if (payload.tokenType !== config.tokenTypes.access) {
      throw new Error('Invalid token type');
    }

    // Check if token has expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token has expired');
    }

    request.user = payload.user;
  } catch (error) {
    logger.error('JWT verification failed', error);
    return reply.status(401).send({ 
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Invalid token'
    });
  }
};

export async function authJWT(
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
        // Reset if time window has passed
        rateLimit.set(clientIP, { count: 1, timestamp: now });
      } else if (clientRateLimit.count >= MAX_REQUESTS) {
        return reply.code(429).send({
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - clientRateLimit.timestamp)) / 1000)
        });
      } else {
        // Increment request count
        clientRateLimit.count++;
      }
    } else {
      // First request
      rateLimit.set(clientIP, { count: 1, timestamp: now });
    }

    // Token check
    const authHeader = request.headers.authorization || request.headers['x-auth-token'];
    if (!authHeader || typeof authHeader !== 'string') {
      logger.warn('No auth header found in request');
      return reply.code(401).send({
        message: 'Authentication token is required',
        code: 'AUTH_TOKEN_REQUIRED'
      });
    }

    // Check Bearer token format
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    if (!token) {
      logger.warn('Invalid token format');
      return reply.code(401).send({
        message: 'Invalid token format. Use: Bearer <token>',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    try {
      // JWT verification
      const decoded = await request.jwtVerify<JWTPayload>();
      logger.info('JWT decoded successfully:', { 
        userId: decoded.user.userId,
        email: decoded.user.email,
        role: decoded.user.role
      });
      
      // Token type check
      if (decoded.tokenType !== config.tokenTypes.access) {
        logger.warn('Invalid token type:', decoded.tokenType);
        return reply.code(403).send({
          message: 'Invalid token type',
          code: 'INVALID_TOKEN_TYPE'
        });
      }

      // Check if token has expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        logger.warn('Token expired:', { exp: decoded.exp, now: Math.floor(Date.now() / 1000) });
        return reply.code(401).send({
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      // User check
      let userId;
      try {
        userId = new Types.ObjectId(decoded.user.userId);
      } catch (error) {
        logger.error('Invalid user ID format:', error);
        return reply.code(400).send({
          message: 'Invalid user ID format',
          code: 'INVALID_USER_ID'
        });
      }

      const user = await User.findOne({ _id: userId });
      
      if (!user) {
        logger.warn('User not found:', { userId: decoded.user.userId });
        return reply.code(404).send({
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Add user info to request
      request.user = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        matriculationNumber: user.matriculationNumber
      };

      logger.info('User authenticated successfully:', {
        userId: request.user.userId,
        email: request.user.email,
        role: request.user.role
      });

      // Security headers
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      reply.header('X-XSS-Protection', '1; mode=block');
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    } catch (error) {
      logger.error('JWT Authentication error:', error);
      
      // More detailed error message
      if (error instanceof Error) {
        return reply.code(401).send({
          message: `Authentication failed: ${error.message}`,
          code: 'AUTH_FAILED'
        });
      }
      
      return reply.code(401).send({
        message: 'Authentication failed',
        code: 'AUTH_FAILED'
      });
    }
  } catch (error) {
    logger.error('JWT Authentication error:', error);
    
    return reply.code(401).send({
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
}
