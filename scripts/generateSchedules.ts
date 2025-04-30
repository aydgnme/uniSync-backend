import { Schedule, Lecture } from '../src/models';
import mongoose from 'mongoose';
import { connectToMongoDB } from "../src/database/mongo";

function calculateEndTime(startHour: string, durationMinutes: number): string {
  const [hours, minutes] = startHour.split(':').map(Number);
  const startDate = new Date(0, 0, 0, hours, minutes);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return endDate.toTimeString().slice(0, 5);
}

export const generateSchedules = async () => {
  try {
    await connectToMongoDB();
    console.log('🧹 Clearing existing schedules...');
    await Schedule.deleteMany({});

    const lectures = await Lecture.find().lean();
    const scheduleMap = new Map<string, any>();

    let skippedLectures = 0;
    let totalLecturesChecked = 0;

    for (let week = 1; week <= 14; week++) {
      const weekLectures = lectures.filter((lecture) => {
        const weeks = lecture.weeks?.length ? lecture.weeks : Array.from({ length: 14 }, (_, i) => i + 1);
        return weeks.includes(week);
      });

      for (const lecture of weekLectures) {
        totalLecturesChecked++;

        if (!lecture.room || lecture.room.trim() === '') {
          console.warn(`⚠️ Skipping lecture (missing room): ${lecture.code} (${lecture.title})`);
          skippedLectures++;
          continue;
        }
        if (!lecture.teacher || lecture.teacher.trim() === '') {
          console.warn(`⚠️ Skipping lecture (missing teacher): ${lecture.code} (${lecture.title})`);
          skippedLectures++;
          continue;
        }
        if (!lecture.subgroup || lecture.subgroup.trim() === '') {
          console.warn(`⚠️ Skipping lecture (missing subgroup): ${lecture.code} (${lecture.title})`);
          skippedLectures++;
          continue;
        }

        const key = `${lecture.group}_${lecture.subgroup}_${week}`;

        if (!scheduleMap.has(key)) {
          scheduleMap.set(key, {
            group: lecture.group,
            subgroup: lecture.subgroup,
            weekNumber: week,
            courses: [],
          });
        }

        const schedule = scheduleMap.get(key);

        schedule.courses.push({
          code: lecture.code,
          title: lecture.title,
          type: lecture.type,
          startTime: lecture.startHour,
          endTime: calculateEndTime(lecture.startHour, lecture.duration),
          duration: lecture.duration,
          room: lecture.room,
          teacher: lecture.teacher,
          weekDay: lecture.weekDay,
        });
      }
    }

    const schedulesArray = Array.from(scheduleMap.values());

    // 🔥 Sort courses by weekDay (1 to 7) before inserting
    schedulesArray.forEach(schedule => {
      schedule.courses.sort((a: any, b: any) => a.weekDay - b.weekDay);
    });

    if (schedulesArray.length > 0) {
      await Schedule.insertMany(schedulesArray);
      console.log(`✅ ${schedulesArray.length} schedules inserted successfully!`);
    } else {
      console.log('⚠️ No schedules to insert.');
    }

    const successRate = (((totalLecturesChecked - skippedLectures) / totalLecturesChecked) * 100).toFixed(2);

    console.log('--- 📊 Statistics ---');
    console.log(`🔹 Total lectures checked: ${totalLecturesChecked}`);
    console.log(`🔹 Lectures skipped (missing fields): ${skippedLectures}`);
    console.log(`🔹 Lectures successfully used: ${totalLecturesChecked - skippedLectures}`);
    console.log(`🔹 Success rate: ${successRate}%`);
    console.log('----------------------');

    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  } catch (err) {
    console.error('❌ Error generating schedules:', err);
    await mongoose.disconnect();
  }
};

generateSchedules();
