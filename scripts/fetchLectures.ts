// src/scripts/fetchLectures.ts
import axios from 'axios';
import { connectToMongoDB } from '../src/database/mongo';
import { Group, Lecture } from '../src/models';

function mapType(typeShortName: string): 'LECTURE' | 'LAB' | 'SEMINAR' {
  switch (typeShortName) {
    case 'curs': return 'LECTURE';
    case 'lab': return 'LAB';
    case 'sem': return 'SEMINAR';
    default: return 'LECTURE';
  }
}

function mapParity(parity: string): 'ODD' | 'EVEN' | 'ALL' {
  switch (parity) {
    case 'i': return 'ODD';
    case 'p': return 'EVEN';
    default: return 'ALL';
  }
}

function formatStartHour(minutes: string): string {
  const mins = parseInt(minutes, 10);
  const hours = Math.floor(mins / 60);
  const minutesLeft = mins % 60;
  return `${hours.toString().padStart(2, '0')}:${minutesLeft.toString().padStart(2, '0')}`;
}

function formatTeacher(lastName: string, firstName: string): string {
  if (!firstName) return lastName;
  const firstInitial = firstName.split(' ')[0]?.[0] ?? '';
  return `${lastName} ${firstInitial}.`;
}

function generateWeeksFromParity(parity: 'ALL' | 'EVEN' | 'ODD'): number[] {
  if (parity === 'ALL') return Array.from({ length: 14 }, (_, i) => i + 1);
  if (parity === 'EVEN') return [2, 4, 6, 8, 10, 12, 14];
  if (parity === 'ODD') return [1, 3, 5, 7, 9, 11, 13];
  return [];
}

function parseWeeks(otherInfo: string, parity: 'ALL' | 'EVEN' | 'ODD'): number[] {
  const rangeRegex = /S(\d+)-S(\d+)/i;
  const singleRegex = /S(\d+)/i;

  if (rangeRegex.test(otherInfo)) {
    const match = rangeRegex.exec(otherInfo);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        const weeks = [];
        for (let i = start; i <= end; i++) {
          weeks.push(i);
        }
        return weeks;
      }
    }
  } else if (singleRegex.test(otherInfo)) {
    const match = singleRegex.exec(otherInfo);
    if (match) {
      const week = parseInt(match[1], 10);
      if (!isNaN(week)) {
        return [week];
      }
    }
  }

  return generateWeeksFromParity(parity);
}

async function fetchLectures() {
  await connectToMongoDB();
  const groups = await Group.find();

  // Clear existing lectures
  await Lecture.deleteMany({});
  console.log('Cleared existing lectures.');
  console.log(`Fetched ${groups.length} groups from the database.`);

  for (const group of groups) {
    try {
      const response = await axios.get(`https://orar.usv.ro/orar/vizualizare//orar-grupe.php?mod=grupa&ID=${group.id}&json`);
      const scheduleEntries = response.data[0];

      if (Array.isArray(scheduleEntries)) {
        for (const entry of scheduleEntries) {
          if (!entry.weekDay || isNaN(parseInt(entry.weekDay, 10))) {
            console.warn(`⚠️ Skipping invalid entry for group ${group.specializationShortName}${group.groupName}${group.subgroupIndex}`);
            continue;
          }

          const parityMapped = mapParity(entry.parity);

          const lectureData = {
            code: entry.topicShortName,
            title: entry.topicLongName,
            type: mapType(entry.typeShortName),
            room: entry.roomShortName || '',
            teacher: formatTeacher(entry.teacherLastName, entry.teacherFirstName),
            weekDay: parseInt(entry.weekDay, 10),
            startHour: formatStartHour(entry.startHour),
            duration: parseInt(entry.duration, 10),
            weeks: parseWeeks(entry.otherInfo ?? '', parityMapped),
            parity: parityMapped,
            group: group.groupName,
            subgroup: group.subgroupIndex || '',
            groupId: group._id, 
          };

          await Lecture.updateOne(
            {
              group: lectureData.group,
              subgroup: lectureData.subgroup,
              weekDay: lectureData.weekDay,
              startHour: lectureData.startHour,
              code: lectureData.code,
              type: lectureData.type,
            },
            lectureData,
            { upsert: true }
          );
        }
      }
    } catch (error: any) {
      console.error(`❌ Error fetching lectures for group ${group.groupName}${group.subgroupIndex}:`, error.message);
    }
  }

  console.log('✅ All lectures fetched and saved.');
  process.exit(0);
}

fetchLectures();
