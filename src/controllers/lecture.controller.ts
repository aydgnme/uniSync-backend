import { FastifyReply, FastifyRequest } from 'fastify';
import { Lecture, ILectureDocument, ITeacherInfo } from '../models/lecture.model';
import { Group } from '../models/group.model';
import { Schema } from 'mongoose';

export class LectureController {
  static async getAllLectures(request: FastifyRequest, reply: FastifyReply) {
    try {
      const lectures = await Lecture.find();
      return reply.code(200).send(lectures);
    } catch (error: unknown) {
      console.error('Error fetching lectures:', error);
      return reply.code(500).send({
        message: 'Error fetching lectures',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getLectureById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const lecture = await Lecture.findById(request.params.id);

      if (!lecture) {
        return reply.code(404).send({
          message: 'Lecture not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      return reply.code(200).send(lecture);
    } catch (error: unknown) {
      console.error('Error fetching lecture:', error);
      return reply.code(500).send({
        message: 'Error fetching lecture',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async createLecture(
    request: FastifyRequest<{
      Body: {
        code: string;
        title: string;
        type: 'LECTURE' | 'LAB' | 'SEMINAR';
        room: string;
        teacher: string;
        teacherInfo: ITeacherInfo;
        weekDay: number;
        startHour: string;
        duration: number;
        weeks?: number[];
        parity?: 'ODD' | 'EVEN' | 'ALL';
        groupId: string;
        group: string;
        subgroup: string;
        specializationShortName: string;
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const {
        code,
        title,
        type,
        room,
        teacher,
        teacherInfo,
        weekDay,
        startHour,
        duration,
        weeks,
        parity,
        groupId,
        group,
        subgroup,
        specializationShortName
      } = request.body;

      // Validate group exists and get studyYear
      const groupDoc = await Group.findOne({ id: groupId });
      if (!groupDoc) {
        return reply.code(404).send({
          message: 'Group not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      // Validate required fields
      const requiredFields = {
        code,
        title,
        type,
        room,
        teacher,
        teacherInfo,
        weekDay,
        startHour,
        duration,
        groupId,
        group,
        subgroup,
        specializationShortName
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        return reply.code(400).send({
          message: 'Missing required fields',
          fields: missingFields,
          code: 'BAD_REQUEST',
          statusCode: 400
        });
      }

      // Validate weekDay (0-6, where 0 is Sunday)
      if (weekDay < 0 || weekDay > 6) {
        return reply.code(400).send({
          message: 'Invalid weekDay. Must be between 0 and 6',
          code: 'BAD_REQUEST',
          statusCode: 400
        });
      }

      // Validate startHour format (HH:mm)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startHour)) {
        return reply.code(400).send({
          message: 'Invalid startHour format. Must be HH:mm',
          code: 'BAD_REQUEST',
          statusCode: 400
        });
      }

      // Validate duration (positive number)
      if (duration <= 0) {
        return reply.code(400).send({
          message: 'Duration must be a positive number',
          code: 'BAD_REQUEST',
          statusCode: 400
        });
      }

      // Validate teacherInfo
      if (!teacherInfo.lastName || !teacherInfo.firstName) {
        return reply.code(400).send({
          message: 'Teacher info must include lastName and firstName',
          code: 'BAD_REQUEST',
          statusCode: 400
        });
      }

      // Create lecture object
      const lectureData: Partial<ILectureDocument> = {
        code,
        title,
        type,
        room,
        teacher,
        teacherInfo,
        weekDay,
        startTime: startHour,
        duration,
        weeks: weeks || [],
        parity: parity || 'ALL',
        groupId,
        groupName: group,
        subgroupIndex: subgroup,
        specializationShortName,
        studyYear: groupDoc.studyYear
      };

      const lecture = new Lecture(lectureData);
      await lecture.save();
      
      return reply.code(201).send(lecture);
    } catch (error: unknown) {
      console.error('Error creating lecture:', error);
      return reply.code(500).send({
        message: 'Error creating lecture',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async updateLecture(
    request: FastifyRequest<{
      Params: { id: string };
      Body: {
        code?: string;
        title?: string;
        type?: 'LECTURE' | 'LAB' | 'SEMINAR';
        room?: string;
        teacher?: string;
        teacherInfo?: ITeacherInfo;
        weekDay?: number;
        startHour?: string;
        duration?: number;
        weeks?: number[];
        parity?: 'ODD' | 'EVEN' | 'ALL';
        groupId?: string;
        group?: string;
        subgroup?: string;
        specializationShortName?: string;
      }
    }>,
    reply: FastifyReply
  ) {
    try {
      const {
        code,
        title,
        type,
        room,
        teacher,
        teacherInfo,
        weekDay,
        startHour,
        duration,
        weeks,
        parity,
        groupId,
        group,
        subgroup,
        specializationShortName
      } = request.body;

      // Get current lecture
      const currentLecture = await Lecture.findById(request.params.id);
      if (!currentLecture) {
        return reply.code(404).send({
          message: 'Lecture not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      // If groupId is changing, validate new group and get studyYear
      let studyYear = currentLecture.studyYear;
      if (groupId && groupId !== currentLecture.groupId) {
        const groupDoc = await Group.findOne({ id: groupId });
        if (!groupDoc) {
          return reply.code(404).send({
            message: 'Group not found',
            code: 'NOT_FOUND',
            statusCode: 404
          });
        }
        studyYear = groupDoc.studyYear;
      }

      // Validate weekDay if provided
      if (weekDay !== undefined && (weekDay < 0 || weekDay > 6)) {
        return reply.code(400).send({
          message: 'Invalid weekDay. Must be between 0 and 6',
          code: 'BAD_REQUEST',
          statusCode: 400
        });
      }

      // Validate startHour format if provided
      if (startHour) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startHour)) {
          return reply.code(400).send({
            message: 'Invalid startHour format. Must be HH:mm',
            code: 'BAD_REQUEST',
            statusCode: 400
          });
        }
      }

      // Validate duration if provided
      if (duration !== undefined && duration <= 0) {
        return reply.code(400).send({
          message: 'Duration must be a positive number',
          code: 'BAD_REQUEST',
          statusCode: 400
        });
      }

      // Validate teacherInfo if provided
      if (teacherInfo && (!teacherInfo.lastName || !teacherInfo.firstName)) {
        return reply.code(400).send({
          message: 'Teacher info must include lastName and firstName',
          code: 'BAD_REQUEST',
          statusCode: 400
        });
      }

      // Prepare update data
      const updateData: any = {};
      if (code) updateData.code = code;
      if (title) updateData.title = title;
      if (type) updateData.type = type;
      if (room) updateData.room = room;
      if (teacher) updateData.teacher = teacher;
      if (teacherInfo) updateData.teacherInfo = teacherInfo;
      if (weekDay !== undefined) updateData.weekDay = weekDay;
      if (startHour) updateData.startTime = startHour;
      if (duration !== undefined) updateData.duration = duration;
      if (weeks) updateData.weeks = weeks;
      if (parity) updateData.parity = parity;
      if (groupId) {
        updateData.groupId = groupId;
        updateData.studyYear = studyYear;
      }
      if (group) updateData.groupName = group;
      if (subgroup) updateData.subgroupIndex = subgroup;
      if (specializationShortName) updateData.specializationShortName = specializationShortName;

      const lecture = await Lecture.findByIdAndUpdate(
        request.params.id,
        updateData,
        { new: true }
      );

      if (!lecture) {
        return reply.code(404).send({
          message: 'Lecture not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      return reply.code(200).send(lecture);
    } catch (error: unknown) {
      console.error('Error updating lecture:', error);
      return reply.code(500).send({
        message: 'Error updating lecture',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async deleteLecture(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const lecture = await Lecture.findByIdAndDelete(request.params.id);
      
      if (!lecture) {
        return reply.code(404).send({
          message: 'Lecture not found',
          code: 'NOT_FOUND',
          statusCode: 404
        });
      }

      return reply.code(200).send({
        message: 'Lecture deleted successfully',
        code: 'SUCCESS',
        statusCode: 200
      });
    } catch (error: unknown) {
      console.error('Error deleting lecture:', error);
      return reply.code(500).send({
        message: 'Error deleting lecture',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getLecturesByTeacher(
    request: FastifyRequest<{ Params: { teacherId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const lectures = await Lecture.find({ teacher: request.params.teacherId });
      return reply.code(200).send(lectures);
    } catch (error: unknown) {
      console.error('Error fetching lectures:', error);
      return reply.code(500).send({
        message: 'Error fetching lectures',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getLecturesByGroup(
    request: FastifyRequest<{ Params: { group: string } }>,
    reply: FastifyReply
  ) {
    try {
      const lectures = await Lecture.find({ group: request.params.group });
      return reply.code(200).send(lectures);
    } catch (error: unknown) {
      console.error('Error fetching lectures:', error);
      return reply.code(500).send({
        message: 'Error fetching lectures',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 