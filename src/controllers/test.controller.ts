import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../database/firebase';

export const testFirebaseConnection = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const testDoc = await db.collection('test').doc('test').get();

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
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const listFirebaseCollections = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);

    return reply.code(200).send({ collections: collectionNames });
  } catch (error) {
    console.error('Firebase collections error:', error);
    return reply.code(500).send({
      message: 'Failed to list collections',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getCollectionDocuments = async (
  request: FastifyRequest<{ Params: { collectionName: string } }>,
  reply: FastifyReply
) => {
  try {
    const { collectionName } = request.params;
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
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
