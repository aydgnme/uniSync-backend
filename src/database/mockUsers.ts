import { User } from '../interfaces/user.interface';

export const users: User[] = [
  {
    id: '1',
    email: 'mert.aydogan@student.usv.ro',
    password: '$2a$10$abc...', // bcrypt ile hashlenmeli
    cnp: '5011019412345',
    matriculationNumber: '68159',
    name: 'Mert Aydogan',
    role: 'Student',
    phone: '07401234567',
    address: 'Str. Universitatii nr. 1, Suceava',
    academicInfo: {
      program: 'Computer Science',
      semester: 8,
      groupName: '3141',
      subgroupIndex: 'a',
      studentId: '68159',
      advisor: 'Prof. Dr. Ing. Schipor Ovidiu-Andrei',
      gpa: 7.75
    }
  }
];