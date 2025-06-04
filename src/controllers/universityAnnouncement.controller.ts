import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';

export class UniversityAnnouncementController {
  async getAllAnnouncements(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { data, error } = await supabase
        .from('university_announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return reply.code(200).send(data);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  }

  async createAnnouncement(request: FastifyRequest<{
    Body: {
      title: string;
      content: string;
      category: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { title, content, category } = request.body;
      const userId = request.user.userId;

      const { data, error } = await supabase
        .from('university_announcements')
        .insert([
          {
            title,
            content,
            category,
            published_by: userId
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return reply.code(201).send(data);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  }

  async getAnnouncementById(request: FastifyRequest<{
    Params: {
      id: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const { data, error } = await supabase
        .from('university_announcements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        return reply.code(404).send({ error: 'Announcement not found' });
      }

      return reply.code(200).send(data);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  }

  async updateAnnouncement(request: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: {
      title?: string;
      content?: string;
      category?: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;
      const { title, content, category } = request.body;

      const { data, error } = await supabase
        .from('university_announcements')
        .update({
          title,
          content,
          category
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        return reply.code(404).send({ error: 'Announcement not found' });
      }

      return reply.code(200).send(data);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  }

  async deleteAnnouncement(request: FastifyRequest<{
    Params: {
      id: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const { error } = await supabase
        .from('university_announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return reply.code(200).send({ message: 'Announcement deleted successfully' });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  }
}