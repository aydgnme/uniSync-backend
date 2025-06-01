export function getCurrentWeekDay(): number {
  const now = new Date();
  const day = now.getDay();
  return day === 0 ? 7 : day; // Sunday 0 → 7
}

export function getWeekNumber(): number {
  const now = new Date();
  const onejan = new Date(now.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((now.getTime() - onejan.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
}

export function getCurrentParity(): "EVEN" | "ODD" {
  const weekNumber = getWeekNumber();
  return weekNumber % 2 === 0 ? "EVEN" : "ODD";
}
