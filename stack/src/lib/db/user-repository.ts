// lib/db/user-repository.ts

import bcrypt from 'bcryptjs';
import type { User, PasswordResetResult } from '../../types/auth.types';

/**
 * User Repository - Handles all database operations related to users
 * 
 * Note: This is a placeholder implementation. In production, replace with
 * actual database queries using Prisma, Drizzle, or your preferred ORM.
 */
export class UserRepository {
  /**
   * Finds a user by email
   * 
   * @param email - User's email address
   * @returns User object or null if not found
   */
  static async findByEmail(email: string): Promise<User | null> {
    // TODO: Replace with actual database query
    // Example with Prisma:
    // return await prisma.user.findUnique({ where: { email } });
    
    console.log(`[DB] Looking up user by email: ${email}`);
    return null; // Placeholder
  }

  /**
   * Finds a user by phone number
   * 
   * @param phone - User's phone number
   * @returns User object or null if not found
   */
  static async findByPhone(phone: string): Promise<User | null> {
    // TODO: Replace with actual database query
    // Example with Prisma:
    // return await prisma.user.findUnique({ where: { phone } });
    
    console.log(`[DB] Looking up user by phone: ${phone}`);
    return null; // Placeholder
  }

  /**
   * Checks if user can reset password (rate limiting)
   * Returns user if reset is allowed, or remaining hours if blocked
   * 
   * @param user - User object to check
   * @returns PasswordResetResult with canReset flag and user data
   */
  static async canResetPassword(user: User): Promise<PasswordResetResult> {
    // If user has never reset password, allow it
    if (!user.lastPasswordResetAt) {
      return {
        canReset: true,
        user,
      };
    }

    // Calculate time difference
    const now = new Date();
    const lastReset = new Date(user.lastPasswordResetAt);
    const hoursSinceLastReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
    
    // Check if 24 hours have passed
    if (hoursSinceLastReset >= 24) {
      return {
        canReset: true,
        user,
      };
    }

    // Calculate remaining hours
    const remainingHours = Math.ceil(24 - hoursSinceLastReset);
    
    return {
      canReset: false,
      remainingHours,
    };
  }

  /**
   * Updates user's password and reset timestamp
   * 
   * @param userId - User's unique identifier
   * @param plainPassword - Plain text password (will be hashed)
   * @returns Updated user object
   */
  static async updatePassword(userId: string, plainPassword: string): Promise<User> {
    // Hash the password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    // TODO: Replace with actual database update
    // Example with Prisma:
    // return await prisma.user.update({
    //   where: { id: userId },
    //   data: {
    //     password: hashedPassword,
    //     lastPasswordResetAt: new Date(),
    //     updatedAt: new Date(),
    //   },
    // });
    
    console.log(`[DB] Updating password for user: ${userId}`);
    console.log(`[DB] New hashed password: ${hashedPassword.substring(0, 20)}...`);
    console.log(`[DB] Updated lastPasswordResetAt: ${new Date().toISOString()}`);
    
    // Placeholder return
    return {
      id: userId,
      password: hashedPassword,
      lastPasswordResetAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
