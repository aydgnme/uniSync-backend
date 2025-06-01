import { FastifyRequest, FastifyReply } from 'fastify';
import { Message } from '../models/message.model';

export const messageController = {
  // Get all messages
  getAllMessages: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const messages = await Message.find().sort({ createdAt: -1 });
      return reply.code(200).send(messages);
    } catch (error) {
      return reply.code(500).send({ message: 'Error fetching messages', error });
    }
  },

  // Get a single message
  getMessage: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const message = await Message.findById(request.params.id);
      if (!message) {
        return reply.code(404).send({ message: 'Message not found' });
      }
      return reply.code(200).send(message);
    } catch (error) {
      return reply.code(500).send({ message: 'Error fetching message', error });
    }
  },

  // Create a new message
  createMessage: async (request: FastifyRequest<{ Body: { sender: string; subject: string; message: string; time: string; unread?: boolean } }>, reply: FastifyReply) => {
    try {
      const message = new Message(request.body);
      await message.save();
      return reply.code(201).send(message);
    } catch (error) {
      return reply.code(500).send({ message: 'Error creating message', error });
    }
  },

  // Update message read status
  updateMessageStatus: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const message = await Message.findByIdAndUpdate(
        request.params.id,
        { unread: false },
        { new: true }
      );
      if (!message) {
        return reply.code(404).send({ message: 'Message not found' });
      }
      return reply.code(200).send(message);
    } catch (error) {
      return reply.code(500).send({ message: 'Error updating message', error });
    }
  },

  // Delete a message
  deleteMessage: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const message = await Message.findByIdAndDelete(request.params.id);
      if (!message) {
        return reply.code(404).send({ message: 'Message not found' });
      }
      return reply.code(200).send({ message: 'Message deleted successfully' });
    } catch (error) {
      return reply.code(500).send({ message: 'Error deleting message', error });
    }
  },
}; 