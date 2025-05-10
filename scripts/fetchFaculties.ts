import axios from 'axios';
import { Faculty } from '../src/models';
import { connectToMongoDB } from '../src/database/mongo';

async function fetchFaculties() {
  await connectToMongoDB();
  const response = await axios.get('https://orar.usv.ro/orar/vizualizare/data/facultati.php?json');
  const faculties = response.data;

  // Clear existing faculties
  await Faculty.deleteMany({});
  console.log('Cleared existing faculties.');
  console.log(`Fetched ${faculties.length} faculties from the API.`);
  

  for (const faculty of faculties) {
    if (faculty.id !== '0') {
      await Faculty.updateOne({ id: faculty.id }, faculty, { upsert: true });
    }
  }

  console.log('Faculties fetched and saved.');
  process.exit(0);
}

fetchFaculties();