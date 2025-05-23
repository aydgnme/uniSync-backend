//Delete all information on schedules

import { connectToMongoDB } from '../src/database/mongo';
import { Schedule } from '../src/models/schedule.model';
import { Lecture } from '../src/models/lecture.model';

async function deleteSchedule() {
  try {
    await connectToMongoDB();
    console.log('Connected to MongoDB');

    // Delete all schedules and lectures
    await Promise.all([
      Schedule.deleteMany({}),
      Lecture.deleteMany({})
    ]);

    console.log('Successfully deleted all schedules and lectures');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteSchedule();