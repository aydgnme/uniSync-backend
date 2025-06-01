import { FastifyInstance } from 'fastify';
import { messageController } from '../controllers/message.controller';

export default async function messageRoutes(fastify: FastifyInstance) {
  // Get all messages
  fastify.get('/', {
    schema: {
      tags: ['Messages'],
      summary: 'Get all messages',
      description: 'Retrieve all messages',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              sender: { type: 'string' },
              subject: { type: 'string' },
              message: { type: 'string' },
              time: { type: 'string' },
              unread: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  }, messageController.getAllMessages);

  // Get a single message
  fastify.get('/:id', {
    schema: {
      tags: ['Messages'],
      summary: 'Get a message',
      description: 'Retrieve a single message by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sender: { type: 'string' },
            subject: { type: 'string' },
            message: { type: 'string' },
            time: { type: 'string' },
            unread: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        404: { $ref: 'Error' }
      }
    }
  }, messageController.getMessage);

  // Create a new message
  fastify.post('/', {
    schema: {
      tags: ['Messages'],
      summary: 'Create a message',
      description: 'Create a new message',
      body: {
        type: 'object',
        required: ['sender', 'subject', 'message', 'time'],
        properties: {
          sender: { type: 'string' },
          subject: { type: 'string' },
          message: { type: 'string' },
          time: { type: 'string' },
          unread: { type: 'boolean' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sender: { type: 'string' },
            subject: { type: 'string' },
            message: { type: 'string' },
            time: { type: 'string' },
            unread: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, messageController.createMessage);

  // Update message read status
  fastify.patch('/:id/read', {
    schema: {
      tags: ['Messages'],
      summary: 'Mark message as read',
      description: 'Update message read status',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            sender: { type: 'string' },
            subject: { type: 'string' },
            message: { type: 'string' },
            time: { type: 'string' },
            unread: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        404: { $ref: 'Error' }
      }
    }
  }, messageController.updateMessageStatus);

  // Delete a message
  fastify.delete('/:id', {
    schema: {
      tags: ['Messages'],
      summary: 'Delete a message',
      description: 'Delete a message by ID',
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        },
        404: { $ref: 'Error' }
      }
    }
  }, messageController.deleteMessage);
} 