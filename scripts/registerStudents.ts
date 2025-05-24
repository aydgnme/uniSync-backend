import { connectToMongoDB } from '../src/database/mongo';
import { faker } from '@faker-js/faker';
import { User } from '../src/models/user.model';
import { logger } from '../src/utils/logger';
import bcrypt from 'bcryptjs';

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

  try {
    // Check if student already exists
    const existingStudent = await User.findOne({ email });
    if (existingStudent) {
      logger.info(`Student ${email} already exists, skipping...`);
      return true;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Student@123!', salt);

    const student = new User({
      email,
      password: hashedPassword,
      cnp: faker.string.numeric(13),
      matriculationNumber,
      name: `${firstName} ${lastName}`,
      role: 'STUDENT',
      phone: generatePhoneNumber(),
      address: faker.location.streetAddress(),
      academicInfo: {
        program: 'Computer Science',
        semester: calculateSemester(groupName),
        groupName,
        subgroupIndex: faker.helpers.arrayElement(['a', 'b']),
        studentId: matriculationNumber,
        advisor: `Prof. Dr. ${faker.person.fullName()}`,
        gpa: parseFloat((Math.random() * 3 + 6).toFixed(2)),
        studyYear: parseInt(groupName[2]),
        isModular: false
      }
    });

    await student.save();
    logger.info(`✅ Registered: ${email} (${matriculationNumber}) in group ${groupName} - Semester ${student.academicInfo.semester}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed: ${email}`, error);
    return false;
  }
}

async function main() {
  try {
    await connectToMongoDB();
    logger.info('Connected to MongoDB');

    const numberOfStudents = 100;
    let successCount = 0;
    
    for (let i = 0; i < numberOfStudents; i++) {
      const success = await registerStudent(i);
      if (success) successCount++;
      // Add a short delay between each registration
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    logger.info(`🎓 Finished registering students. Success: ${successCount}/${numberOfStudents}`);
  } catch (error) {
    logger.error('Error registering students:', error);
  } finally {
    process.exit(0);
  }
}

main();