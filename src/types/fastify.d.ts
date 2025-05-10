import 'fastify';
import { FastifyRequest } from 'fastify';
import { ApiKey } from '../models/api-key.model';

declare module 'fastify' {
  interface FastifyInstance {
    multipartHandler: (req: any, reply: any) => Promise<void>;
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

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
    apiKey?: ApiKey;
  }
}
