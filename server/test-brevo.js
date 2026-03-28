import 'dotenv/config';
import { BrevoClient } from '@getbrevo/brevo';

// 1. Initialize the client (Modern way)
const brevo = new BrevoClient({ 
  apiKey: process.env.BREVO_API_KEY 
});

console.log('Testing locally with Brevo v5...');
console.log('Key:', process.env.BREVO_API_KEY ? '✅ Found' : '❌ Missing');
console.log('Sender:', process.env.BREVO_SENDER_EMAIL);

// 2. Define the message (Logic identical to your SendGrid snippet)
const msg = {
  subject: 'Brevo Test Email',
  textContent: 'This is a test email sent from Node.js using Brevo!',
  htmlContent: '<strong>This is a test email sent from Node.js using Brevo!</strong>',
  sender: { 
    name: "MindMates", 
    email: process.env.BREVO_SENDER_EMAIL 
  },
  to: [{ 
    email: 'moresrushti200707@gmail.com' 
  }],
};

// 3. Send the email (Promise logic identical to your snippet)
brevo.transactionalEmails.sendTransacEmail(msg)
  .then(() => console.log('✅ Email sent successfully!'))
  .catch(err => {
    console.error('❌ Brevo Error:', err.message);
    // Log extra details if Brevo provides them
    if (err.response && err.response.data) {
      console.error(err.response.data);
    }
  });