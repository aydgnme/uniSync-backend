import { connectToMongoDB } from '../src/database/mongo';
import { Group } from '../src/models/group.model';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import dotenv from 'dotenv';

dotenv.config();

const ORAR_API_URL = 'https://orar.usv.ro/orar/vizualizare';

interface OrarGroup {
  id: string;
  type: string;
  facultyId: string;
  groupName: string | null;
  subgroupIndex: string;
  specializationShortName: string;
  studyYear: string;
  isModular: string;
  orarId: string;
}

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

export async function fetchGroups() {
  try {
    await connectToMongoDB();
    console.log('✅ Connected to MongoDB');

    // Fetch groups from Orar API
    const response = await api.get('/data/subgrupe.php?json');
    const groups: OrarGroup[] = response.data;
    console.log(`📊 Total groups from API: ${groups.length}`);

    // Clear existing groups
    await Group.deleteMany({});
    console.log('🧹 Cleared existing groups');

    // Log statistics before filtering
    const stats = {
      total: groups.length,
      byType: {
        type1: groups.filter(g => g.type === '1').length,
        type2: groups.filter(g => g.type === '2').length,
        type3: groups.filter(g => g.type === '3').length,
        other: groups.filter(g => !['1', '2', '3'].includes(g.type)).length
      },
      validOrarId: groups.filter(g => g.orarId !== '0').length,
      validFacultyId: groups.filter(g => g.facultyId !== '0').length,
      validStudyYear: groups.filter(g => g.studyYear !== '0').length,
      validGroupName: groups.filter(g => g.groupName).length,
      validSpecialization: groups.filter(g => g.specializationShortName).length
    };
    console.log('📈 Group statistics:', stats);

    let savedGroups = 0;
    let skippedGroups = 0;

    // Process and save groups
    for (const group of groups) {
      if (group.id !== '0' && group.orarId !== '0' && group.facultyId !== '0' && group.studyYear !== '0') {
        try {
          await Group.updateOne(
            { id: group.id }, // Use id as the primary identifier
            {
              id: group.id,
              facultyId: group.facultyId,
              groupName: group.groupName || '',
              subgroupIndex: group.subgroupIndex || '',
              specializationShortName: group.specializationShortName,
              studyYear: parseInt(group.studyYear),
              isModular: group.isModular === '1',
              orarId: group.orarId
            },
            { upsert: true }
          );
          savedGroups++;
        } catch (error) {
          console.error(`❌ Error saving group ${group.id}:`, error);
          skippedGroups++;
        }
      } else {
        skippedGroups++;
      }
    }

    // Log final statistics
    console.log('\n📊 Final Statistics:');
    console.log(`   • Total groups processed: ${groups.length}`);
    console.log(`   • Groups saved: ${savedGroups}`);
    console.log(`   • Groups skipped: ${skippedGroups}`);

    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error('🚨 Error fetching groups:', error.message);
      if (axios.isAxiosError(error)) {
        console.error('Request details:', {
          url: error.config?.url,
          timeout: error.config?.timeout,
          code: error.code
        });
      }
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fetchGroups()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}