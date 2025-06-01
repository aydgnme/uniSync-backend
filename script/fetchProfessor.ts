import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../src/lib/supabase'; // own path
import dotenv from 'dotenv';
dotenv.config();

interface Teacher {
  id: string;
  lastName: string;
  firstName: string;
  emailAddress: string;
  phoneNumber: string;
  facultyName: string;
  departmentName: string;
}

async function getFacultyIdByName(facultyName: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('faculties')
    .select('id')
    .ilike('name', facultyName)
    .single();

  if (error || !data) {
    console.warn(`❌ Faculty not found: ${facultyName}`);
    return null;
  }

  return data.id;
}

async function main() {
  const response = await fetch('https://orar.usv.ro/orar/vizualizare/data/cadre.php?json');
  const teachers = (await response.json()) as Teacher[];

  let insertedCount = 0;
  const failed: { teacher: Teacher; reason: string }[] = [];

  for (const teacher of teachers) {
    const {
      firstName,
      lastName,
      emailAddress,
      phoneNumber,
      facultyName,
      departmentName
    } = teacher;

    if (!firstName || !lastName) {
      failed.push({ teacher, reason: 'First name or last name missing' });
      continue;
    }

    // Mail adresi yoksa oluştur
    const email = emailAddress || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@usm.ro`;

    const faculty_id = await getFacultyIdByName(facultyName);
    if (!faculty_id) {
      failed.push({ teacher, reason: 'Faculty mapping not found' });
      continue;
    }

    // Aynı kullanıcı zaten var mı?
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing && !existingError) {
      console.log(`⏭️  Already registered: ${firstName} ${lastName}`);
      continue;
    }

    // Yeni kullanıcı oluştur
    const user_id = uuidv4();
    const { error: insertUserError } = await supabase.from('users').insert({
      id: user_id,
      first_name: firstName,
      last_name: lastName,
      email: email,
      password_hash: '', // ilk girişte şifre ayarlanacak
      role: 'staff',
      phone_number: phoneNumber || null,
      is_active: true
    });

    if (insertUserError) {
      failed.push({ teacher, reason: `User could not be added: ${insertUserError.message}` });
      continue;
    }

    // Staff tablosuna ekle
    const { error: insertStaffError } = await supabase.from('staff').upsert({
      user_id,
      faculty_id,
      title: null, // API'den gelmiyor, istenirse eklenebilir
      department: departmentName
    }, {
      onConflict: 'user_id'
    });

    if (insertStaffError) {
      failed.push({ teacher, reason: `Staff could not be added: ${insertStaffError.message}` });
      continue;
    }

    console.log(`✅ Added: ${firstName} ${lastName} (${email})`);
    insertedCount++;
  }

  console.log(`\nTotal faculty members added: ${insertedCount}`);
  if (failed.length > 0) {
    console.log('\n❌ Failed Records:');
    failed.forEach(f => {
      console.log(`- ${f.teacher.firstName} ${f.teacher.lastName}: ${f.reason}`);
    });
  }
}

main().catch(err => {
  console.error('🚨 Global error:', err);
  process.exit(1);
});