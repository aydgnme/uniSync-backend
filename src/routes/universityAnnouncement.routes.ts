import { FastifyInstance } from 'fastify';
import { UniversityAnnouncementController } from '../controllers/universityAnnouncement.controller';
import { authJWT } from '../middlewares/auth.jwt.middleware';

const universityAnnouncementRoutes = async (fastify: FastifyInstance) => {
  const controller = new UniversityAnnouncementController();

  // Global authentication hook
  fastify.addHook('onRequest', authJWT);

  // Get all announcements
  fastify.get('/university/announcements', {
    schema: {
      tags: ['University Announcements'],
      summary: 'Get all university announcements',
      description: 'Retrieves a list of all university announcements',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' },
              category: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              published_by: { type: 'string' }
            }
          }
        }
      }
    }
  }, controller.getAllAnnouncements);

  // Create new announcement
  fastify.post('/university/announcements', {
    schema: {
      tags: ['University Announcements'],
      summary: 'Create a new university announcement',
      description: 'Creates a new university announcement with the provided details',
      body: {
        type: 'object',
        required: ['title', 'content', 'category'],
        properties: {
          title: { type: 'string', description: 'Title of the announcement' },
          content: { type: 'string', description: 'Content of the announcement' },
          category: { type: 'string', description: 'Category of the announcement' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            published_by: { type: 'string' }
          }
        }
      }
    }
  }, controller.createAnnouncement);

  // Get announcement by ID
  fastify.get('/university/announcements/:id', {
    schema: {
      tags: ['University Announcements'],
      summary: 'Get a university announcement by ID',
      description: 'Retrieves a specific university announcement by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID of the announcement' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            published_by: { type: 'string' }
          }
        }
      }
    }
  }, controller.getAnnouncementById);

  // Update announcement
  fastify.put('/university/announcements/:id', {
    schema: {
      tags: ['University Announcements'],
      summary: 'Update a university announcement',
      description: 'Updates an existing university announcement with new details',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID of the announcement to update' }
        }
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'New title of the announcement' },
          content: { type: 'string', description: 'New content of the announcement' },
          category: { type: 'string', description: 'New category of the announcement' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            category: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            published_by: { type: 'string' }
          }
        }
      }
    }
  }, controller.updateAnnouncement);

  // Delete announcement
  fastify.delete('/university/announcements/:id', {
    schema: {
      tags: ['University Announcements'],
      summary: 'Delete a university announcement',
      description: 'Deletes a specific university announcement by its ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID of the announcement to delete' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, controller.deleteAnnouncement);
};

export default universityAnnouncementRoutes;