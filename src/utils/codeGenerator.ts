/**
 * Generates a random numeric code of specified length
 * @param length - The length of the code to generate
 * @returns A string containing random digits
 */
export function generateRandomCode(length: number): string {
  const characters = '0123456789';
  return Array.from(
    { length },
    () => characters.charAt(Math.floor(Math.random() * characters.length))
  ).join('');
} 