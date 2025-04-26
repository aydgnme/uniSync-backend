// Returns the current weekday (1: Monday, 2: Tuesday, ...)
export function getCurrentWeekday(): number {
  const today = new Date();
  const day = today.getDay();
  return day === 0 ? 7 : day; // Sunday is returned as 7
}

// Returns whether the current week is odd or even
export function getCurrentParity(): 'i' | 'p' | '-' {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((today.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  
  return weekNumber % 2 === 0 ? 'p' : 'i'; // p: even (pair), i: odd (impair)
}
  