// controller/otpController.js

import otpUtils, { isRateLimited } from '../utils/otpUtils.js';
import sendEmail from '../utils/sendEmail.js';
import vonageService from '../lib/vonage.js';

// Language OTP requirements
const LANGUAGE_OTP_REQUIREMENTS = {
  en: { required: true, type: 'phone' },
  fr: { required: true, type: 'email' },
  hi: { required: true, type: 'phone' },
  es: { required: true, type: 'phone' },
  pt: { required: true, type: 'phone' },
  zh: { required: true, type: 'phone' }
};

/**
 * Generate professional OTP email template
 */
function generateOTPEmailTemplate(otp, language = 'en') {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your OTP Code</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Verification Code</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">StackOverflow Clone</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; text-align: center;">
          <p style="font-size: 18px; color: #495057; margin-bottom: 30px;">Your verification code is:</p>
          
          <!-- OTP Display -->
          <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 20px; margin: 20px auto; max-width: 250px; letter-spacing: 8px;">
            <h2 style="color: #495057; font-size: 36px; margin: 0; font-weight: 700; font-family: 'Courier New', monospace;">${otp}</h2>
          </div>
          
          <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">This code will expire in <strong>5 minutes</strong></p>
          <p style="font-size: 12px; color: #adb5bd; margin-top: 20px;">If you didn't request this code, please ignore this email.</p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #dee2e6;">
          <p style="font-size: 12px; color: #6c757d; margin: 0;"> 2024 StackOverflow Clone. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Send OTP
export const sendOTP = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { type, value } = req.body;

    // Input validation
    if (!type || !value) {
      return res.status(400).json({
        success: false,
        error: 'Type and value are required',
        code: 'MISSING_INPUT'
      });
    }

    if (!['email', 'phone'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type must be email or phone',
        code: 'INVALID_TYPE'
      });
    }

    // Rate limiting check
    if (isRateLimited(value)) {
      const rateLimitInfo = otpUtils.getRateLimitInfo(value);
      return res.status(429).json({
        success: false,
        error: 'Too many OTP requests. Please try again later.',
        code: 'RATE_LIMITED',
        remaining: rateLimitInfo.remaining,
        resetTime: rateLimitInfo.resetTime
      });
    }

    // Generate and store OTP
    const otp = otpUtils.generateOTP();
    otpUtils.saveOTP(value, otp);

    console.log(` [${new Date().toISOString()}] Generating OTP for ${type}: ${value.substring(0, 3)}***`);

   // --- CASE: EMAIL (Brevo) ---
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return res.status(400).json({ success: false, error: 'Invalid email format' });
      }

      const emailHtml = generateOTPEmailTemplate(otp);
      
      // ✅ LOGIC UPDATE: Calling your new Brevo Mailer
      const emailSent = await sendEmail(
        value, 
        'Your Verification Code - StackOverflow Clone', 
        emailHtml
      );

      if (emailSent) {
        console.log(`[${Date.now() - startTime}ms] Brevo OTP sent to ${value}`);
        return res.json({
          success: true,
          message: 'OTP sent to your email',
          type: 'email',
          expiresIn: '5 minutes'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to send email via Brevo.',
          code: 'EMAIL_SEND_FAILED'
        });
      }
    }
    if (type === 'phone') {
      // Phone validation and formatting
      if (!vonageService.validatePhoneNumber(value)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format',
          code: 'INVALID_PHONE'
        });
      }

      const formattedPhone = vonageService.formatPhoneNumber(value);
      
      // Send OTP via Vonage
      const smsResult = await vonageService.sendOTP(formattedPhone, otp);
      
      if (smsResult.success) {
        console.log(` [${Date.now() - startTime}ms] SMS OTP sent to ${formattedPhone}`);
        
        return res.json({
          success: true,
          message: 'OTP sent to your phone number',
          type: 'phone',
          messageId: smsResult.messageId,
          expiresIn: '5 minutes'
        });
      } else {
        // Development fallback
        console.log(` [${Date.now() - startTime}ms] Vonage SMS failed, development fallback for ${formattedPhone}: ${otp}`);
        
        return res.json({
          success: true,
          message: 'OTP generated (development mode)',
          type: 'phone',
          otp: otp, // Only for development
          simulation: true,
          expiresIn: '5 minutes'
        });
      }
    }

  } catch (error) {
    console.error(` [${Date.now() - startTime}ms] Send OTP error:`, error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { value, otp } = req.body;

    // Input validation
    if (!value || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Value and OTP are required',
        code: 'MISSING_INPUT'
      });
    }

    if (typeof otp !== 'string' || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP format',
        code: 'INVALID_OTP_FORMAT'
      });
    }

    console.log(` [${new Date().toISOString()}] Verifying OTP for ${value.substring(0, 3)}***`);

    const result = otpUtils.verifyOTP(value, otp);

    if (result.valid) {
      console.log(` [${Date.now() - startTime}ms] OTP verification successful for ${value.substring(0, 3)}***`);
      
      return res.json({
        success: true,
        message: 'OTP verified successfully',
        verified: true
      });
    }

    console.log(` [${Date.now() - startTime}ms] OTP verification failed for ${value.substring(0, 3)}***: ${result.message}`);

    return res.status(400).json({
      success: false,
      error: result.message,
      verified: false,
      code: result.message.includes('expired') ? 'OTP_EXPIRED' : 'INVALID_OTP'
    });

  } catch (error) {
    console.error(` [${Date.now() - startTime}ms] Verify OTP error:`, error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Get Language Requirements
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