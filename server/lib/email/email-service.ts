// src/lib/email/email-service.ts

import { sendEmail } from '../../utils/sendEmail.js';
import { sendSMS } from '../../utils/sendSMS.js';

/**
 * Email Service - Handles sending emails
 * 
 * Note: This is a placeholder implementation. In production, integrate with
 * email providers like SendGrid, AWS SES, Resend, or NodeMailer.
 */
export class EmailService {
  /**
   * Sends password reset email with the new generated password
   * 
   * @param to - Recipient email address
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

      // Send real email using Nodemailer utility
      const success = await sendEmail(to, subject, html);
      
      if (!success) {
        console.error('[EmailService] Email service returned false');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[EmailService] Failed to send email:', error);
      return false;
    }
  }

  /**
   * Generates HTML template for password reset email
   * 
   * @param newPassword - The new password to include in email
   * @returns HTML string for email body
   */
  private static getPasswordResetEmailTemplate(newPassword: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .password-box {
              background-color: #fff;
              border: 2px solid #4F46E5;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              letter-spacing: 2px;
              color: #4F46E5;
            }
            .warning {
              background-color: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #6B7280;
              font-size: 12px;
              margin-top: 30px;
            }
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
              <div class="password-box">
                ${newPassword}
              </div>
              
              <div class="warning">
                <h3 style="margin-top: 0;">⚠️ Important Security Notice</h3>
                <ul style="margin-bottom: 0;">
                  <li>Please log in using this password immediately</li>
                  <li>Change your password after logging in for security</li>
                  <li>Do not share this password with anyone</li>
                  <li>If you did not request this reset, contact support immediately</li>
                </ul>
              </div>
              
              <p>This password is valid immediately and you can use it to access your account.</p>
              
              <p>Best regards,<br>Your App Security Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

/**
 * SMS Service - Handles sending SMS messages
 * 
 * Note: This is a placeholder implementation. In production, integrate with
 * SMS providers like Twilio, AWS SNS, or Vonage.
 */
export class SMSService {
  /**
   * Sends password reset SMS with the new generated password
   * 
   * @param to - Recipient phone number
   * @param newPassword - The generated password to send
   * @returns Promise<boolean> - True if SMS sent successfully
   */
  static async sendPasswordResetSMS(
    to: string,
    newPassword: string
  ): Promise<boolean> {
    try {
      const message = `Your new password is: ${newPassword}. Please login and change it immediately.`;

      // Send real SMS using Twilio utility
      const success = await sendSMS(to, message);
      
      if (!success) {
        console.error('[SMSService] SMS service returned false');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[SMSService] Failed to send SMS:', error);
      return false;
    }
  }
}