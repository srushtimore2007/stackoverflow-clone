// lib/utils/validation.ts

/**
 * Validates email format using regex
 * 
 * @param email - Email string to validate
 * @returns True if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number format
 * Accepts formats like: +1234567890, 1234567890, +1-234-567-8900
 * 
 * @param phone - Phone number string to validate
 * @returns True if phone is valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  // Remove common formatting characters
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if it's a valid phone number (10-15 digits, optional + prefix)
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(cleanedPhone);
}

/**
 * Determines if identifier is email or phone
 * 
 * @param identifier - The user input (email or phone)
 * @returns 'email', 'phone', or null if invalid
 */
export function detectIdentifierType(identifier: string): 'email' | 'phone' | null {
  if (isValidEmail(identifier)) {
    return 'email';
  }
  
  if (isValidPhone(identifier)) {
    return 'phone';
  }
  
  return null;
}

/**
 * Masks email for privacy
 * Example: john.doe@example.com → j***e@example.com
 * 
 * @param email - Email to mask
 * @returns Masked email string
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  
  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  
  return `${firstChar}***${lastChar}@${domain}`;
}

/**
 * Masks phone number for privacy
 * Example: +1234567890 → +123***7890
 * 
 * @param phone - Phone number to mask
 * @returns Masked phone string
 */
export function maskPhone(phone: string): string {
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleanedPhone.length <= 6) {
    return cleanedPhone.substring(0, 3) + '***';
  }
  
  const firstPart = cleanedPhone.substring(0, 3);
  const lastPart = cleanedPhone.substring(cleanedPhone.length - 4);
  
  return `${firstPart}***${lastPart}`;
}
