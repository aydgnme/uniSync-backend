import { FastifyRequest, FastifyReply } from 'fastify';
import { Announcement } from '../models/announcement.model';
import { FirebaseService } from '../services/firebase.service';

// Add announcement to MongoDB and Firebase
export const createAnnouncement = async (request: FastifyRequest, reply: FastifyReply) => {
  const { title, content, type, date, attachments } = request.body as any;

  if (!title || !content || !type) {
    return reply.status(400).send({ error: 'Missing required fields: title, content, and type are required.' });
  }

  try {
    // Save to MongoDB
    const announcement = new Announcement({
      title,
      content,
      type,
      date: date || new Date().toISOString().split('T')[0],
      attachments: attachments || []
    });
    await announcement.save();

    // Save to Firestore (collection: announcements)
    const db = (FirebaseService as any).getDb();
    const docRef = await db.collection('announcements').add({
      title,
      content,
      type,
      date: date || new Date().toISOString().split('T')[0],
      attachments: attachments || [],
      createdAt: new Date()
    });

    return reply.status(201).send({
      id: announcement._id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      date: announcement.date,
      attachments: announcement.attachments
    });
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to create announcement.' });
  }
};

// Get all announcements
export const getAnnouncements = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const announcements = await Announcement.find()
      .sort({ date: -1 })
      .select('id title content type date attachments');

    return reply.status(200).send(announcements);
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to fetch announcements.' });
  }
};

// Get announcement by ID
export const getAnnouncementById = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };

  try {
    const announcement = await Announcement.findById(id)
      .select('id title content type date attachments');

    if (!announcement) {
      return reply.status(404).send({ error: 'Announcement not found.' });
    }

    return reply.send(announcement);
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to get announcement.' });
  }
};

// Get announcements by type
export const getAnnouncementsByLecture = async (request: FastifyRequest, reply: FastifyReply) => {
  const { type } = request.params as { type: string };

  if (!['Academic', 'Technical', 'General'].includes(type)) {
    return reply.status(400).send({ error: 'Invalid announcement type.' });
  }

  try {
    const announcements = await Announcement.find({ type })
      .sort({ date: -1 })
      .select('id title content type date attachments');

    return reply.status(200).send(announcements);
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to fetch announcements by type.' });
  }
};