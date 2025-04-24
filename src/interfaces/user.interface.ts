export interface AcademicInfo {
    program: string;
    semester: number;
    groupName: string;
    subgroupIndex: string;
    studentId: string;
    advisor: string;
    gpa: number;
  }
  
  export interface User {
    id: string;
    email: string;
    password: string;
    cnp: string;
    matriculationNumber: string;
    name: string;
    role: 'Student' | 'Teacher' | 'Admin';
    phone: string;
    address: string;
    academicInfo: AcademicInfo;
    resetCode?: string;
    resetCodeExpiry?: number;
  }
  