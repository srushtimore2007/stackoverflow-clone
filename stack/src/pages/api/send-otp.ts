import type { NextApiRequest, NextApiResponse } from 'next';
import { OTPService } from '../../lib/otp/otp-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST' 
    });
  }

  try {
    const { phoneNumber } = req.body;

    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Basic phone number validation (supports Indian numbers)
    const phoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Indian phone number format. Use formats like: 9876543210, +919876543210, or 09876543210' 
      });
    }

    // Clean phone number (remove spaces)
    const cleanPhone = phoneNumber.replace(/\s/g, '');

    // Store OTP and send SMS
    const { otp, expiresAt } = OTPService.storeOTP(cleanPhone, 'sms');
    
    try {
      const sent = await OTPService.sendSMSOTP(cleanPhone, otp);
      
      if (!sent) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send OTP via SMS. Please try again later.' 
        });
      }
    } catch (error: any) {
      console.error('SMS sending failed:', error.message);
      
      if (error.message.includes('SMS service not configured')) {
        return res.status(500).json({ 
          success: false, 
          message: 'SMS service not configured. Please contact administrator.' 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP. Please try again later.' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully via SMS',
      expiresAt
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
