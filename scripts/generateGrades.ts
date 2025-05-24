import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/user.model';
import { Schedule } from '../src/models/schedule.model';
import { CourseGrade, ICourseGradeDocument } from '../src/models/course-grade.model';
import { Lecture } from '../src/models/lecture.model';

dotenv.config();

interface GradeWeights {
  midterm: number;
  final: number;
  homework: number;
  attendance: number;
  project?: number;
}

interface Course {
  id: string;
  title: string;
  type: string;
  academicYear: string;
  semester: number;
  scheduleId: string;
}

interface Grades {
  midtermGrade: number;
  finalGrade: number;
  homeworkGrade: number;
  attendanceGrade: number;
}

const DEFAULT_GRADE_WEIGHTS: GradeWeights = {
  midterm: 0.3,
  final: 0.4,
  homework: 0.2,
  attendance: 0.1
};

async function generateGrades() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/usv-portal');
    console.log('✅ MongoDB connection successful');

    const students = await User.find({ 
      role: 'Student',
      'academicInfo.facultyId': { $exists: true },
      'academicInfo.groupName': { $exists: true },
      'academicInfo.specializationShortName': { $exists: true },
      'academicInfo.studyYear': { $exists: true }
    }).lean();

    console.log(`👩‍🎓 ${students.length} students found`);

    for (const student of students) {
      try {
        await processStudentGrades(student);
      } catch (error) {
        console.error(`❌ Error processing student ${student._id}:`, error);
        continue;
      }
    }

    const count = await CourseGrade.countDocuments();
    console.log(`\n📊 Total grades in database: ${count}`);
  } catch (error) {
    console.error('❌ Error generating grades:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🛑 Disconnected from MongoDB');
  }
}

async function processStudentGrades(student: any) {
  const { facultyId, groupName, specializationShortName, studyYear, semester } = student.academicInfo;

  const schedules = await Schedule.find({
    facultyId,
    groupName,
    specializationShortName,
    studyYear
  }).lean();

  if (!schedules.length) {
    console.log(`⚠️ No schedules found for student ${student._id}`);
    return;
  }

  const courses = extractUniqueCourses(schedules, student.academicInfo);
  const created: string[] = [];
  const updated: string[] = [];

  for (const course of courses) {
    try {
      const lecture = await Lecture.findById(course.id);
      if (!lecture) {
        console.log(`⚠️ Lecture not found: ${course.id}`);
        continue;
      }

      const weights: GradeWeights = {
        midterm: lecture.evaluationWeight?.midterm || DEFAULT_GRADE_WEIGHTS.midterm,
        final: lecture.evaluationWeight?.final || DEFAULT_GRADE_WEIGHTS.final,
        homework: lecture.evaluationWeight?.homework || DEFAULT_GRADE_WEIGHTS.homework,
        attendance: lecture.evaluationWeight?.attendance || DEFAULT_GRADE_WEIGHTS.attendance,
        project: lecture.evaluationWeight?.project
      };

      const grades = generateGradesWithWeights(weights);
      const totalGrade = calculateTotalGrade(grades, weights);
      const status = totalGrade >= 5 ? 'PASSED' : 'FAILED';

      const existing = await CourseGrade.findOne({
        studentId: student._id,
        lectureId: course.id,
        academicYear: "2024-2025",
        semester: course.semester
      });

      if (existing && existing._id) {
        await updateExistingGrade(existing._id.toString(), grades, totalGrade, status);
        updated.push(course.title);
      } else {
        await createNewGrade(student._id.toString(), course, grades, totalGrade, status);
        created.push(course.title);
      }
    } catch (error) {
      console.error(`❌ Error processing course ${course.id}:`, error);
      continue;
    }
  }

  logStudentProgress(student._id.toString(), created, updated);
}

function extractUniqueCourses(schedules: any[], academicInfo: any): Course[] {
  const flatCourses = schedules.flatMap(s => s.courses.map((course: any) => ({
    ...course,
    scheduleId: s._id,
    academicYear: "2024-2025",
    semester: academicInfo.semester || 1
  })));

  return Array.from(new Map(flatCourses.map(course => [course.id, course])).values())
    .filter(course => ['LECTURE', 'SEMINAR'].includes(course.type));
}

function generateGradesWithWeights(weights: GradeWeights): Grades {
  return {
    midtermGrade: randomGrade(),
    finalGrade: randomGrade(),
    homeworkGrade: randomGrade(),
    attendanceGrade: randomGrade()
  };
}

function calculateTotalGrade(grades: Grades, weights: GradeWeights): number {
  const { midtermGrade, finalGrade, homeworkGrade, attendanceGrade } = grades;
  const total = (
    midtermGrade * weights.midterm +
    finalGrade * weights.final +
    homeworkGrade * weights.homework +
    attendanceGrade * weights.attendance
  );
  return Math.round(total * 10) / 10;
}

async function updateExistingGrade(gradeId: string, grades: Grades, totalGrade: number, status: string) {
  await CourseGrade.updateOne(
    { _id: gradeId },
    {
      $set: {
        ...grades,
        totalGrade,
        status,
        lastUpdated: new Date()
      }
    }
  );
}

async function createNewGrade(studentId: string, course: Course, grades: Grades, totalGrade: number, status: string) {
  await CourseGrade.create({
    studentId,
    lectureId: course.id,
    academicYear: "2024-2025",
    semester: course.semester,
    ...grades,
    totalGrade,
    status,
    retakeCount: 0,
    lastUpdated: new Date()
  });
}

function logStudentProgress(studentId: string, created: string[], updated: string[]) {
  if (created.length) {
    console.log(`✅ Student ${studentId} - Created: ${[...new Set(created)].join(', ')}`);
  }
  if (updated.length) {
    console.log(`🔁 Student ${studentId} - Updated: ${[...new Set(updated)].join(', ')}`);
  }
}

function randomGrade(): number {
  return Math.floor(Math.random() * 10) + 1;
}

generateGrades();