import axios from 'axios';
import { Group } from '../src/models';
import { connectToMongoDB } from '../src/database/mongo';

async function fetchGroups() {
  await connectToMongoDB();
  const response = await axios.get('https://orar.usv.ro/orar/vizualizare/data/subgrupe.php?json');
  const groups = response.data;

  for (const group of groups) {
    if (group.id !== '0') {
      await Group.updateOne({ id: group.id }, {
        id: group.id,
        facultyId: group.facultyId,
        specializationShortName: group.specializationShortName,
        studyYear: parseInt(group.studyYear),
        groupName: group.groupName || '',
        subgroupIndex: group.subgroupIndex || '',
        isModular: group.isModular === '1',
        orarId: group.orarId,
      }, { upsert: true });
    }
  }

  console.log('Groups fetched and saved.');
  process.exit(0);
}

fetchGroups();