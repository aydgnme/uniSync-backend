import { db } from '../database/firebase';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

export async function registerUser(body: any): Promise<User> {
  const hashedPassword = await bcrypt.hash(body.password, 10);

  const newUser: User = {
    id: uuidv4(),
    email: body.email,
    password: hashedPassword,
    cnp: body.cnp,
    matriculationNumber: body.matriculationNumber,
    name: body.name,
    role: 'Student',
    phone: body.phone || '',
    address: body.address || '',
    academicInfo: {
      program: body.program || 'Computer Science',
      semester: body.semester || 8,
      groupName: body.groupName || '3141',
      subgroupIndex: body.subgroupIndex || 'a',
      studentId: body.matriculationNumber,
      advisor: body.advisor || 'Unknown',
      gpa: body.gpa || 0
    }
  };

  await db.collection('users').doc(newUser.id).set(newUser);
  return newUser;
}
