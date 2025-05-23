import { FastifyRequest, FastifyReply } from "fastify";
import { Group } from "../models/group.model";
import { Lecture } from "../models/lecture.model";
import { getAcademicWeekNumber } from "../utils/time.utils";
import { getCurrentMonth, getCurrentDay } from "../utils/date.utils";

export const getSchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { facultyId, specializationShortName, studyYear, groupName, subgroupIndex } = request.params as { 
      facultyId: string; 
      specializationShortName: string;
      studyYear: string;
      groupName: string; 
      subgroupIndex?: string;
    };
    const { week, month, today, parity } = request.query as { 
      week?: string;
      month?: string;
      today?: boolean;
      parity?: string;
    };

    // Find group information
    const groupQuery: any = { 
      facultyId, 
      groupName,
      specializationShortName,
      studyYear: parseInt(studyYear)
    };

    // Add subgroup to group query if provided
    if (subgroupIndex) {
      groupQuery.subgroupIndex = subgroupIndex;
    }

    // Find Group record
    const group = await Group.findOne(groupQuery);
    if (!group) {
      return reply.status(404).send({ 
        success: false, 
        message: subgroupIndex ? "Group or subgroup not found" : "Group not found" 
      });
    }

    // Build lecture query based on group info
    const lectureQuery: any = {
      facultyId,
      groupId: group.id,
      groupName,
      specializationShortName
    };

    // Add subgroup to lecture query if provided
    if (subgroupIndex) {
      lectureQuery.subgroupIndex = subgroupIndex;
    }

    // Parity support
    if (parity) {
      lectureQuery.$or = [
        { parity: parity },
        { parity: 'ALL' },
        { parity: { $exists: false } }
      ];
    }

    // Handle different schedule types
    if (today) {
      const { day, dayName, weekNumber } = getCurrentDay();
      lectureQuery.weeks = weekNumber;
      lectureQuery.weekDay = day;

      const lectures = await Lecture.find(lectureQuery).sort({ startTime: 1 });
      const courses = lectures.map(lecture => ({
        id: lecture._id,
        code: lecture.code,
        title: lecture.title,
        type: lecture.type,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
        duration: lecture.duration,
        room: lecture.room,
        teacher: lecture.teacher,
        weekDay: lecture.weekDay
      }));

      return reply.send({
        success: true,
        facultyId: group.facultyId,
        groupId: group.id,
        groupName: group.groupName,
        subgroupIndex: group.subgroupIndex,
        specializationShortName: group.specializationShortName,
        studyYear: group.studyYear,
        isModular: group.isModular,
        data: {
          day,
          dayName,
          weekNumber,
          parity: "ALL",
          courses
        }
      });
    }

    if (month) {
      const monthNumber = parseInt(month);
      const lectures = await Lecture.find(lectureQuery).sort({ weekNumber: 1, weekDay: 1, startTime: 1 });
      
      const schedule = lectures.reduce((acc: any[], lecture) => {
        const weekIndex = acc.findIndex(w => w.weekNumber === lecture.weeks[0]);
        if (weekIndex === -1) {
          acc.push({
            weekNumber: lecture.weeks[0],
            parity: "ALL",
            courses: [{
              id: lecture._id,
              code: lecture.code,
              title: lecture.title,
              type: lecture.type,
              startTime: lecture.startTime,
              endTime: lecture.endTime,
              duration: lecture.duration,
              room: lecture.room,
              teacher: lecture.teacher,
              weekDay: lecture.weekDay
            }]
          });
        } else {
          acc[weekIndex].courses.push({
            id: lecture._id,
            code: lecture.code,
            title: lecture.title,
            type: lecture.type,
            startTime: lecture.startTime,
            endTime: lecture.endTime,
            duration: lecture.duration,
            room: lecture.room,
            teacher: lecture.teacher,
            weekDay: lecture.weekDay
          });
        }
        return acc;
      }, []);

      return reply.send({
        success: true,
        facultyId: group.facultyId,
        groupId: group.id,
        groupName: group.groupName,
        subgroupIndex: group.subgroupIndex,
        specializationShortName: group.specializationShortName,
        studyYear: group.studyYear,
        isModular: group.isModular,
        data: {
          month: monthNumber,
          schedule
        }
      });
    }

    // Default: weekly schedule
    const weekNumber = week ? parseInt(week) : getAcademicWeekNumber();
    lectureQuery.weeks = weekNumber;

    const lectures = await Lecture.find(lectureQuery).sort({ weekDay: 1, startTime: 1 });
    const courses = lectures.map(lecture => ({
      id: lecture._id,
      code: lecture.code,
      title: lecture.title,
      type: lecture.type,
      startTime: lecture.startTime,
      endTime: lecture.endTime,
      duration: lecture.duration,
      room: lecture.room,
      teacher: lecture.teacher,
      weekDay: lecture.weekDay
    }));

    return reply.send({
      success: true,
      facultyId: group.facultyId,
      groupId: group.id,
      groupName: group.groupName,
      subgroupIndex: group.subgroupIndex,
      specializationShortName: group.specializationShortName,
      studyYear: group.studyYear,
      isModular: group.isModular,
      data: {
        weekNumber,
        parity: "ALL",
        courses
      }
    });
  } catch (error) {
    console.error("Error in getSchedule:", error);
    return reply.status(500).send({ success: false, message: "Internal server error" });
  }
};

