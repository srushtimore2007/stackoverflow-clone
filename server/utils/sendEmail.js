import nodemailer from 'nodemailer';

/**
 * Sends email using Nodemailer with existing environment credentials
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @returns {Promise<boolean>} - True if email sent successfully
 */
export async function sendEmail(to, subject, html) {
  try {
    // Create transporter using existing environment variables
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send email with timeout protection
    await Promise.race([
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: html
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), 15000))
    ]);

    console.log(`✅ Email sent successfully to ${to}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    // DO NOT throw - non-blocking error handling
    return false;
  }
}
