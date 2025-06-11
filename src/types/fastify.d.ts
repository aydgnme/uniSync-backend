import 'fastify';
import { FastifyRequest } from 'fastify';
import { ApiKey } from '../models/api-key.model';
import '@fastify/jwt';

declare module 'fastify' {
  interface FastifyInstance {
    multipartHandler: (req: any, reply: any) => Promise<void>;
    authenticate: (request: FastifyRequest, reply: any) => Promise<void>;
  }

  interface FastifyRequest {
    user: {
      userId: string;
      email: string;
      role: 'student' | 'staff' | 'admin' | 'anon';
    };
    apiKey?: ApiKey;
  }
}
// Removed the declaration for '@fastify/type-provider-typebox' due to the error
// indicating it cannot be found or its type declarations are missing.

declare module 'pino-pretty' {
  export interface PrettyOptions {
    colorize?: boolean;
    levelFirst?: boolean;
    messageFormat?: string;
    errorLikeObjectKeys?: string[];
    errorProps?: string;
    translateTime?: string;
    ignore?: string;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
      role: 'student' | 'staff' | 'admin' | 'anon';
    };
    user: {
      userId: string;
      email: string;
      role: 'student' | 'staff' | 'admin' | 'anon';
    };
  }
}
