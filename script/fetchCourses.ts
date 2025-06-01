import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../src/lib/supabase'; // own path
import dotenv from 'dotenv';
dotenv.config();

interface RawCourse {
  id: string;
  topicShortName: string;
  topicLongName: string;
  typeShortName: string;
  teacherID: string;
}

interface CourseGroupMap {
  [key: string]: string[];
}

async function getTeacherIdFromMap(teacherID: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('staff')
    .select('user_id')
    .eq('user_id', teacherID)
    .single();

  if (error || !data) {
    console.warn(`❌ Teacher not matched: ${teacherID}`);
    return null;
  }

  return data.user_id;
}

async function getFacultyIdByCode(code: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('faculties')
    .select('id')
    .ilike('short_name', `%${code}%`)
    .single();

  if (error || !data) {
    console.warn(`❌ Faculty mapping not found: ${code}`);
    return null;
  }

  return data.id;
}

async function main() {
  const groupId = 49; // hardcoded grup id
  const response = await fetch(`https://orar.usv.ro/orar/vizualizare//orar-grupe.php?mod=grupa&ID=${groupId}&json`);
  const [activities, groupMap] = await response.json() as [RawCourse[], CourseGroupMap];

  const inserted: string[] = [];
  const failed: { activity: RawCourse; reason: string }[] = [];

  for (const activity of activities) {
    const code = activity.topicShortName || 'UNKNOWN';
    const title = activity.topicLongName || 'Unknown';
    const type = activity.typeShortName === 'lab' ? 'LAB' : 'LECTURE';
    const teacher_id = await getTeacherIdFromMap(activity.teacherID);

    if (!teacher_id) {
      failed.push({ activity, reason: 'Teacher not found' });
      continue;
    }

    const courseGroups = groupMap[activity.id];
    if (!courseGroups || courseGroups.length < 2) {
      failed.push({ activity, reason: 'Group or faculty information missing' });
      continue;
    }

    const groupName = courseGroups[0];
    const facultyInfo = courseGroups[1];
    const facultyShortCode = facultyInfo.split(',')[0];
    const faculty_id = await getFacultyIdByCode(facultyShortCode);

    if (!faculty_id) {
      failed.push({ activity, reason: 'Faculty not found' });
      continue;
    }

    const academic_year = '2024-2025';

    const { data: existingCourse, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('code', code)
      .eq('title', title)
      .eq('faculty_id', faculty_id)
      .eq('teacher_id', teacher_id)
      .eq('academic_year', academic_year)
      .maybeSingle();

    if (existingCourse) {
      console.log(`⏭️  Already registered: ${code} - ${title}`);
      continue;
    }

    const course_id = uuidv4();
    const { error: insertCourseError } = await supabase.from('courses').insert({
      id: course_id,
      code,
      title,
      type,
      faculty_id,
      academic_year,
      teacher_id
    });

    if (insertCourseError) {
      failed.push({ activity, reason: `Course could not be added: ${insertCourseError.message}` });
      continue;
    }

    console.log(`✅ Added: ${title} (${code})`);
    inserted.push(code);
  }

  console.log(`\nTotal courses added: ${inserted.length}`);
  if (failed.length > 0) {
    console.log('\n❌ Failed records:');
    failed.forEach(f => {
      console.log(`- ${f.activity.topicShortName} ${f.activity.topicLongName}: ${f.reason}`);
    });
  }
}

main().catch(err => {
  console.error('🚨 Global error:', err);
  process.exit(1);
});