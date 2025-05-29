import { FastifyInstance } from 'fastify';
import { createAnnouncement, getAnnouncements, getAnnouncementById, getAnnouncementsByLecture } from '../controllers/announcement.controller';

export default async function announcementRoutes(fastify: FastifyInstance) {
  // POST /api/announcements
  fastify.post(
    '/',
    {
      schema: {
        tags: ['Announcements'],
        summary: 'Create announcement',
        description: 'Create a new announcement for a lecture',
        body: {
          type: 'object',
          required: ['lecture', 'author', 'content'],
          properties: {
            lecture: { type: 'string' },
            author: { type: 'string' },
            content: { type: 'string' },
            attachments: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              firebaseId: { type: 'string' },
              message: { type: 'string' }
            }
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
    },
    createAnnouncement
  );

  // Get all announcements
  fastify.get(
    '/',
    {
      schema: {
        tags: ['Announcements'],
        summary: 'Get all announcements',
        description: 'Retrieve all announcements',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firebaseId: { type: 'string' },
                message: { type: 'string' }
              }
            }
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
    },
    getAnnouncements
  );

  // Get announcement by ID
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['Announcements'],
        summary: 'Get announcement by ID',
        description: 'Retrieve a specific announcement by its ID',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              lecture: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  code: { type: 'string' }
                }
              },
              author: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  email: { type: 'string' }
                }
              },
              content: { type: 'string' },
              attachments: {
                type: 'array',
                items: { type: 'string' }
              },
              createdAt: { type: 'string', format: 'date-time' },
              firebaseData: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
    },
    getAnnouncementById
  );

  // Get announcements by lecture
  fastify.get(
    '/lecture/:lecture',
    {
      schema: {
        tags: ['Announcements'],
        summary: 'Get announcements by lecture',
        description: 'Retrieve all announcements for a specific lecture',
        params: {
          type: 'object',
          properties: {
            lecture: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firebaseId: { type: 'string' },
                message: { type: 'string' }
              }
            }
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
    },
    getAnnouncementsByLecture
  );
}