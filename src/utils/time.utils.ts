import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);

export function getWeekNumber() {
  return dayjs().week();
}

export function getAcademicWeekNumber(): number {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;

  let week = 0;

  if (currentMonth === 2 && currentDay >= 17 && currentDay <= 23) {
    week = 1;
  }
  if ((currentMonth === 2 && currentDay >= 24) || (currentMonth === 3 && currentDay <= 2)) {
    week = 2;
  }
  if (currentMonth === 3 && currentDay >= 3 && currentDay <= 9) {
    week = 3;
  }
  if (currentMonth === 3 && currentDay >= 10 && currentDay <= 16) {
    week = 4;
  }
  if (currentMonth === 3 && currentDay >= 17 && currentDay <= 23) {
    week = 5;
  }
  if (currentMonth === 3 && currentDay >= 24 && currentDay <= 30) {
    week = 6;
  }
  if ((currentMonth === 3 && currentDay >= 31) || (currentMonth === 4 && currentDay <= 6)) {
    week = 7;
  }
  if (currentMonth === 4 && currentDay >= 7 && currentDay <= 13) {
    week = 8;
  }
  if (currentMonth === 4 && currentDay >= 14 && currentDay <= 20) {
    week = 9;
  }
  if (currentMonth === 5 && currentDay >= 5 && currentDay <= 11) {
    week = 10;
  }
  if (currentMonth === 5 && currentDay >= 12 && currentDay <= 18) {
    week = 11;
  }
  if (currentMonth === 5 && currentDay >= 19 && currentDay <= 25) {
    week = 12;
  }
  if ((currentMonth === 5 && currentDay >= 26) || (currentMonth === 6 && currentDay <= 1)) {
    week = 13;
  }
  if (currentMonth === 6 && currentDay >= 2 && currentDay <= 8) {
    week = 14;
  }

  return 5;
}

export function getParity(weekNumber: number): 'ODD' | 'EVEN' {
  return weekNumber % 2 === 0 ? 'EVEN' : 'ODD';
}

export function calculateEndTime(startHour: string, duration: number): string {
  const [hour, minute] = startHour.split(':').map(Number);
  const start = new Date();
  start.setHours(hour);
  start.setMinutes(minute);
  const end = new Date(start.getTime() + duration * 60000);
  return end.toTimeString().slice(0, 5);
}
