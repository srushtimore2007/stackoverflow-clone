import twilio from 'twilio';

/**
 * Sends SMS using Twilio with existing environment credentials
 * 
 * @param {string} to - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<boolean>} - True if SMS sent successfully
 */
export async function sendSMS(to, message) {
  try {
    // Initialize Twilio client with existing environment variables
    const client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Send SMS
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: to
    });

    console.log(`✅ SMS sent successfully to ${to}`);
    return true;

  } catch (error) {
    console.error(`❌ Failed to send SMS to ${to}:`, error.message);
    // DO NOT throw - non-blocking error handling
    return false;
  }
}
