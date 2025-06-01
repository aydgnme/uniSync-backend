import { User, AcademicInfo } from '../interfaces/user.interface';

interface BackendUserResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone_number: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  created_at?: string;
  last_login?: string;
  is_active?: boolean;
  students?: {
    cnp?: string;
    matriculation_number?: string;
    advisor?: string;
    is_modular?: boolean;
    gpa?: number;
    group_id?: string;
    faculty_id?: string;
    groups?: {
      name?: string;
      subgroup?: string;
      semester?: number;
      study_year?: number;
      specialization_id?: string;
      is_modular?: boolean;
      specializations?: {
        name?: string;
        short_name?: string;
      }[];
    }[];
  }[];
}

export const mapUserResponse = (userResponse: any) => {
  return {
    id: userResponse.user_id,
    name: `${userResponse.first_name} ${userResponse.last_name}`.trim(),
    email: userResponse.email,
    role: (userResponse.role || 'Student').charAt(0).toUpperCase() + userResponse.role.slice(1).toLowerCase(),
    phone: userResponse.phone_number || '',
    cnp: userResponse.cnp || '',
    matriculationNumber: userResponse.matriculation_number || '',
    address: '', // SQL'de yok, boş bırakıldı
    academicInfo: {
      program: userResponse.specialization_name || '',
      specializationShortName: userResponse.specialization_short_name || '',
      semester: userResponse.semester || 1,
      studyYear: userResponse.study_year || 1,
      groupName: userResponse.group_name || '',
      subgroupIndex: userResponse.subgroup_index || '',
      studentId: userResponse.matriculation_number || '',
      advisor: userResponse.advisor || '',
      gpa: userResponse.gpa || 0,
      specializationId: userResponse.specialization_id || ''
    }
  };
}; 