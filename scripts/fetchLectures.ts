// src/scripts/fetchLectures.ts
import axios, { AxiosError } from 'axios';
import { connectToMongoDB } from '../src/database/mongo';
import { Group, Lecture } from '../src/models';
import axiosRetry from 'axios-retry';

const ORAR_API_URL = 'https://orar.usv.ro/orar/vizualizare';

// Create axios instance with timeout
const api = axios.create({
  timeout: 10000, // 10 seconds timeout
  baseURL: ORAR_API_URL
});

// Configure retry behavior
axiosRetry(api, { 
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ETIMEDOUT';
  }
});

function mapType(typeShortName: string): 'LECTURE' | 'LAB' | 'SEMINAR' {
  switch (typeShortName) {
    case 'curs': return 'LECTURE';
    case 'lab': return 'LAB';
    case 'sem': return 'SEMINAR';
    case 'pr': return 'SEMINAR'; // proiect is also a type of seminar
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
  if (!otherInfo) return generateWeeksFromParity(parity);

  // Try to parse dates like "03.03" or "15.04"
  const dateRegex = /(\d{2})\.(\d{2})/g;
  const dates = [...otherInfo.matchAll(dateRegex)];
  
  if (dates.length > 0) {
    // Convert dates to week numbers (assuming semester starts in February)
    return dates.map(([_, day, month]) => {
      const date = new Date(2024, parseInt(month) - 1, parseInt(day));
      const startDate = new Date(2024, 1, 1); // February 1st
      const weekDiff = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weekDiff + 1;
    });
  }

  const rangeRegex = /S(\d+)-S(\d+)/i;
  const singleRegex = /S(\d+)/i;

  if (rangeRegex.test(otherInfo)) {
    const match = rangeRegex.exec(otherInfo);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        const weeks: number[] = [];
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

export async function fetchLectures() {
  try {
    console.log('🚀 Starting lecture fetching process...');
    
    // Connect to MongoDB
    await connectToMongoDB();
    console.log('✅ MongoDB connection successful');

    const groups = await Group.find();
    console.log(`📊 Found ${groups.length} groups in database`);

    // Clear existing lectures
    await Lecture.deleteMany({});
    console.log('🧹 Cleared existing lectures');

    let totalLectures = 0;
    let processedGroups = 0;
    let failedGroups = 0;
    let failedLectures = 0;

    for (const group of groups) {
      try {
        console.log(`\n📚 Processing group: ${group.groupName}${group.subgroupIndex} (${++processedGroups}/${groups.length})`);
        
        // Add required parameters for the API
        const params = new URLSearchParams({
          mod: 'grupa',
          ID: group.id,
          json: '1',
          an: '2023-2024',
          sem: '2'
        });

        const response = await api.get(`/orar-grupe.php?${params.toString()}`);
        
        if (!response.data || !Array.isArray(response.data)) {
          console.error(`❌ Invalid response format for group ${group.groupName}${group.subgroupIndex}:`, response.data);
          failedGroups++;
          continue;
        }

        const [scheduleEntries, groupInfo] = response.data;

        if (!Array.isArray(scheduleEntries)) {
          console.error(`❌ No schedule entries found for group ${group.groupName}${group.subgroupIndex}`);
          failedGroups++;
          continue;
        }

        console.log(`📝 Found ${scheduleEntries.length} entries for group ${group.groupName}${group.subgroupIndex}`);
        
        for (const entry of scheduleEntries) {
          try {
            if (!entry.weekDay || isNaN(parseInt(entry.weekDay, 10))) {
              console.warn(`⚠️ Skipping invalid entry for group ${group.groupName}${group.subgroupIndex}:`, entry);
              failedLectures++;
              continue;
            }

            const parityMapped = mapParity(entry.parity);
            const weeks = parseWeeks(entry.otherInfo ?? '', parityMapped);

            if (weeks.length === 0) {
              console.warn(`⚠️ No weeks found for entry ${entry.topicShortName} in group ${group.groupName}${group.subgroupIndex}`);
              failedLectures++;
              continue;
            }

            const lectureData = {
              facultyId: group.facultyId,
              groupId: group.id,
              groupName: group.groupName,
              subgroupIndex: group.subgroupIndex,
              code: entry.topicShortName,
              title: entry.topicLongName,
              type: mapType(entry.typeShortName),
              room: entry.roomShortName || '',
              teacher: formatTeacher(entry.teacherLastName, entry.teacherFirstName),
              teacherInfo: {
                lastName: entry.teacherLastName,
                firstName: entry.teacherFirstName
              },
              weekDay: parseInt(entry.weekDay, 10),
              startTime: formatStartHour(entry.startHour),
              endTime: formatStartHour((parseInt(entry.startHour, 10) + parseInt(entry.duration, 10)).toString()),
              duration: parseInt(entry.duration, 10),
              weeks: weeks,
              parity: parityMapped,
              specializationShortName: group.specializationShortName,
              studyYear: group.studyYear
            };

            await Lecture.updateOne(
              {
                groupId: lectureData.groupId,
                groupName: lectureData.groupName,
                subgroupIndex: lectureData.subgroupIndex,
                weekDay: lectureData.weekDay,
                startTime: lectureData.startTime,
                code: lectureData.code,
                type: lectureData.type,
              },
              lectureData,
              { upsert: true }
            );
            totalLectures++;
            
            if (totalLectures % 100 === 0) {
              console.log(`✅ Processed ${totalLectures} lectures so far...`);
            }
          } catch (error) {
            console.error(`❌ Error processing lecture for group ${group.groupName}${group.subgroupIndex}:`, error);
            failedLectures++;
          }
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(`❌ API Error for group ${group.groupName}${group.subgroupIndex}:`, {
            message: error.message,
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data
          });
        } else {
          console.error(`❌ Error fetching lectures for group ${group.groupName}${group.subgroupIndex}:`, error);
        }
        failedGroups++;
      }
    }

    console.log(`\n🎉 Finished generating all schedules`);
    console.log(`📊 Summary:`);
    console.log(`   • Total groups processed: ${groups.length}`);
    console.log(`   • Successful groups: ${groups.length - failedGroups}`);
    console.log(`   • Failed groups: ${failedGroups}`);
    console.log(`   • Total lectures processed: ${totalLectures}`);
    console.log(`   • Failed lectures: ${failedLectures}`);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error('🚨 Error fetching lectures:', error.message);
      if (axios.isAxiosError(error)) {
        console.error('Request details:', {
          url: error.config?.url,
          timeout: error.config?.timeout,
          code: error.code,
          status: error.response?.status,
          data: error.response?.data
        });
      }
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fetchLectures()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}