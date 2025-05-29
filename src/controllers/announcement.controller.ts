import { FastifyRequest, FastifyReply } from 'fastify';
import { Announcement } from '../models/announcement.model';
import { FirebaseService } from '../services/firebase.service';

// Add announcement to MongoDB and Firebase
export const createAnnouncement = async (request: FastifyRequest, reply: FastifyReply) => {
  // Required fields: lecture, author, content
  const { lecture, author, content, attachments } = request.body as any;

  if (!lecture || !author || !content) {
    return reply.status(400).send({ error: 'Missing required fields.' });
  }

  try {
    // Save to MongoDB
    const announcement = new Announcement({
      lecture,
      author,
      content,
      attachments
    });
    await announcement.save();

    // Save to Firestore (collection: announcements)
    const db = (FirebaseService as any).getDb();
    const docRef = await db.collection('announcements').add({
      lecture: String(lecture),
      author: String(author),
      content,
      attachments: attachments || [],
      createdAt: new Date()
    });

    return reply.status(201).send({ id: announcement._id, firebaseId: docRef.id, message: 'Announcement created.' });
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to create announcement.' });
  }
};

// Get all announcements
export const getAnnouncements = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
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
      .populate('lecture', 'name code')
      .populate('author', 'firstName lastName email');

    if (!announcement) {
      return reply.status(404).send({ error: 'Announcement not found.' });
    }

    // Get Firebase data
    const db = (FirebaseService as any).getDb();
    const firebaseDoc = await db.collection('announcements')
      .where('mongoId', '==', id)
      .get();

    const firebaseData = firebaseDoc.empty ? null : firebaseDoc.docs[0].data();

    return reply.send({
      ...announcement.toJSON(),
      firebaseData
    });
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to get announcement.' });
  }
};

// Get announcements by lecture
export const getAnnouncementsByLecture = async (request: FastifyRequest, reply: FastifyReply) => {
  const { lecture } = request.params as any;

  try {
    const announcements = await Announcement.find({ lecture }).sort({ createdAt: -1 });
    return reply.status(200).send(announcements);
  } catch (error) {
    return reply.status(500).send({ error: 'Failed to fetch announcements for lecture.' });
  }
};