import fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import formbody from '@fastify/formbody';
import courseGradeRoutes from './routes/course-grade.routes';

const app = fastify();

app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
  credentials: true
});

app.register(multipart, {
  limits: {
    fieldNameSize: 100, // Max field name size in bytes
    fieldSize: 100, // Max field value size in bytes
    fields: 10, // Max number of non-file fields
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1, // Max number of file fields
    headerPairs: 2000 // Max number of header key=>value pairs
  }
});

app.register(formbody);



export default app; 