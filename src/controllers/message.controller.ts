import { FastifyRequest, FastifyReply } from 'fastify';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export const messageController = {
  async getAllMessages(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return reply.send(messages);
    } catch (error) {
      logger.error('Error fetching messages:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  },

  async getMessage(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const { data: message, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!message) {
        return reply.status(404).send({ error: 'Message not found' });
      }

      return reply.send(message);
    } catch (error) {
      logger.error('Error fetching message:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  },

  async createMessage(request: FastifyRequest<{
    Body: {
      sender: string;
      subject: string;
      message: string;
      time: string;
      unread?: boolean;
    }
  }>, reply: FastifyReply) {
    try {
      const { sender, subject, message, time, unread = true } = request.body;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender,
          subject,
          message,
          time,
          unread
        })
        .select()
        .single();

      if (error) throw error;

      return reply.status(201).send(data);
    } catch (error) {
      logger.error('Error creating message:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  },

  async updateMessageStatus(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const { data, error } = await supabase
        .from('messages')
        .update({ unread: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        return reply.status(404).send({ error: 'Message not found' });
      }

      return reply.send(data);
    } catch (error) {
      logger.error('Error updating message status:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  },

  async deleteMessage(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      const { id } = request.params;

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return reply.send({ message: 'Message deleted successfully' });
    } catch (error) {
      logger.error('Error deleting message:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}; 