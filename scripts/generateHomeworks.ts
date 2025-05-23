import { connectToMongoDB } from '../src/database/mongo';
import { Lecture } from '../src/models/lecture.model';
import { Homework } from '../src/models/homework.model';
import dayjs from 'dayjs';

interface HomeworkTemplate {
  title: string;
  description: string;
  dueDateOffset: number; // Days from now
}

const homeworkTemplates: Record<string, HomeworkTemplate[]> = {
  'PAWEB': [
    {
      title: 'Todo Application with React',
      description: 'Develop a Todo application using React. Should include basic CRUD operations.',
      dueDateOffset: 7
    },
    {
      title: 'Node.js API Development',
      description: 'Develop a REST API using Express.js. Should integrate with MongoDB.',
      dueDateOffset: 14
    },
    {
      title: 'Full Stack Web Application',
      description: 'Develop a comprehensive web application with React frontend and Node.js backend.',
      dueDateOffset: 21
    }
  ],
  'MDI': [
    {
      title: 'Database Design',
      description: 'Design a database schema for an e-commerce system.',
      dueDateOffset: 7
    },
    {
      title: 'SQL Queries',
      description: 'Write complex SQL queries on the given database schema.',
      dueDateOffset: 14
    },
    {
      title: 'Data Modeling Project',
      description: 'Design and implement a data model for a real-world problem.',
      dueDateOffset: 21
    }
  ]
};

interface GenerationStats {
  totalLectures: number;
  processedLectures: number;
  createdHomeworks: number;
  skippedLectures: number;
  errors: Array<{
    lectureCode: string;
    error: string;
  }>;
}

async function generateHomeworks() {
  const stats: GenerationStats = {
    totalLectures: 0,
    processedLectures: 0,
    createdHomeworks: 0,
    skippedLectures: 0,
    errors: []
  };

  try {
    console.log('🚀 Starting homework generation process...');
    
    // Connect to MongoDB
    await connectToMongoDB();
    console.log('✅ MongoDB connection successful');

    // Get all lectures
    const lectures = await Lecture.find();
    stats.totalLectures = lectures.length;
    console.log(`📚 Found ${lectures.length} lectures`);

    // Generate homeworks for each lecture
    for (const lecture of lectures) {
      try {
        const templates = homeworkTemplates[lecture.code] || [];
        
        if (templates.length === 0) {
          console.log(`⚠️ No templates found for lecture: ${lecture.code}`);
          stats.skippedLectures++;
          continue;
        }

        console.log(`\n📝 Generating homeworks for ${lecture.code} - ${lecture.groupName}${lecture.subgroupIndex}...`);

        // Create homeworks for each template
        for (const template of templates) {
          const dueDate = dayjs().add(template.dueDateOffset, 'day').toDate();

          try {
            const homework = await Homework.create({
              lecture: lecture._id,
              lectureCode: lecture.code,
              groupId: lecture.groupId,
              groupName: lecture.groupName,
              subgroupIndex: lecture.subgroupIndex,
              studyYear: lecture.studyYear,
              title: template.title,
              description: template.description,
              dueDate,
              status: 'pending'
            });

            console.log(`✅ Created homework: ${template.title}`);
            stats.createdHomeworks++;
          } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error occurred';
            console.error(`❌ Error creating homework for ${lecture.code}:`, errorMessage);
            stats.errors.push({
              lectureCode: lecture.code,
              error: errorMessage
            });
          }
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error occurred';
        console.error(`❌ Error processing lecture ${lecture.code}:`, errorMessage);
        stats.errors.push({
          lectureCode: lecture.code,
          error: errorMessage
        });
      } finally {
        stats.processedLectures++;
      }
    }

    // Show statistics
    console.log('\n📊 Homework Generation Summary:');
    console.log(`📚 Total Lectures: ${stats.totalLectures}`);
    console.log(`✅ Processed Lectures: ${stats.processedLectures}`);
    console.log(`📝 Created Homeworks: ${stats.createdHomeworks}`);
    console.log(`⚠️ Skipped Lectures: ${stats.skippedLectures}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach(({ lectureCode, error }) => {
        console.log(`- ${lectureCode}: ${error}`);
      });
    }

    console.log('\n🎉 Process completed successfully');
    process.exit(0);
  } catch (error: any) {
    const errorMessage = error?.message || 'Unknown error occurred';
    console.error('❌ Critical error:', errorMessage);
    process.exit(1);
  }
}

// Run the script
generateHomeworks(); 