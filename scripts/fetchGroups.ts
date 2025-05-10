import axios, { AxiosError } from 'axios';
import { Group } from '../src/models';
import { connectToMongoDB } from '../src/database/mongo';
import axiosRetry from 'axios-retry';

const api = axios.create({
  timeout: 10000, // 10 seconds timeout
});

// Configure retry behavior
axiosRetry(api, { 
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.code === 'ETIMEDOUT';
  }
});

async function fetchGroups() {
  try {
    await connectToMongoDB();
    const response = await api.get('https://orar.usv.ro/orar/vizualizare/data/subgrupe.php?json');
    const groups = response.data;

    for (const group of groups) {
      if (group.id !== '0') {
        await Group.updateOne({ id: group.id }, {
          id: group.id,
          facultyId: group.facultyId,
          specializationShortName: group.specializationShortName,
          studyYear: parseInt(group.studyYear),
          groupName: group.groupName || '',
          subgroupIndex: group.subgroupIndex || '',
          isModular: group.isModular === '1',
          orarId: group.orarId,
        }, { upsert: true });
      }
    }

    console.log('Groups fetched and saved.');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching groups:', error.message);
      if (axios.isAxiosError(error)) {
        console.error('Request details:', {
          url: error.config?.url,
          timeout: error.config?.timeout,
          code: error.code
        });
      }
    }
    process.exit(1);
  }
  process.exit(0);
}

fetchGroups();