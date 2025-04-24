import axios from 'axios';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000/auth/register';

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

async function registerStudent(index: number) {
  const groupName = allGroups[index % allGroups.length];

  const firstName = faker.person.firstName().toLowerCase();
  const lastName = faker.person.lastName().toLowerCase();
  const email = `${firstName}.${lastName}@student.usv.ro`;

  const student = {
    email,
    password: 'Student@123',
    cnp: faker.string.numeric(13),
    matriculationNumber: (10000 + index).toString(),
    name: `${firstName} ${lastName}`,
    role: 'Student',
    phone: generatePhoneNumber(),
    address: faker.location.streetAddress(),
    academicInfo: {
      program: 'Computer Science',
      semester: faker.number.int({ min: 1, max: 8 }),
      groupName,
      subgroupIndex: faker.helpers.arrayElement(['a', 'b']),
      studentId: (10000 + index).toString(),
      advisor: `Prof. Dr. ${faker.person.fullName()}`,
      gpa: parseFloat((Math.random() * 3 + 6).toFixed(2))
    }
  };

  try {
    const response = await axios.post(BASE_URL, student);
    console.log(`✅ Registered: ${email} in group ${groupName}`);
  } catch (error: any) {
    console.error(`❌ Failed: ${email}`, error.response?.data || error.message);
  }
}


async function registerMany(count: number) {
  const promises = Array.from({ length: count }, (_, i) => registerStudent(i + 1));
  await Promise.all(promises);
  console.log(`🎓 Finished registering ${count} students.`);
}

registerMany(1000);