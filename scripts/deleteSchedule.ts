//Delete all information on schedules

import axios from 'axios';
import { Schedule } from '../src/models';
import { connectToMongoDB } from '../src/database/mongo';

async function deleteSchedules() {
  await connectToMongoDB();
  console.log('🧹 Deleting all schedules...');
  await Schedule.deleteMany({});
  console.log('✅ All schedules deleted.');
  process.exit(0);
}

deleteSchedules();