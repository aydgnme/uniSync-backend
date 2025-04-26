import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

const globalRateLimiter = async (app: FastifyInstance) => {
  await app.register(rateLimit, {
    max: 100, // Mobil IP karmaşası düşünülerek artırıldı
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many requests. Please try again later.'
    })
  });
};

const strictRateLimiter = async (instance: FastifyInstance) => {
  await instance.register(rateLimit, {
    max: 5,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Too many requests. Please try again later.'
    })
  });
};

export { globalRateLimiter, strictRateLimiter };
