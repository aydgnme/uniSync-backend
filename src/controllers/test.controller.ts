import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getFirestore } from 'firebase-admin/firestore';

export async function testRoutes(fastify: FastifyInstance) {
  // Test Firebase connection
  fastify.get('/test/firebase', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const db = getFirestore();
      
      // Test read
      const testDoc = await db.collection('test').doc('test').get();
      
      // Test write
      await db.collection('test').doc('test').set({
        timestamp: new Date(),
        message: 'Firebase connection test successful'
      });

      return reply.code(200).send({
        message: 'Firebase connection successful',
        testData: testDoc.data()
      });
    } catch (error) {
      console.error('Firebase test error:', error);
      return reply.code(500).send({
        message: 'Firebase connection failed',
        error: error.message
      });
    }
  });

  // List all collections
  fastify.get('/test/firebase/collections', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const db = getFirestore();
      const collections = await db.listCollections();
      const collectionNames = collections.map(col => col.id);

      return reply.code(200).send({
        collections: collectionNames
      });
    } catch (error) {
      console.error('Firebase collections error:', error);
      return reply.code(500).send({
        message: 'Failed to list collections',
        error: error.message
      });
    }
  });

  // Get all documents in a collection
  fastify.get('/test/firebase/collections/:collectionName', async (
    request: FastifyRequest<{ Params: { collectionName: string } }>,
    reply: FastifyReply
  ) => {
    try {
      const { collectionName } = request.params;
      const db = getFirestore();
      const snapshot = await db.collection(collectionName).get();
      
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return reply.code(200).send({
        collection: collectionName,
        documents: documents
      });
    } catch (error) {
      console.error('Firebase documents error:', error);
      return reply.code(500).send({
        message: 'Failed to get documents',
        error: error.message
      });
    }
  });
} 