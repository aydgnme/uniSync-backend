import { FastifyReply, FastifyRequest } from 'fastify';
import { supabase } from '../lib/supabase';

interface GetProfessorsByFacultyParams {
  facultyId: string;
}

interface ProfessorResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  title?: string;
  isActive: boolean;
}

interface StaffWithUser {
  user_id: string;
  faculty_id: string;
  department: string;
  title: string;
  users: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    is_active: boolean;
  };
}

export const getAllProfessorsByFacultyId = async (
  request: FastifyRequest<{ Params: GetProfessorsByFacultyParams }>,
  reply: FastifyReply
) => {
  try {
    const { facultyId } = request.params;

    if (!facultyId) {
      return reply.code(400).send({
        success: false,
        message: 'Faculty ID is required'
      });
    }

    const { data: professors, error } = await supabase
      .from('staff')
      .select(`
        user_id,
        faculty_id,
        department,
        title,
        users (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          is_active
        )
      `)
      .eq('faculty_id', facultyId);

    if (error) {
      console.error('Error fetching faculty members:', error);
      return reply.code(500).send({
        success: false,
        message: 'An error occurred while fetching faculty members'
      });
    }

    // Veriyi düzenle
    const formattedProfessors = (professors as unknown as StaffWithUser[]).map(prof => ({
      id: prof.user_id,
      firstName: prof.users.first_name,
      lastName: prof.users.last_name,
      email: prof.users.email,
      phoneNumber: prof.users.phone_number,
      department: prof.department,
      title: prof.title,
      isActive: prof.users.is_active
    }));

    return reply.code(200).send({
      success: true,
      data: formattedProfessors
    });

  } catch (error) {
    console.error('Error fetching faculty members:', error);
    return reply.code(500).send({
      success: false,
      message: 'An error occurred while fetching faculty members'
    });
  }
}; 