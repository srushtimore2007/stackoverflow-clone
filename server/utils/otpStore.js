import otpUtils, { isRateLimited } from './otpUtils.js';
import sendEmail from './sendEmail.js';

export const requestLoginOTP = async (req, res) => {
  const { email } = req.body;

  // 1. Check Rate Limit
  if (isRateLimited(email)) {
    const info = otpUtils.getRateLimitInfo(email);
    return res.status(429).json({ 
      message: 'Too many requests. Please try again later.',
      resetIn: Math.round((info.resetTime - Date.now()) / 1000 / 60) + " minutes"
    });
  }

  // 2. Generate and Save
  const otp = otpUtils.generateOTP();
  otpUtils.saveOTP(email, otp);

  // 3. Send via Brevo
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login Verification</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
      <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0092ff 0%, #0066cc 100%); color: white; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🔐 Login Verification</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">StackOverflow Clone</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; text-align: center;">
          <p style="font-size: 18px; color: #495057; margin-bottom: 30px;">Your login verification code is:</p>
          
          <!-- OTP Display -->
          <div style="background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 20px; margin: 20px auto; max-width: 250px; letter-spacing: 8px;">
            <h2 style="color: #0092ff; font-size: 36px; margin: 0; font-weight: 700; font-family: 'Courier New', monospace;">${otp}</h2>
          </div>
          
          <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">This code will expire in <strong>5 minutes</strong></p>
          <p style="font-size: 12px; color: #adb5bd; margin-top: 20px;">If you didn't request this login, please ignore this email.</p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #dee2e6;">
          <p style="font-size: 12px; color: #6c757d; margin: 0;">© 2024 StackOverflow Clone. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const success = await sendEmail(email, 'Login Verification OTP', emailHtml);
    
    if (success) {
      res.json({ message: 'OTP sent successfully!' });
    } else {
      res.status(500).json({ message: 'Failed to send email. Please try again.' });
    }
  } catch (error) {
    console.error('[requestLoginOTP] Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};