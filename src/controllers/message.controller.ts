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
  }
}; 