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
        description: 'Create a new announcement',
        body: {
          type: 'object',
          required: ['title', 'content', 'type'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string', enum: ['Academic', 'Technical', 'General'] },
            date: { type: 'string', format: 'date' },
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
              title: { type: 'string' },
              content: { type: 'string' },
              type: { type: 'string' },
              date: { type: 'string' },
              attachments: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          },
          400: {
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
                title: { type: 'string' },
                content: { type: 'string' },
                type: { type: 'string' },
                date: { type: 'string' },
                attachments: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
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
              id: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' },
              type: { type: 'string' },
              date: { type: 'string' },
              attachments: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          },
          404: {
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

  // Get announcements by type
  fastify.get(
    '/type/:type',
    {
      schema: {
        tags: ['Announcements'],
        summary: 'Get announcements by type',
        description: 'Retrieve all announcements of a specific type',
        params: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['Academic', 'Technical', 'General'] }
          }
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                content: { type: 'string' },
                type: { type: 'string' },
                date: { type: 'string' },
                attachments: {
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    getAnnouncementsByLecture
  );
}