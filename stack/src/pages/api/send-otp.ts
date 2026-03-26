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
    const { phone, otp } = req.body;

    // Validate phone number and OTP
    if (!phone || !otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number and OTP are required' 
      });
    }

    // Basic phone number validation (supports Indian numbers)
    const phoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid Indian phone number format. Use formats like: 9876543210, +919876543210, or 09876543210' 
      });
    }

    // Basic OTP validation (6 digits)
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otp)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP format. OTP must be 6 digits' 
      });
    }

    // Clean phone number (remove spaces)
    const cleanPhone = phone.replace(/\s/g, '');

    // Send OTP using Vonage
    try {
      const vonageResponse = await OTPService.sendVonageSMSOTP(cleanPhone, otp);
      
      return res.status(200).json({ 
        message: 'OTP sent successfully',
        response: vonageResponse
      });
    } catch (error: any) {
      console.error('SMS sending failed via Vonage:', error.message);
      
      return res.status(500).json({ 
        message: 'SMS sending failed',
        error: error.message || 'Unknown error occurred while sending SMS'
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}
