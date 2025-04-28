import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runScript(scriptName: string) {
  console.log(`🚀 Running ${scriptName}...`);
  try {
    const { stdout, stderr } = await execAsync(`ts-node scripts/${scriptName}`);
    if (stderr) console.error(`⚠️ Warning in ${scriptName}:`, stderr);
    console.log(`✅ ${scriptName} completed successfully`);
  } catch (error) {
    console.error(`❌ Error in ${scriptName}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Run scripts in sequence
    await runScript('fetchFaculties.ts');
    await runScript('fetchGroups.ts');
    await runScript('fetchSchedules.ts');

    console.log('🎉 All scripts completed successfully!');
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

main();
