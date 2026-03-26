// controller/otpController.js

import otpUtils from '../utils/otpStore.js';
import nodemailer from 'nodemailer';
import vonageService from '../lib/vonage.js';

// Initialize nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Language OTP requirements
const LANGUAGE_OTP_REQUIREMENTS = {
  en: { required: false, type: null },
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
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: value,
        subject: 'Language Switch Verification - OTP',
        html: `
          <h2>Language Switch Verification</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>Valid for 5 minutes</p>
        `
      });

      console.log(`📧 Email OTP sent: ${otp}`);

      return res.json({
        success: true,
        message: 'OTP sent to email',
        type: 'email'
      });
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