import nodemailer from 'nodemailer';

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
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP is ${otp}, valid for 5 minutes.`,
        html: `<p>Your OTP is <strong>${otp}</strong>, valid for 5 minutes.</p>`,
      });

      return true;
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