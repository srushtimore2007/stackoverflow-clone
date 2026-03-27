// lib/vonage.js
import { Vonage } from '@vonage/server-sdk';

// Initialize Vonage client
// const vonage = new Vonage({
//   apiKey: process.env.VONAGE_API_KEY,
//   apiSecret: process.env.VONAGE_API_SECRET
// });
const apiKey = process.env.VONAGE_API_KEY;
const apiSecret = process.env.VONAGE_API_SECRET;

const vonage = (apiKey && apiSecret)
  ? new Vonage({
      apiKey,
      apiSecret
    })
  : null;

// Validate phone number format
const validatePhoneNumber = (phone) => {
  // Basic phone number validation - can be enhanced based on requirements
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
};

// Format phone number for Vonage
const formatPhoneNumber = (phone) => {
  // Ensure phone number starts with +
  if (!phone.startsWith('+')) {
    // Add country code if missing (default to India for demonstration)
    if (phone.length === 10) {
      return `+91${phone}`;
    }
    return `+${phone}`;
  }
  return phone;
};


// Send OTP via Vonage SMS
const sendOTP = async (phoneNumber, otp) => {
  if (!vonage) {
  console.warn("⚠️ Vonage not configured");
  return {
    success: false,
    error: "SMS service not configured"
  };
}
  try {
    const message = `Your verification code is: ${otp}. Valid for 5 minutes.`;
    
    const response = await vonage.sms.send({
      to: phoneNumber,
      from: process.env.VONAGE_FROM_NUMBER || 'StackOverflow',
      text: message
    });

    console.log('Vonage SMS sent successfully:', response);
    
    return {
      success: true,
      messageId: response.messages[0]?.messageId || 'unknown',
      response: response
    };
  } catch (error) {
    console.error('Vonage SMS error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
};

export default {
  validatePhoneNumber,
  formatPhoneNumber,
  sendOTP
};
