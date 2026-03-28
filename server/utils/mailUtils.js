import 'dotenv/config';
import { BrevoClient } from '@getbrevo/brevo';

// Initialize the Brevo Client once
const brevo = new BrevoClient({ 
  apiKey: process.env.BREVO_API_KEY 
});

const toIST = (utcSeconds) => {
  return new Date(utcSeconds * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
};

export const sendEmailAlternative = async ({ to, subject, text }) => {
  // Brevo message structure
  const msg = { 
    to: [{ email: to }], 
    sender: { 
      name: 'StackOverflow', 
      email: process.env.BREVO_SENDER_EMAIL || 'moresrushti200707@gmail.com'
    }, 
    subject: subject, 
    textContent: text, // Plain text version
    htmlContent: `<html><body><p>${text}</p></body></html>` // Basic HTML version
  };

  try {
    // Send using the modern v5 method
    await brevo.transactionalEmails.sendTransacEmail(msg);
    
    const sentTimeUTC = Math.floor(Date.now() / 1000);
    console.log('✅ Email sent successfully via Brevo!');
    console.log('Sent Time (IST):', toIST(sentTimeUTC));
    
    return { success: true };
  } catch (err) {
    // Error handling logic kept identical to your style
    console.error('❌ Brevo error:', err.response?.data || err.message);
    throw err;
  }
};