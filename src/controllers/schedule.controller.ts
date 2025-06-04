import { FastifyRequest, FastifyReply } from "fastify";
import { supabase } from "../lib/supabase";
import { User, Schedule, WeekDay } from "../types/database.types";


// Add weekDay mapping
const weekDayToNumber: Record<WeekDay, number> = {
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6,
  'Sunday': 7
};

export const getMySchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 1. User authentication
    const user = request.user as User;

    if (!user || user.role.toLowerCase() !== 'student') {
      return reply.status(403).send({
        success: false,
        message: 'Access denied – only students can access schedule.'
      });
    }

    // 2. Get student's group_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('group_id')
      .eq('user_id', user.userId)
      .single();

    if (studentError || !student) {
      return reply.status(404).send({
        success: false,
        message: 'Student record not found.'
      });
    }

    // 3. Get schedule from full_schedule_view
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('full_schedule_view')
      .select(`
        schedule_id,
        course_id,
        week_day,
        start_time,
        end_time,
        room,
        parity,
        group_id,
        group_index,
        weeks,
        group_name,
        course_code,
        course_title,
        course_type,
        teacher_name
      `)
      .eq('group_id', student.group_id);

    if (scheduleError) {
      console.error('Error fetching schedule:', scheduleError);
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch schedule from database.'
      });
    }

    // 4. Format the data for frontend (camelCase)
    const formattedSchedule = (scheduleData ?? []).map((entry: any) => {
      // Convert week_day to number safely
      let weekDayNumber: number;
      try {
        weekDayNumber = parseInt(entry.week_day);
        if (isNaN(weekDayNumber)) {
          // If parsing fails, use the weekDayToNumber mapping
          weekDayNumber = weekDayToNumber[entry.week_day as WeekDay] || 1;
        }
      } catch {
        weekDayNumber = 1; // Default to Monday if conversion fails
      }

      return {
        scheduleId: entry.schedule_id,
        courseId: entry.course_id,
        courseCode: entry.course_code,
        courseTitle: entry.course_title,
        courseType: entry.course_type || 'LECTURE',
        teacherName: entry.teacher_name || 'N/A',
        weekDay: weekDayNumber,
        startTime: entry.start_time,
        endTime: entry.end_time,
        room: entry.room,
        parity: entry.parity,
        groupId: entry.group_id,
        groupName: entry.group_name,
        groupIndex: entry.group_index,
        weeks: entry.weeks
      };
    });

    // 5. Sort the schedule data
    const sortedSchedule = formattedSchedule.sort((a, b) => {
      // First sort by weekday
      if (a.weekDay !== b.weekDay) {
        return a.weekDay - b.weekDay;
      }
      // If same weekday, sort by start time
      return a.startTime.localeCompare(b.startTime);
    });

    return reply.send({
      success: true,
      data: sortedSchedule
    });

  } catch (err) {
    console.error('Unhandled error in getMySchedule:', err);
    return reply.status(500).send({
      success: false,
      message: 'Internal server error.'
    });
  }
};

export const getAllSchedules = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user as User;

    if (!user || user.role !== 'admin') {
      return reply.status(403).send({
        success: false,
        message: "Access denied: Admin privileges required"
      });
    }

    const { data: schedules, error } = await supabase
      .from('full_schedule_view')
      .select(`
        schedule_id,
        course_id,
        week_day,
        start_time,
        end_time,
        room,
        parity,
        group_id,
        weeks,
        group_name,
        group_index,
        course_code,
        course_title,
        course_type,
        teacher_name
      `)
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching all schedules:", error);
      return reply.status(500).send({ success: false, message: "Internal server error" });
    }

    return reply.send({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error("Unhandled error in getAllSchedules:", error);
    return reply.status(500).send({ success: false, message: "Internal server error" });
  }
};

