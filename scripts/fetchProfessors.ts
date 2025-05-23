import { connectToMongoDB } from '../src/database/mongo';
import { Professor } from '../src/models/professor.model';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface OrarProfessor {
  id: string;
  lastName: string;
  firstName: string;
  position?: string;
  phd?: string;
  otherTitle?: string;
  facultyId: string;
}

export async function fetchProfessors() {
  try {
    await connectToMongoDB();
    console.log('Connected to MongoDB');

    // Fetch professors from Orar API
    const response = await axios.get(`${process.env.ORAR_API_URL}/professors`);
    const professors: OrarProfessor[] = response.data;

    // Clear existing professors
    await Professor.deleteMany({});
    console.log('Cleared existing professors');

    // Insert new professors
    const professorData = professors.map(professor => ({
      professorId: professor.id,
      lastName: professor.lastName,
      firstName: professor.firstName,
      position: professor.position,
      phd: professor.phd,
      otherTitle: professor.otherTitle,
      facultyId: professor.facultyId
    }));

    await Professor.insertMany(professorData);
    console.log(`Inserted ${professorData.length} professors`);

    return professorData;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fetchProfessors()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
