import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { supabase } from '../lib/supabase';
import '@fastify/jwt';
import { config } from '../config';

// Extend FastifyRequest type
declare module 'fastify' {
  interface FastifyRequest {
    user: {
      userId: string;
      email: string;
      role: 'student' | 'staff' | 'admin' | 'anon';
    };
  }
}

// Simple cache for rate limiting
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Maximum number of requests in 15 minutes


export async function authJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      logger.warn('No authorization header found');
      request.user = {
        userId: '',
        email: '',
        role: 'anon'
      };
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      logger.warn('No token found in authorization header');
      request.user = {
        userId: '',
        email: '',
        role: 'anon'
      };
      return;
    }

    try {
      const decoded = await request.jwtVerify<{
        userId: string;
        email: string;
        role: 'student' | 'staff' | 'admin';
      }>();
      
      logger.info('JWT verification successful:', decoded);

      request.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };

      // Skip authentication for register endpoint
      if (request.url === '/api/users/register' && request.method === 'POST') {
        return;
      }

      // Rate limiting check
      const clientIP = request.ip;
      const now = Date.now();
      const clientRateLimit = rateLimit.get(clientIP);

      if (clientRateLimit) {
        if (now - clientRateLimit.timestamp > RATE_LIMIT_WINDOW) {
          // Reset if time window has passed
          rateLimit.set(clientIP, { count: 1, timestamp: now });
        } else if (clientRateLimit.count >= MAX_REQUESTS) {
          reply.code(429).send({
            message: 'Too many requests',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - clientRateLimit.timestamp)) / 1000)
          });
          return;
        } else {
          // Increment request count
          clientRateLimit.count++;
        }
      } else {
        // First request
        rateLimit.set(clientIP, { count: 1, timestamp: now });
      }

      // User check with Supabase
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*, students(*)')
        .eq('id', request.user.userId)
        .single();

      if (userError || !user) {
        logger.warn('User not found:', { userId: request.user.userId });
        reply.code(404).send({
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Security headers
      reply.header('X-Content-Type-Options', 'nosniff');
      reply.header('X-Frame-Options', 'DENY');
      reply.header('X-XSS-Protection', '1; mode=block');
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    } catch (jwtError) {
      logger.warn('JWT verification failed:', jwtError);
      request.user = {
        userId: '',
        email: '',
        role: 'anon'
      };
    }
  } catch (error) {
    logger.error('Error in JWT middleware:', error);
    request.user = {
      userId: '',
      email: '',
      role: 'anon'
    };
  }
}
