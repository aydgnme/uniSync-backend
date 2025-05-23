import { connectToMongoDB } from '../src/database/mongo';
import { Lecture } from '../src/models/lecture.model';
import { Schedule } from '../src/models/schedule.model';
import { Group } from '../src/models/group.model';
import { ILectureDocument } from '../src/models/lecture.model';

export async function generateSchedules() {
  try {
    await connectToMongoDB();
    console.log('✅ Connected to MongoDB');

    const groups = await Group.find();
    console.log(`🔍 Found ${groups.length} groups`);

    await Schedule.deleteMany({});
    console.log('🧹 Cleared existing schedules');

    let totalSchedules = 0;
    let totalLectures = 0;
    let failedGroups = 0;

    for (const group of groups) {
      const groupIdentifier = `${group.specializationShortName}-${group.groupName}${group.subgroupIndex || ''}`;
      console.log(`\n📚 Processing group: ${groupIdentifier}`);

      try {
        const query = {
          facultyId: group.facultyId,
          groupId: group.id,
          groupName: group.groupName,
          specializationShortName: group.specializationShortName,
          ...(group.subgroupIndex ? { subgroupIndex: group.subgroupIndex } : {})
        };

        const lectures = await Lecture.find(query).sort({ weekDay: 1, startTime: 1 });

        if (lectures.length === 0) {
          console.warn(`⚠️ No lectures found for group ${groupIdentifier}`);
          failedGroups++;
          continue;
        }

        console.log(`🔢 Found ${lectures.length} lectures`);
        totalLectures += lectures.length;

        const lecturesByWeekAndParity = lectures.reduce((acc, lecture) => {
          lecture.weeks.forEach(weekNumber => {
            const key = `${weekNumber}-${lecture.parity || 'none'}`;
            if (!acc[key]) {
              acc[key] = {
                weekNumber,
                parity: lecture.parity,
                lectures: []
              };
            }
            acc[key].lectures.push(lecture);
          });
          return acc;
        }, {} as Record<string, { weekNumber: number; parity: string | null; lectures: ILectureDocument[] }>);

        for (const { weekNumber, parity, lectures: weekLectures } of Object.values(lecturesByWeekAndParity)) {
          const scheduleData = {
            facultyId: group.facultyId,
            groupId: group.id,
            groupName: group.groupName,
            subgroupIndex: group.subgroupIndex || '',
            specializationShortName: group.specializationShortName,
            studyYear: group.studyYear,
            isModular: group.isModular,
            weekNumber,
            parity,
            courses: weekLectures.map(lecture => ({
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
            }))
          };

          const scheduleQuery = {
            facultyId: group.facultyId,
            groupId: group.id,
            groupName: group.groupName,
            specializationShortName: group.specializationShortName,
            ...(group.subgroupIndex ? { subgroupIndex: group.subgroupIndex } : {}),
            weekNumber,
            parity
          };

          await Schedule.findOneAndUpdate(
            scheduleQuery,
            scheduleData,
            { upsert: true, new: true }
          );

          totalSchedules++;
        }

        console.log(`✅ Generated schedules for group ${groupIdentifier}`);
      } catch (error) {
        console.error(`❌ Error processing group ${groupIdentifier}:`, error);
        failedGroups++;
        continue;
      }
    }

    console.log(`\n🎉 Finished generating all schedules`);
    console.log(`📊 Summary:`);
    console.log(`   • Total groups processed: ${groups.length}`);
    console.log(`   • Successful groups: ${groups.length - failedGroups}`);
    console.log(`   • Failed groups: ${failedGroups}`);
    console.log(`   • Total lectures processed: ${totalLectures}`);
    console.log(`   • Total schedules generated: ${totalSchedules}`);
    return true;
  } catch (error) {
    console.error('🚨 Fatal error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateSchedules()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
