// src/lib/email/email-service.ts

// 1. Ensure this path points to your new Brevo-powered utility
import sendEmail from '../../utils/sendEmail.js'; 
import { sendSMS } from '../../utils/sendSMS.js';

/**
 * Email Service - Handles sending emails
 * * Note: This uses Brevo (formerly Sendinblue) for email delivery.
 */
export class EmailService {
  /**
   * Sends password reset email with the new generated password
   * * @param to - Recipient email address
   * @param newPassword - The generated password to send
   * @returns Promise<boolean> - True if email sent successfully
   */
  static async sendPasswordResetEmail(
    to: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const subject = 'Your Password Has Been Reset';
      const html = this.getPasswordResetEmailTemplate(newPassword);

      // 2. This now calls your Brevo utility automatically!
      const success = await sendEmail(to, subject, html);
      
      if (!success) {
        console.error('[EmailService] Brevo service returned false');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email via Brevo:', error);
      return false;
    }
  }

  /**
   * Generates HTML template for password reset email
   */
  private static getPasswordResetEmailTemplate(newPassword: string): string {
    // ... (Your HTML Template remains exactly the same)
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .password-box { background-color: #fff; border: 2px solid #4F46E5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #4F46E5; }
            .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; color: #6B7280; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Successful</h1>
            </div>
            <div class="content">
              <p>Dear User,</p>
              <p>Your password has been successfully reset as requested.</p>
              <p><strong>Your new password is:</strong></p>
              <div class="password-box">${newPassword}</div>
              <div class="warning">
                <h3 style="margin-top: 0;">⚠️ Important Security Notice</h3>
                <ul>
                  <li>Please log in using this password immediately</li>
                  <li>Change your password after logging in</li>
                </ul>
              </div>
              <p>Best regards,<br>Stackoverflow Clone Security Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// ... SMSService remains the same