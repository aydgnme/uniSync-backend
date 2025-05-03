import { User } from '../src/models/user.model';
import { Lecture } from '../src/models/lecture.model';
import { CourseGrade } from '../src/models/course-grade.model';
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/university-portal-v1';

async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

function generateRandomGrade(min: number = 1, max: number = 10): number {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

async function generateGrades() {
  try {
    console.log('🧹 Clearing existing schedules...');
    await CourseGrade.deleteMany({});

    // Get all students
    const students = await User.find({ role: 'Student' });
    console.log(`Found ${students.length} students`);

    // For each student
    for (const student of students) {
      const { academicInfo } = student;
      const { semester, groupName, subgroupIndex } = academicInfo;

      // Find student's lectures
      const lectures = await Lecture.find({
        group: groupName,
        subgroup: subgroupIndex
      });

      // Create grade for each lecture
      for (const lecture of lectures) {
        // Check if grade already exists for this course
        const existingGrade = await CourseGrade.findOne({
          studentId: student.matriculationNumber,
          code: lecture.code,
          semester: semester,
          academicYear: '2024-2025'
        });

        // Skip if grade already exists
        if (existingGrade) {
          console.log(`ℹ️ Skipping duplicate grade for student ${student.name} in ${lecture.code}`);
          continue;
        }

        const midtermGrade = generateRandomGrade(3, 10);
        const finalGrade = generateRandomGrade(3, 10);
        const totalGrade = +(midtermGrade * 0.4 + finalGrade * 0.6).toFixed(2);
        const status = totalGrade >= 5 ? 'Passed' : 'Failed';

        // Create grade record
        const grade = new CourseGrade({
          code: lecture.code,
          title: lecture.title,
          instructor: lecture.teacher,
          semester: semester,
          academicYear: '2024-2025',
          credits: 6,
          midtermGrade,
          finalGrade,
          totalGrade,
          status,
          studentId: student.matriculationNumber
        });

        await grade.save();
        console.log(`✅ Created grade for student ${student.name} in ${lecture.code}`);
      }
    }

    console.log('🎉 All grades generated successfully!');
  } catch (error) {
    console.error('❌ Error generating grades:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

connectToMongoDB().then(generateGrades); 