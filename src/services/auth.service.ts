import { getFirestore } from '../database/firebase';
import { IUser, IAcademicInfo } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

export async function registerUser(body: any): Promise<IUser> {
  const db = getFirestore();
  const hashedPassword = await bcrypt.hash(body.password, 10);

  const academicInfo: IAcademicInfo = {
    program: body.academicInfo?.program || 'Computer Science',
    semester: body.academicInfo?.semester || 8,
    groupName: body.academicInfo?.groupName || '3141',
    subgroupIndex: body.academicInfo?.subgroupIndex || 'a',
    studentId: body.matriculationNumber,
    advisor: body.academicInfo?.advisor || 'Unknown',
    gpa: body.academicInfo?.gpa || 0,
    facultyId: body.academicInfo?.facultyId || '',
    specializationShortName: body.academicInfo?.specializationShortName || '',
    studyYear: body.academicInfo?.studyYear || 4,
    groupId: body.academicInfo?.groupId || '',
    isModular: body.academicInfo?.isModular || false
  };

  const newUser: IUser = {
    _id: uuidv4(),
    email: body.email,
    password: hashedPassword,
    cnp: body.cnp,
    matriculationNumber: body.matriculationNumber,
    name: body.name,
    role: 'Student',
    phone: body.phone || '',
    address: body.address || '',
    academicInfo
  };

  await db.collection('users').doc(newUser._id).set(newUser);
  return newUser;
}
