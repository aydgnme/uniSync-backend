import axios from 'axios';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000/api/users';

const allGroups = [
  '3111', '3112', '3113', '3114',
  '3121', '3122', '3123', '3124',
  '3131', '3132', '3133',
  '3141', '3142', '3143'
];

function generatePhoneNumber(): string {
    const prefix = '+407';
    const number = faker.string.numeric(8);
    return `${prefix}${number}`;
}

function calculateSemester(groupName: string): number {
  // Get year from group number (3rd digit)
  const yearDigit = parseInt(groupName[2]);
  
  // Calculate semester based on year (2 semesters per year)
  return yearDigit * 2;
}

async function registerStudent(index: number) {
  const groupName = allGroups[index % allGroups.length];
  const year = new Date().getFullYear().toString().slice(-2);
  const matriculationNumber = `${year}${(30000 + index).toString().padStart(5, '0')}`;

  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.usv.ro`;

  const student = {
    email,
    password: 'Student@123!',
    confirmPassword: 'Student@123!',
    cnp: faker.string.numeric(13),
    matriculationNumber,
    name: `${firstName} ${lastName}`,
    role: 'Student',
    phone: generatePhoneNumber(),
    address: faker.location.streetAddress(),
    academicInfo: {
      program: 'Computer Science',
      semester: calculateSemester(groupName),
      groupName,
      subgroupIndex: faker.helpers.arrayElement(['a', 'b']),
      studentId: matriculationNumber,
      advisor: `Prof. Dr. ${faker.person.fullName()}`,
      gpa: parseFloat((Math.random() * 3 + 6).toFixed(2))
    }
  };

  try {
    const response = await axios.post(BASE_URL, student);
    console.log(`✅ Registered: ${email} (${matriculationNumber}) in group ${groupName} - Semester ${student.academicInfo.semester}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed: ${email}`, error.response?.data || error.message);
    return false;
  }
}

async function main() {
  const numberOfStudents = 100;
  let successCount = 0;
  
  for (let i = 0; i < numberOfStudents; i++) {
    const success = await registerStudent(i);
    if (success) successCount++;
    // Add a short delay between each registration
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`🎓 Finished registering students. Success: ${successCount}/${numberOfStudents}`);
}

main().catch(console.error);