import { connectToMongoDB } from '../src/database/mongo';
import { Faculty } from '../src/models/faculty.model';
import axios from 'axios';

const ORAR_API_URL = 'https://orar.usv.ro/orar/vizualizare';

interface OrarFaculty {
  id: string;
  longName: string;
  shortName: string;
}

export async function fetchFaculties() {
  try {
    await connectToMongoDB();
    console.log('Connected to MongoDB');

    // Fetch faculties from Orar API
    const response = await axios.get(`${ORAR_API_URL}/data/facultati.php?json`);
    const faculties: OrarFaculty[] = response.data;

    console.log('API Response:', JSON.stringify(faculties, null, 2));

    // Clear existing faculties
    await Faculty.deleteMany({});
    console.log('Cleared existing faculties');

    // Insert new faculties
    const facultyData = faculties
      .filter(faculty => faculty.id !== '0' && faculty.shortName && faculty.longName)
      .map(faculty => ({
        id: faculty.id,
        longName: faculty.longName.trim(),
        shortName: faculty.shortName.trim()
      }));

    if (facultyData.length === 0) {
      throw new Error('No valid faculty data found in API response');
    }

    await Faculty.insertMany(facultyData);
    console.log(`Inserted ${facultyData.length} faculties`);

    return facultyData;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fetchFaculties()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}