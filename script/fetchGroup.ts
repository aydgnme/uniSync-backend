import { supabase } from '../src/lib/supabase';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

interface Group {
  facultyId: string;
  specializationShortName: string;
  studyYear: string;
  groupName: string;
  subgroupIndex: string | null;
  isModular: string;
}

// Faculty ID mapping table
const facultyIdMap: { [key: string]: string } = {
  '1': '991a53b3-3c8e-40a2-ac6d-358027fd8e54', // Facultatea de Inginerie Electrică şi Ştiinţa Calculatoarelor (FIESC)
  '2': 'ffb9f581-5c1c-4178-87d0-7369c61d9104', // Facultatea de Inginerie Mecanică, Autovehicule şi Robotică (FIMAR)
  '3': '02449d10-2e4f-4185-8cde-4da2ca74e157', // Facultatea de Educaţie Fizică şi Sport (FEFS)
  '4': 'f244eaf0-2cff-40ea-a46c-e56d7fd92409', // Facultatea de Inginerie Alimentară (FIA)
  '5': 'a303f590-5fc2-42f8-8c71-51d3b8295987', // Facultatea de Istorie, Geografie și Științe Sociale (FIG)
  '6': '197a24f5-4466-4282-a81b-90a36980445d', // Facultatea de Litere şi Ştiinţe ale Comunicării (FLSC)
  '7': '057b9885-877c-4ddd-80ca-6b85ad970fc2', // Facultatea de Silvicultură (FS)
  '8': '8be98464-b3c3-45d8-83cc-8ff420eb3d01', // Facultatea de Economie, Administrație și Afaceri (FEAA)
  '9': '670752e3-6069-4eac-939d-2f8fc0dc187a', // Facultatea de Ştiinţe ale Educaţiei (FSE)
  '10': '9b9bba3b-84c7-47a0-a161-8faffa256942', // Facultatea de Drept şi Ştiinţe Administrative (FDSA)
  '20': 'd12ade77-8b51-4a69-aee3-ed267112ebbf', // Departamentul de Specialitate cu Profil Psihopedagogic (DSPP)
  '21': '00330db8-14b8-480d-881e-e039fcb8f509', // Facultatea de Medicină și Științe Biologice (FMSB)
  '22': '65c25b3e-c1f8-43e0-bd7d-bb8d7db6641e'  // Consiliul pentru Studiile Universitare de Doctorat (CSUD)
};

async function main() {
  const response = await fetch('https://orar.usv.ro/orar/vizualizare/data/subgrupe.php?json');
  const groups = await response.json() as Group[];

  const failedGroups: {
    facultyId: string;
    specializationShortName: string;
    studyYear: string;
    groupName: string;
    subgroupIndex: string | null;
    reason: string;
  }[] = [];

  for (const g of groups) {
    const {
      facultyId,
      specializationShortName,
      studyYear,
      groupName,
      subgroupIndex,
      isModular
    } = g;

    // Faculty ID mapping
    const faculty_uuid = facultyIdMap[facultyId];
    if (!faculty_uuid) {
      failedGroups.push({
        facultyId,
        specializationShortName,
        studyYear,
        groupName,
        subgroupIndex,
        reason: `Faculty ID mapping not found: facultyId=${facultyId}`
      });
      continue;
    }

    // Specialization mapping
    const { data: specializationData, error: specializationError } = await supabase
      .from('specializations')
      .select('id')
      .eq('short_name', specializationShortName)
      .eq('faculty_id', faculty_uuid)
      .single();

    if (specializationError || !specializationData) {
      failedGroups.push({
        facultyId,
        specializationShortName,
        studyYear,
        groupName,
        subgroupIndex,
        reason: `Specialization not found: ${specializationShortName} (Faculty: ${faculty_uuid})`
      });
      continue;
    }

    const specialization_uuid = specializationData.id;

    const groupId = uuidv4();
    const name = groupName;
    const subgroup = subgroupIndex || null;
    const semester = 2; // TODO: Zamanla derive edilebilir
    const is_modular = isModular === '1';

    const { error: insertError } = await supabase
      .from('groups')
      .upsert({
        id: groupId,
        faculty_id: faculty_uuid,
        specialization_id: specialization_uuid,
        subgroup,
        study_year: parseInt(studyYear),
        semester,
        is_modular,
        name
      }, {
        onConflict: 'id'
      });

    if (insertError) {
      failedGroups.push({
        facultyId,
        specializationShortName,
        studyYear,
        groupName,
        subgroupIndex,
        reason: `Error adding group: ${insertError.message}`
      });
      continue;
    }

    console.log(`✅ Group added: ${name}${subgroup ? `-${subgroup}` : ''}`);
  }

  // Failed groups report
  if (failedGroups.length > 0) {
    console.log('\n❌ Failed Groups:');
    console.log('=====================');
    
    // Group by faculty
    const groupedByFaculty = failedGroups.reduce((acc, group) => {
      if (!acc[group.facultyId]) {
        acc[group.facultyId] = [];
      }
      acc[group.facultyId].push(group);
      return acc;
    }, {} as { [key: string]: typeof failedGroups });

    // Report for each faculty
    Object.entries(groupedByFaculty).forEach(([facultyId, groups]) => {
      const facultyName = facultyIdMap[facultyId] ? 
        `(${facultyIdMap[facultyId]})` : 
        'Unknown Faculty';
      
      console.log(`\nFaculty ID: ${facultyId} ${facultyName}`);
      console.log('---------------------');
      
      // Group by reason
      const groupedByReason = groups.reduce((acc, group) => {
        if (!acc[group.reason]) {
          acc[group.reason] = [];
        }
        acc[group.reason].push(group);
        return acc;
      }, {} as { [key: string]: typeof groups });

      Object.entries(groupedByReason).forEach(([reason, groups]) => {
        console.log(`\nReason: ${reason}`);
        groups.forEach(group => {
          console.log(`  - ${group.groupName}${group.subgroupIndex ? `-${group.subgroupIndex}` : ''} (${group.specializationShortName}, Year: ${group.studyYear})`);
        });
      });
    });
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});