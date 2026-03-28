import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends email using SendGrid with proper error handling and logging
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @returns {Promise<boolean>} - True if email sent successfully
 */
export default async function sendEmail(to, subject, html) {
  // Validate required environment variables
  if (!process.env.SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY is missing in environment variables');
    return false;
  }

  if (!process.env.SENDGRID_SENDER_EMAIL) {
    console.error('❌ SENDGRID_SENDER_EMAIL is missing in environment variables');
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.error(`❌ Invalid email format: ${to}`);
    return false;
  }

  const msg = {
    to: to,                                    // user email
    from: process.env.SENDGRID_SENDER_EMAIL,   // verified SendGrid sender
    replyTo: process.env.SENDGRID_SENDER_EMAIL, // reply-to address
    subject: subject,
    html: html,
  };

  try {
    console.log(`📧 Sending email to ${to} via SendGrid...`);
    console.log(`📧 From: ${process.env.SENDGRID_SENDER_EMAIL}`);
    console.log(`📧 Subject: ${subject}`);
    
    // Send email with timeout protection (15 seconds)
    await Promise.race([
      sgMail.send(msg),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SendGrid timeout after 15 seconds')), 15000))
    ]);

    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`📧 Message ID: ${msg.to} - ${new Date().toISOString()}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    
    // Log detailed SendGrid error if available
    if (error.response) {
      console.error('❌ SendGrid API Response:', error.response.body);
    }
    
    return false;
  }
}

/**
 * Test function to verify SendGrid configuration
 * @param {string} testEmail - Email to send test to
 * @returns {Promise<boolean>} - Test result
 */
export async function testSendGrid(testEmail) {
  console.log('🧪 Testing SendGrid configuration...');
  
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SendGrid Test</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #28a745; color: white; padding: 20px; border-radius: 8px; text-align: center;">
        <h2>SendGrid Test Successful! 🎉</h2>
        <p>Your SendGrid configuration is working correctly.</p>
        <p>Test sent at: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(testEmail, 'SendGrid Test - Configuration Verified', testHtml);
}