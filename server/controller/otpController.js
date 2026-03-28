// controller/otpController.js

import otpUtils from '../utils/otpStore.js';
import { sendEmail } from '../utils/sendEmail.js';
import vonageService from '../lib/vonage.js';

// Language OTP requirements
const LANGUAGE_OTP_REQUIREMENTS = {
  en: { required: false, type: 'phone' },
  fr: { required: true, type: 'email' },
  hi: { required: true, type: 'phone' },
  es: { required: true, type: 'phone' },
  pt: { required: true, type: 'phone' },
  zh: { required: true, type: 'phone' }
};

// ✅ Send OTP
export const sendOTP = async (req, res) => {
  try {
    const { type, value } = req.body;

    if (!type || !value) {
      return res.status(400).json({
        success: false,
        error: 'Type and value are required'
      });
    }

    if (!['email', 'phone'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be email or phone'
      });
    }

    const otp = otpUtils.generateOTP();
    otpUtils.saveOTP(value, otp);

    if (type === 'email') {
      const emailSent = await sendEmail(
        value,
        'Your OTP Code - StackOverflow Clone',
        `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your OTP Code</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
              <h2 style="color: #007bff; margin-bottom: 20px;">Language Switch Verification</h2>
              <p style="font-size: 16px; color: #666; margin-bottom: 20px;">Your OTP code is:</p>
              <div style="background: white; border: 2px solid #007bff; border-radius: 4px; padding: 15px; margin: 20px auto; max-width: 200px;">
                <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 20px;">This code will expire in 5 minutes.</p>
              <p style="font-size: 12px; color: #999; margin-top: 30px;">If you didn't request this, please ignore this email.</p>
            </div>
          </body>
          </html>
        `
      );

      if (emailSent) {
        console.log(`📧 Email OTP sent: ${otp}`);
        return res.json({
          success: true,
          message: 'OTP sent to email',
          type: 'email'
        });
      } else {
        console.log(`❌ Failed to send email OTP to ${value}`);
        return res.status(500).json({
          success: false,
          error: 'Failed to send OTP email'
        });
      }
    }

    if (type === 'phone') {
      // Validate and format phone number
      if (!vonageService.validatePhoneNumber(value)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format'
        });
      }

      const formattedPhone = vonageService.formatPhoneNumber(value);
      
      // Send OTP via Vonage
      const smsResult = await vonageService.sendOTP(formattedPhone, otp);
      
      if (smsResult.success) {
        console.log(`📱 SMS OTP sent to ${formattedPhone}: ${otp}`);
        
        return res.json({
          success: true,
          message: 'OTP sent to phone number',
          type: 'phone',
          messageId: smsResult.messageId
        });
      } else {
        // If SMS fails, fallback to simulation for development
        console.log(`⚠️ Vonage SMS failed, simulating OTP: ${otp}`);
        
        return res.json({
          success: true,
          message: 'OTP generated successfully (simulation mode)',
          otp: otp, // Only for development/testing
          type: 'phone',
          simulation: true
        });
      }
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP'
    });
  }
};

// ✅ Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { value, otp } = req.body;

    if (!value || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Value and OTP required'
      });
    }

    const result = otpUtils.verifyOTP(value, otp);

    if (result.valid) {
      return res.json({
        success: true,
        message: 'OTP verified',
        verified: true
      });
    }

    return res.status(400).json({
      success: false,
      error: result.message,
      verified: false
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
};

// ✅ Get Language Requirements
export const getLanguageRequirements = async (req, res) => {
  try {
    const { language } = req.params;

    if (!LANGUAGE_OTP_REQUIREMENTS[language]) {
      return res.status(400).json({
        success: false,
        error: 'Invalid language'
      });
    }

    res.json({
      success: true,
      requirements: LANGUAGE_OTP_REQUIREMENTS[language]
    });

  } catch (error) {
    console.error('Requirements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get requirements'
    });
  }
};