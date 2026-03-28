import sendEmail from "../../utils/sendEmail";

interface OTPRecord {
  otp: string;
  expiresAt: number;
}

const otpStore: Record<string, OTPRecord> = {};

export const OTPService = {
  generateOTP: (): string => Math.floor(100000 + Math.random() * 900000).toString(),

  storeOTP: (key: string, type: 'email' | 'phone'): OTPRecord => {
    const otp = OTPService.generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore[`${type}:${key}`] = { otp, expiresAt };
    return { otp, expiresAt };
  },

  verifyOTP: (key: string, otp: string, type: 'email' | 'phone' = 'email'): { success: boolean; message: string; remainingAttempts?: number } => {
    const record = otpStore[`${type}:${key}`];
    if (!record) {
      return { success: false, message: 'No OTP found. Please request a new one.' };
    }
    if (record.expiresAt < Date.now()) {
      delete otpStore[`${type}:${key}`];
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }
    const isValid = record.otp === otp;
    if (isValid) {
      delete otpStore[`${type}:${key}`];
      return { success: true, message: 'OTP verified successfully' };
    }
    return { success: false, message: 'Invalid OTP. Please try again.' };
  },

  sendEmailOTP: async (email: string, otp: string): Promise<boolean> => {
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your OTP Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #6f42c1; color: white; padding: 30px; border-radius: 8px; text-align: center;">
            <h1>🔐 Your OTP Code</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
            <p>Hello,</p>
            <p>Your verification code is:</p>
            <div style="background: white; border: 2px solid #6f42c1; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
              <h2 style="color: #6f42c1; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 3px;">${otp}</h2>
            </div>
            <p>This code will expire in <strong>5 minutes</strong>.</p>
            <p style="font-size: 12px; color: #6c757d;">If you didn't request this, please ignore this email.</p>
          </div>
        </body>
        </html>
      `;

      const success = await sendEmail(
        email,
        'Your OTP Code - StackOverflow Clone',
        emailHtml
      );

      return success;
    } catch (error) {
      console.error('OTP email error:', error);
      return false;
    }
  },

  sendMobileOTP: async (mobile: string, otp: string): Promise<boolean> => {
    try {
      // For now, log to console (in production, integrate with SMS service like Twilio)
      console.log(`[OTP Service] SMS OTP for ${mobile}: ${otp}`);
      
      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      // Example with Twilio:
      // const accountSid = process.env.TWILIO_ACCOUNT_SID;
      // const authToken = process.env.TWILIO_AUTH_TOKEN;
      // const client = require('twilio')(accountSid, authToken);
      // await client.messages.create({
      //   body: `Your OTP is ${otp}, valid for 5 minutes.`,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: mobile
      // });

      return true;
    } catch (error) {
      console.error('OTP SMS error:', error);
      return false;
    }
  },
};