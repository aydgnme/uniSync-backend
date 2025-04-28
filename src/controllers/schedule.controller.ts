import { FastifyRequest, FastifyReply } from "fastify";
import { Lecture } from "../models";
import { getAcademicWeekNumber, getParity, calculateEndTime } from "../utils/time.utils";

function generateDefaultWeeks(parity: "ALL" | "ODD" | "EVEN"): number[] {
  if (parity === "ALL") return Array.from({ length: 14 }, (_, i) => i + 1);
  if (parity === "ODD") return [1, 3, 5, 7, 9, 11, 13];
  if (parity === "EVEN") return [2, 4, 6, 8, 10, 12, 14];
  return [];
}

export const getSchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { group, subgroup } = request.params as { group: string; subgroup: string };
    const { week: forcedWeek } = request.query as { week?: string };

    let weekNumber = getAcademicWeekNumber();
    if (forcedWeek) {
      const parsedWeek = parseInt(forcedWeek, 10);
      if (!isNaN(parsedWeek) && parsedWeek >= 1 && parsedWeek <= 14) {
        weekNumber = parsedWeek;
      }
    }

    const parity = getParity(weekNumber);

    const lectures = await Lecture.find({
      group,
      subgroup,
      $or: [{ parity: "ALL" }, { parity }]
    }).lean();

    const courses = lectures
      .filter(lecture => {
        const weeks = lecture.weeks.length > 0 ? lecture.weeks : generateDefaultWeeks(lecture.parity);
        return weeks.includes(weekNumber);
      })
      .map((lecture, index) => {
        const weeks = lecture.weeks.length > 0 ? lecture.weeks : generateDefaultWeeks(lecture.parity);

        return {
          id: `course-${index + 1}`,
          code: lecture.code,
          title: lecture.title,
          type: lecture.type,
          startTime: lecture.startHour,
          endTime: calculateEndTime(lecture.startHour, lecture.duration),
          duration: lecture.duration,
          room: lecture.room,
          teacher: lecture.teacher,
          group: lecture.group,
          subgroup: lecture.subgroup,
          parity: lecture.parity,
          weekDay: lecture.weekDay,
        };
      });

    return reply.send({
      success: true,
      courses,
      weekNumber,
      parity
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
};


export const getWeeklySchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { group, subgroup, week } = request.params as { group: string; subgroup: string; week: string };
    const weekNumber = parseInt(week, 10);

    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 14) {
      return reply.status(400).send({
        success: false,
        message: "Invalid week number. Week must be between 1 and 14."
      });
    }

    const parity = getParity(weekNumber);

    const lectures = await Lecture.find({
      group,
      subgroup,
      $or: [{ parity: "ALL" }, { parity }]
    }).lean();

    const courses = lectures
      .filter(lecture => {
        const weeks = lecture.weeks.length > 0 ? lecture.weeks : generateDefaultWeeks(lecture.parity);
        return weeks.includes(weekNumber);
      })
      .map((lecture, index) => {
        const weeks = lecture.weeks.length > 0 ? lecture.weeks : generateDefaultWeeks(lecture.parity);

        return {
          id: `course-${index + 1}`,
          code: lecture.code,
          title: lecture.title,
          type: lecture.type,
          startTime: lecture.startHour,
          endTime: calculateEndTime(lecture.startHour, lecture.duration),
          duration: lecture.duration,
          room: lecture.room,
          teacher: lecture.teacher,
          group: lecture.group,
          subgroup: lecture.subgroup,
          parity: lecture.parity,
          weekDay: lecture.weekDay,
        };
      });

    return reply.send({
      success: true,
      courses,
      weekNumber,
      parity
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
};

export const getMonthlySchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { group, subgroup, month } = request.params as { group: string; subgroup: string; month: string };
    const monthNumber = parseInt(month, 10);

    if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
      return reply.status(400).send({
        success: false,
        message: "Invalid month number. Month must be between 1 and 12."
      });
    }

    const lectures = await Lecture.find({
      group,
      subgroup,
      $or: [{ parity: "ALL" }, { parity: "ODD" }, { parity: "EVEN" }]
    }).lean();

    const monthlySchedule = Array.from({ length: 14 }, (_, weekIndex) => {
      const weekNumber = weekIndex + 1;
      const parity = getParity(weekNumber);

      const weekLectures = lectures
        .filter(lecture => {
          const weeks = lecture.weeks.length > 0 ? lecture.weeks : generateDefaultWeeks(lecture.parity);
          return weeks.includes(weekNumber);
        })
        .map((lecture, index) => ({
          id: `course-${weekNumber}-${index + 1}`,
          code: lecture.code,
          title: lecture.title,
          type: lecture.type,
          startTime: lecture.startHour,
          endTime: calculateEndTime(lecture.startHour, lecture.duration),
          duration: lecture.duration,
          room: lecture.room,
          teacher: lecture.teacher,
          group: lecture.group,
          subgroup: lecture.subgroup,
          parity: lecture.parity,
          weekDay: lecture.weekDay,
        }));

      return {
        weekNumber,
        parity,
        courses: weekLectures
      };
    });

    return reply.send({
      success: true,
      month: monthNumber,
      schedule: monthlySchedule
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
};

export const getAllSubgroups = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const uniqueSubgroups = await Lecture.distinct('subgroup');
    
    const subgroups = uniqueSubgroups.map(subgroup => ({
      id: subgroup,
      name: subgroup.toUpperCase()
    }));

    return reply.send({
      success: true,
      data: subgroups
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
};

export const getCombinedSchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { group, subgroups } = request.params as { group: string; subgroups: string };
    const { week: forcedWeek } = request.query as { week?: string };

    let weekNumber = getAcademicWeekNumber();
    if (forcedWeek) {
      const parsedWeek = parseInt(forcedWeek, 10);
      if (!isNaN(parsedWeek) && parsedWeek >= 1 && parsedWeek <= 14) {
        weekNumber = parsedWeek;
      }
    }

    const parity = getParity(weekNumber);
    const subgroupList = subgroups.split(',').map(s => s.trim().toLowerCase());

    const lectures = await Lecture.find({
      group,
      subgroup: { $in: subgroupList },
      $or: [{ parity: "ALL" }, { parity }]
    }).lean();

    const filteredLectures = lectures.filter(lecture => {
      const weeks = lecture.weeks.length > 0 ? lecture.weeks : generateDefaultWeeks(lecture.parity);
      return weeks.includes(weekNumber);
    });

    const courses = filteredLectures.map((lecture, index) => ({
      id: `course-${index + 1}`,
      code: lecture.code,
      title: lecture.title,
      type: lecture.type,
      startTime: lecture.startHour,
      endTime: calculateEndTime(lecture.startHour, lecture.duration),
      duration: lecture.duration,
      room: lecture.room,
      teacher: lecture.teacher,
      group: lecture.group,
      subgroup: lecture.subgroup,
      parity: lecture.parity,
      weekDay: lecture.weekDay,
    }));

    return reply.send({
      success: true,
      courses,
      weekNumber,
      parity,
      subgroups: subgroupList
    });
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ success: false, message: "Internal Server Error" });
  }
};

