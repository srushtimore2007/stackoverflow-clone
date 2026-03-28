import { BrevoClient } from '@getbrevo/brevo';
import 'dotenv/config';

// Initialize the Brevo Client once
const brevo = new BrevoClient({ 
  apiKey: process.env.BREVO_API_KEY 
});

/**
 * Sends email using Brevo with proper error handling and logging
 * * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @returns {Promise<boolean>} - True if email sent successfully
 */
export default async function sendEmail(to, subject, html) {
  // Validate required environment variables (Updated names)
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is missing in environment variables');
    return false;
  }

  if (!process.env.BREVO_SENDER_EMAIL) {
    console.error('❌ BREVO_SENDER_EMAIL is missing in environment variables');
    return false;
  }

  // Validate email format (Keeping your logic)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.error(`❌ Invalid email format: ${to}`);
    return false;
  }

  // Brevo v5 Message Object
  const msg = {
    to: [{ email: to }],
    sender: { 
      name: 'Stackoverflow Clone', 
      email: process.env.BREVO_SENDER_EMAIL 
    },
    replyTo: { email: process.env.BREVO_SENDER_EMAIL },
    subject: subject,
    htmlContent: html, // Brevo uses htmlContent instead of html
  };

  try {
    console.log(`📧 Sending email to ${to} via Brevo...`);
    console.log(`📧 From: ${process.env.BREVO_SENDER_EMAIL}`);
    console.log(`📧 Subject: ${subject}`);
    
    // Send email with timeout protection (Keeping your 15s logic)
    await Promise.race([
      brevo.transactionalEmails.sendTransacEmail(msg),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Brevo timeout after 15 seconds')), 15000))
    ]);

    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`📧 Sent at: ${new Date().toISOString()}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    
    // Log detailed Brevo error if available
    if (error.response && error.response.data) {
      console.error('❌ Brevo API Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

/**
 * Test function to verify Brevo configuration
 * @param {string} testEmail - Email to send test to
 * @returns {Promise<boolean>} - Test result
 */
export async function testBrevo(testEmail) {
  console.log('🧪 Testing Brevo configuration...');
  
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Brevo Test</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #0092ff; color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <h2>Brevo Test Successful! 🎉</h2>
        <p>Your Brevo configuration for Stackoverflow Clone is working correctly.</p>
        <p>Test sent at: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(testEmail, 'Brevo Test - Configuration Verified', testHtml);
}