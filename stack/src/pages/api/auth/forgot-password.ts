// pages/api/auth/forgot-password.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import type { ForgotPasswordRequest, ForgotPasswordResponse } from '../../../types/auth.types';

// This file handles the forgot password API endpoint for a Next.js application.
// It accepts a user's email or phone number to initiate a password reset process.
// The flow includes: validating input data, checking if the user exists, rate limiting, 
// generating a new password, updating the user's password in the database,
// and sending the new password via email or SMS to the user.

/* Imports for validation, password generation, user repository, and communication services */
import { detectIdentifierType, maskEmail, maskPhone } from '../../../lib/utils/validation';
import { generatePassword } from '../../../lib/utils/password-generator';
import { UserRepository } from '../../../lib/db/user-repository';
import { EmailService, SMSService } from '../../../lib/utils/email-service';

/**
 * POST /api/auth/forgot-password
 * 
 * Handles forgot password requests with the following flow:
 * 1. Validate input (email or phone)
 * 2. Check if user exists
 * 3. Verify rate limit (once per 24 hours)
 * 4. Generate new password
 * 5. Update password in database
 * 6. Send password via email or SMS
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ForgotPasswordResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST request.',
      error: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    // Parse request body
    const body: ForgotPasswordRequest = req.body;
    const { identifier, identifierType } = body;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 1: Input Validation
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email or phone number',
        error: 'MISSING_IDENTIFIER',
      });
    }

    // Auto-detect identifier type if not provided
    const detectedType = identifierType || detectIdentifierType(identifier);
    
    if (!detectedType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or phone number format',
        error: 'INVALID_IDENTIFIER_FORMAT',
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 2: Find User in Database
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    let user;
    
    if (detectedType === 'email') {
      user = await UserRepository.findByEmail(identifier.toLowerCase().trim());
    } else {
      // Normalize phone number (remove spaces, dashes, etc.)
      const normalizedPhone = identifier.replace(/[\s\-\(\)]/g, '');
      user = await UserRepository.findByPhone(normalizedPhone);
    }

    // Security: Don't reveal if user exists or not (timing-safe response)
    // However, for UX, we'll provide feedback. Adjust based on security requirements.
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email or phone number',
        error: 'USER_NOT_FOUND',
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 3: Rate Limiting Check (Once per 24 hours)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const resetCheck = await UserRepository.canResetPassword(user);
    
    if (!resetCheck.canReset) {
      return res.status(429).json({
        success: false,
        message: 'You can use the forgot password option only once per day. Please try again later.',
        error: 'RATE_LIMIT_EXCEEDED',
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 4: Generate New Password
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    const newPassword = generatePassword();
    
    console.log('═══════════════════════════════════════════════════');
    console.log('🔐 PASSWORD RESET REQUEST');
    console.log('═══════════════════════════════════════════════════');
    console.log(`User ID: ${user.id}`);
    console.log(`Identifier Type: ${detectedType}`);
    console.log(`Generated Password: ${newPassword}`);
    console.log('═══════════════════════════════════════════════════');

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 5: Update Password in Database
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    await UserRepository.updatePassword(user.id, newPassword);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Step 6: Send Password via Email or SMS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    let sendSuccess = false;
    let maskedIdentifier = '';

    if (detectedType === 'email') {
      sendSuccess = await EmailService.sendPasswordResetEmail(user.email!, newPassword);
      maskedIdentifier = maskEmail(user.email!);
    } else {
      sendSuccess = await SMSService.sendPasswordResetSMS(user.phone!, newPassword);
      maskedIdentifier = maskPhone(user.phone!);
    }

    if (!sendSuccess) {
      // Password was updated but notification failed
      return res.status(500).json({
        success: false,
        message: 'Password was reset but we could not send the notification. Please contact support.',
        error: 'NOTIFICATION_FAILED',
      });
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Success Response
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    return res.status(200).json({
      success: true,
      message: `Password reset successful! A new password has been sent to ${maskedIdentifier}`,
      data: {
        sentTo: maskedIdentifier,
        method: detectedType === 'email' ? 'email' : 'sms',
      },
    });

  } catch (error) {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Error Handling
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    console.error('[ForgotPassword API] Error:', error);

    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      error: 'INTERNAL_SERVER_ERROR',
    });
  }
}
