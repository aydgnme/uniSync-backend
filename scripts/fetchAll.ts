import { fetchFaculties } from './fetchFaculties';
import { fetchGroups } from './fetchGroups';
import { fetchLectures } from './fetchLectures';
import { generateSchedules } from './generateSchedules';

async function fetchAll() {
  try {
    console.log('Starting data fetch process...');

    // Fetch faculties
    console.log('\nFetching faculties...');
    await fetchFaculties();
    console.log('Faculties fetched successfully');

    // Fetch groups
    console.log('\nFetching groups...');
    await fetchGroups();
    console.log('Groups fetched successfully');

    // Fetch lectures
    console.log('\nFetching lectures...');
    await fetchLectures();
    console.log('Lectures fetched successfully');

    // Generate schedules
    console.log('\nGenerating schedules...');
    await generateSchedules();
    console.log('Schedules generated successfully');

    console.log('\nAll data fetched and processed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error in fetchAll:', error);
    process.exit(1);
  }
}

fetchAll();
