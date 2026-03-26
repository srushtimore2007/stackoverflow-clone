// src/lib/utils/password-generator.ts

/**
 * Generates a random password containing only uppercase and lowercase letters
 * 
 * Requirements:
 * - Length: 8-12 characters
 * - Only letters (A-Z, a-z)
 * - No numbers or special characters
 * 
 * @returns A randomly generated password string
 */
export function generatePassword(): string {
  // Define character sets
  const uppercaseLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseLetters = 'abcdefghijklmnopqrstuvwxyz';
  const allLetters = uppercaseLetters + lowercaseLetters;
  
  // Random length between 8 and 12
  const length = Math.floor(Math.random() * 5) + 8; // 8 to 12
  
  let password = '';
  
  // Ensure at least one uppercase and one lowercase letter
  password += uppercaseLetters[Math.floor(Math.random() * uppercaseLetters.length)];
  password += lowercaseLetters[Math.floor(Math.random() * lowercaseLetters.length)];
  
  // Fill the rest with random letters
  for (let i = 2; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allLetters.length);
    password += allLetters[randomIndex];
  }
  
  // Shuffle the password to randomize positions
  password = shuffleString(password);
  
  return password;
}

/**
 * Shuffles a string randomly using Fisher-Yates algorithm
 * 
 * @param str - The string to shuffle
 * @returns Shuffled string
 */
function shuffleString(str: string): string {
  const array = str.split('');
  
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array.join('');
}

/**
 * Validates if a password meets the requirements
 * (Useful for testing the generator)
 * 
 * @param password - Password to validate
 * @returns True if password is valid, false otherwise
 */
export function validateGeneratedPassword(password: string): boolean {
  // Check length
  if (password.length < 8 || password.length > 12) {
    return false;
  }
  
  // Check that it only contains letters
  const onlyLettersRegex = /^[a-zA-Z]+$/;
  if (!onlyLettersRegex.test(password)) {
    return false;
  }
  
  // Check for at least one uppercase and one lowercase
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  
  return hasUppercase && hasLowercase;
}