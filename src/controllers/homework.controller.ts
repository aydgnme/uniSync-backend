import { FastifyRequest, FastifyReply } from 'fastify';
import { Homework, IHomework } from '../models/homework.model';
import { User } from '../models/user.model';
import { Lecture } from '../models/lecture.model';
import { GridFSService } from '../services/gridfs.service';

interface UploadHomeworkBody {
  file: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
  };
  studentId: string;
  lectureId: string;
}

export const submitHomework = async (
  request: FastifyRequest<{ Body: UploadHomeworkBody }>,
  reply: FastifyReply
) => {
  try {
    const { file, studentId, lectureId } = request.body;

    if (!file) {
      return reply.code(400).send({ message: 'Dosya yüklenmedi' });
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      return reply.code(404).send({ message: 'Öğrenci bulunamadı' });
    }

    // Check if lecture exists
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return reply.code(404).send({ message: 'Ders bulunamadı' });
    }

    // Upload file to GridFS
    const fileId = await GridFSService.uploadFile({
      filename: file.filename,
      mimetype: file.mimetype,
      buffer: file.buffer
    });

    // Create homework record
    const homework = await Homework.create({
      student: studentId,
      lecture: lectureId,
      fileId,
      fileName: file.filename
    });

    return reply.code(201).send({
      message: 'Ödev başarıyla yüklendi',
      homeworkId: homework._id,
      fileId,
      studentInfo: homework.studentInfo,
      lectureInfo: homework.lectureInfo
    });
  } catch (error) {
    console.error('Homework submission error:', error);
    return reply.code(500).send({ message: 'Ödev yüklenirken bir hata oluştu' });
  }
};

export const getHomework = async (
  request: FastifyRequest<{ Params: { homeworkId: string } }>,
  reply: FastifyReply
) => {
  try {
    const homework = await Homework.findById(request.params.homeworkId)
      .populate('student')
      .populate('lecture');

    if (!homework) {
      return reply.code(404).send({ message: 'Ödev bulunamadı' });
    }

    return reply.send({
      ...homework.toJSON(),
      studentInfo: homework.studentInfo,
      lectureInfo: homework.lectureInfo
    });
  } catch (error) {
    console.error('Get homework error:', error);
    return reply.code(500).send({ message: 'Ödev bilgileri alınırken bir hata oluştu' });
  }
};

export const getStudentHomeworks = async (
  request: FastifyRequest<{ Params: { studentId: string } }>,
  reply: FastifyReply
) => {
  try {
    const student = await User.findById(request.params.studentId);
    if (!student) {
      return reply.code(404).send({ message: 'Öğrenci bulunamadı' });
    }

    const homeworks = await Homework.find({ student: request.params.studentId })
      .populate('student')
      .populate('lecture');

    return reply.send(homeworks.map(hw => ({
      ...hw.toJSON(),
      studentInfo: hw.studentInfo,
      lectureInfo: hw.lectureInfo
    })));
  } catch (error) {
    console.error('Get student homeworks error:', error);
    return reply.code(500).send({ message: 'Öğrenci ödevleri alınırken bir hata oluştu' });
  }
};

export const getLectureHomeworks = async (
  request: FastifyRequest<{ Params: { lectureId: string } }>,
  reply: FastifyReply
) => {
  try {
    const lecture = await Lecture.findById(request.params.lectureId);
    if (!lecture) {
      return reply.code(404).send({ message: 'Ders bulunamadı' });
    }

    const homeworks = await Homework.find({ lecture: request.params.lectureId })
      .populate('student')
      .populate('lecture');

    return reply.send(homeworks.map(hw => ({
      ...hw.toJSON(),
      studentInfo: hw.studentInfo,
      lectureInfo: hw.lectureInfo
    })));
  } catch (error) {
    console.error('Get lecture homeworks error:', error);
    return reply.code(500).send({ message: 'Ders ödevleri alınırken bir hata oluştu' });
  }
};

export const gradeHomework = async (
  request: FastifyRequest<{
    Params: { homeworkId: string };
    Body: { grade: number; feedback?: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const { grade, feedback } = request.body;
    const homework = await Homework.findByIdAndUpdate(
      request.params.homeworkId,
      { 
        grade,
        feedback,
        status: 'graded'
      },
      { new: true }
    ).populate('student').populate('lecture');

    if (!homework) {
      return reply.code(404).send({ message: 'Ödev bulunamadı' });
    }

    return reply.send({
      ...homework.toJSON(),
      studentInfo: homework.studentInfo,
      lectureInfo: homework.lectureInfo
    });
  } catch (error) {
    console.error('Grade homework error:', error);
    return reply.code(500).send({ message: 'Ödev notlandırılırken bir hata oluştu' });
  }
}; 