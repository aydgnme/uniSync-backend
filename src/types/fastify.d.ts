import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    multipartHandler: (req: any, reply: any) => Promise<void>;
  }
}