export const getScheduleByGroup = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 1. User authentication
    const user = request.user as User;

    if (!user || user.role.toLowerCase() !== 'student') {
      return reply.status(403).send({
        success: false,
        message: 'Access denied – only students can access schedule.'
      });
    }

    // 2. Get student's group_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('group_id')
      .eq('user_id', user.userId)
      .single();

    if (studentError || !student) {
      return reply.status(404).send({
        success: false,
        message: 'Student record not found.'
      });
    }

    const { week, month, today, parity } = request.query as {
      week?: number;
      month?: number;
      today?: boolean;
      parity?: 'ODD' | 'EVEN' | 'ALL'
    };

    console.log('Fetching schedule for student:', user.userId);
    console.log('Group ID:', student.group_id);
    console.log('Query parameters:', { week, month, today, parity });

    let query = supabase
      .from('full_schedule_view')
      .select(`
        schedule_id,
        course_id,
        week_day,
        start_time,
        end_time,
        room,
        parity,
        group_id,
        weeks,
        group_name,
        group_index,
        course_code,
        course_title,
        course_type,
        teacher_name
      `)
      .eq('group_id', student.group_id);

    if (today) {
      const today = new Date();
      const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
      query = query.eq('week_day', dayName);
    } else if (week) {
      query = query.contains('weeks', [week]);
    } else if (month) {
      // Calculate weeks for the given month
      const startDate = new Date(new Date().getFullYear(), month - 1, 1);
      const endDate = new Date(new Date().getFullYear(), month, 0);
      const startWeek = Math.ceil((startDate.getDate() + startDate.getDay()) / 7);
      const endWeek = Math.ceil((endDate.getDate() + endDate.getDay()) / 7);
      query = query.overlaps('weeks', Array.from({ length: endWeek - startWeek + 1 }, (_, i) => startWeek + i));
    }

    if (parity && parity !== 'ALL') {
      query = query.eq('parity', parity);
    }

    const { data: schedules, error } = await query
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching schedule by group:", error);
      return reply.status(500).send({ 
        success: false, 
        message: "Error fetching schedule data" 
      });
    }

    console.log('Found schedules:', schedules?.length ?? 0);
    if (schedules) {
      console.log('First schedule:', schedules[0]);
    }

    if (!schedules || schedules.length === 0) {
      return reply.status(404).send({
        success: false,
        message: "No schedule found for your group"
      });
    }

    return reply.send({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error("Unhandled error in getScheduleByGroup:", error);
    return reply.status(500).send({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};

export const getSchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const {
      facultyId,
      specializationShortName,
      studyYear,
      groupName
    } = request.params as {
      facultyId: string;
      specializationShortName: string;
      studyYear: number;
      groupName: string;
    };

    const {
      subgroupIndex,
      week,
      month,
      today,
      parity
    } = request.query as {
      subgroupIndex?: number;
      week?: number;
      month?: number;
      today?: boolean;
      parity?: 'ODD' | 'EVEN' | 'ALL'
    };

    // First, find the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id, name')
      .eq('faculty_id', facultyId)
      .eq('specialization_short_name', specializationShortName)
      .eq('study_year', studyYear)
      .eq('name', groupName)
      .eq('subgroup_index', subgroupIndex || 0)
      .single();

    if (groupError || !group) {
      return reply.status(404).send({
        success: false,
        message: "Group not found"
      });
    }

    // Then get the schedule
    let query = supabase
      .from('full_schedule_view')
      .select(`
        schedule_id,
        course_id,
        week_day,
        start_time,
        end_time,
        room,
        parity,
        group_id,
        weeks,
        group_name,
        group_index,
        course_code,
        course_title,
        course_type,
        teacher_name
      `)
      .eq('group_id', group.id);

    if (today) {
      const today = new Date();
      const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
      query = query.eq('week_day', dayName);
    } else if (week) {
      query = query.contains('weeks', [week]);
    } else if (month) {
      // Calculate weeks for the given month
      const startDate = new Date(new Date().getFullYear(), month - 1, 1);
      const endDate = new Date(new Date().getFullYear(), month, 0);
      const startWeek = Math.ceil((startDate.getDate() + startDate.getDay()) / 7);
      const endWeek = Math.ceil((endDate.getDate() + endDate.getDay()) / 7);
      query = query.overlaps('weeks', Array.from({ length: endWeek - startWeek + 1 }, (_, i) => startWeek + i));
    }

    if (parity && parity !== 'ALL') {
      query = query.eq('parity', parity);
    }

    const { data: schedules, error } = await query
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching schedule:", error);
      return reply.status(500).send({ success: false, message: "Internal server error" });
    }

    if (!schedules || schedules.length === 0) {
      return reply.status(404).send({
        success: false,
        message: "No schedule found for the specified parameters"
      });
    }

    return reply.send({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error("Unhandled error in getSchedule:", error);
    return reply.status(500).send({ success: false, message: "Internal server error" });
  }
};

export const getWeeklySchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 1. User authentication
    const user = request.user as User;

    if (!user || user.role.toLowerCase() !== 'student') {
      return reply.status(403).send({
        success: false,
        message: 'Access denied – only students can access schedule.'
      });
    }

    // 2. Get query parameters
    const { pastWeeks = 1, futureWeeks = 1 } = request.query as {
      pastWeeks?: number;
      futureWeeks?: number;
    };

    // 3. Get student's group_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('group_id')
      .eq('user_id', user.userId)
      .single();

    if (studentError || !student) {
      return reply.status(404).send({
        success: false,
        message: 'Student record not found.'
      });
    }

    // 4. Mevcut haftayı hesapla
    const currentDate = new Date();
    const currentWeek = Math.ceil((currentDate.getDate() + currentDate.getDay()) / 7);

    // 5. Geçmiş ve gelecek haftaları hesapla
    const pastWeekNumbers = Array.from({ length: pastWeeks }, (_, i) => currentWeek - (i + 1));
    const futureWeekNumbers = Array.from({ length: futureWeeks }, (_, i) => currentWeek + (i + 1));

    // 6. Geçmiş haftaların derslerini al
    const { data: pastScheduleData, error: pastScheduleError } = await supabase
      .from('full_schedule_view')
      .select(`
        schedule_id,
        course_id,
        week_day,
        start_time,
        end_time,
        room,
        parity,
        group_id,
        group_index,
        weeks,
        group_name,
        course_code,
        course_title,
        course_type,
        teacher_name
      `)
      .eq('group_id', student.group_id)
      .overlaps('weeks', pastWeekNumbers);

    if (pastScheduleError) {
      console.error('Error fetching past schedule:', pastScheduleError);
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch past schedule from database.'
      });
    }

    // 7. Gelecek haftaların derslerini al
    const { data: futureScheduleData, error: futureScheduleError } = await supabase
      .from('full_schedule_view')
      .select(`
        schedule_id,
        course_id,
        week_day,
        start_time,
        end_time,
        room,
        parity,
        group_id,
        group_index,
        weeks,
        group_name,
        course_code,
        course_title,
        course_type,
        teacher_name
      `)
      .eq('group_id', student.group_id)
      .overlaps('weeks', futureWeekNumbers);

    if (futureScheduleError) {
      console.error('Error fetching future schedule:', futureScheduleError);
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch future schedule from database.'
      });
    }

    // 8. Verileri formatla
    const formatSchedule = (data: any[]) => data.map((entry: any) => ({
      scheduleId: entry.schedule_id,
      courseId: entry.course_id,
      courseCode: entry.course_code,
      courseTitle: entry.course_title,
      courseType: entry.course_type || 'LECTURE',
      teacherName: entry.teacher_name || 'N/A',
      weekDay: weekDayToNumber[entry.week_day as WeekDay],
      startTime: entry.start_time,
      endTime: entry.end_time,
      room: entry.room,
      parity: entry.parity,
      groupId: entry.group_id,
      groupName: entry.group_name,
      groupIndex: entry.group_index,
      weeks: entry.weeks
    }));

    return reply.send({
      success: true,
      data: {
        past: formatSchedule(pastScheduleData || []),
        future: formatSchedule(futureScheduleData || [])
      }
    });

  } catch (err) {
    console.error('Unhandled error in getWeeklySchedule:', err);
    return reply.status(500).send({
      success: false,
      message: 'Internal server error.'
    });
  }
};

