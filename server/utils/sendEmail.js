import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Sends email using SendGrid with existing environment credentials
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @returns {Promise<boolean>} - True if email sent successfully
 */
export async function sendEmail(to, subject, html) {
  const msg = {
    to: to,                       // user email
    from: process.env.SENDGRID_SENDER_EMAIL,  // verified single sender
    replyTo: process.env.SENDGRID_SENDER_EMAIL, // mandatory by SendGrid
    subject: subject,
    html: html,
  };

  try {
    // Send email with timeout protection
    await Promise.race([
      sgMail.send(msg),
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