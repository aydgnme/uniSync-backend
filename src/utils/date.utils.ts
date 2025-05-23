export const getCurrentWeekNumber = (): number => {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), 8, 1); // September 1st
  const diffTime = Math.abs(today.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
};

export const getCurrentMonth = (): number => {
  return new Date().getMonth() + 1;
};

export const getCurrentDay = () => {
  const today = new Date();
  const day = today.getDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  return {
    day,
    dayName: dayNames[day],
    weekNumber: getCurrentWeekNumber()
  };
}; 