export const getSummarizedSchedule = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // 1. User authentication
    const user = request.user as User;

    if (!user || user.role.toLowerCase() !== 'student') {
      return reply.status(403).send({
        success: false,
        message: 'Access denied – only students can access schedule.'
      });
    }

    // 2. Get student's group_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('group_id')
      .eq('user_id', user.userId)
      .single();

    if (studentError || !student) {
      return reply.status(404).send({
        success: false,
        message: 'Student record not found.'
      });
    }

    // 3. Get schedule from full_schedule_view
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('full_schedule_view')
      .select(`
        schedule_id,
        course_id,
        course_code,
        course_title,
        course_type,
        teacher_name,
        week_day,
        start_time,
        end_time,
        room,
        parity,
        group_id,
        group_name,
        group_index,
        weeks
      `)
      .eq('group_id', student.group_id);

    if (scheduleError) {
      console.error('Error fetching summarized schedule:', scheduleError);
      return reply.status(500).send({
        success: false,
        message: 'Failed to fetch schedule from database.'
      });
    }

    // 4. Format the data first
    const formattedSchedule = (scheduleData || []).map(entry => {
      // Convert week_day to number safely
      let weekDayNumber: number;
      try {
        weekDayNumber = parseInt(entry.week_day);
        if (isNaN(weekDayNumber)) {
          // If parsing fails, use the weekDayToNumber mapping
          weekDayNumber = weekDayToNumber[entry.week_day as WeekDay] || 1;
        }
      } catch {
        weekDayNumber = 1; // Default to Monday if conversion fails
      }

      return {
        scheduleId: entry.schedule_id,
        courseId: entry.course_id,
        courseCode: entry.course_code,
        courseTitle: entry.course_title,
        courseType: entry.course_type,
        teacherName: entry.teacher_name,
        weekDay: weekDayNumber,
        startTime: entry.start_time,
        endTime: entry.end_time,
        room: entry.room,
        parity: entry.parity,
        groupId: entry.group_id,
        groupName: entry.group_name,
        groupIndex: entry.group_index,
        weeks: entry.weeks
      };
    });

    // 5. Sort the schedule data
    const sortedSchedule = formattedSchedule.sort((a, b) => {
      // First sort by weekday
      if (a.weekDay !== b.weekDay) {
        return a.weekDay - b.weekDay;
      }
      // If same weekday, sort by start time
      return a.startTime.localeCompare(b.startTime);
    });

    return reply.send({
      success: true,
      data: sortedSchedule
    });

  } catch (err) {
    console.error('Unhandled error in getSummarizedSchedule:', err);
    return reply.status(500).send({
      success: false,
      message: 'Internal server error.'
    });
  }
};