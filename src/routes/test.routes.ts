import { FastifyInstance } from 'fastify';
import {
  testFirebaseConnection,
  listFirebaseCollections,
  getCollectionDocuments
} from '../controllers/test.controller';

export async function testRoutes(fastify: FastifyInstance) {
  fastify.get('/firebase/connection', testFirebaseConnection);
  fastify.get('/firebase/collections', listFirebaseCollections);
  fastify.get('/firebase/collections/:collectionName', getCollectionDocuments);
}
