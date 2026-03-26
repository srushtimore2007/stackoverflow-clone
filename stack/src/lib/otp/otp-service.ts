// lib/otp/otp-service.ts

import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Vonage } from '@vonage/server-sdk';

// OTP store in-memory (for production, use DB or Redis)
interface OTPEntry {
  otp: string;
  expiresAt: Date;
  type: 'email' | 'sms';
}

class OTPServiceClass {
  private otpStore: Map<string, OTPEntry> = new Map();
  private otpLength = 6;
  private otpExpiryMinutes = 5; // Updated to 5 minutes
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  // Initialize email transporter
  private initializeTransporter() {
    try {
      // Check if email credentials are configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.warn('Email credentials not configured. Email OTP will not work.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Verify transporter configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('Email transporter verification failed:', error);
          this.transporter = null;
        } else {
          console.log('Email transporter ready');
        }
      });
    } catch (error) {
      console.error('Error initializing email transporter:', error);
      this.transporter = null;
    }
  }

  // Generate a numeric OTP
  private generateOTP(): string {
    let otp = '';
    for (let i = 0; i < this.otpLength; i++) {
      otp += Math.floor(Math.random() * 10); // 0-9
    }
    return otp;
  }

  // Store OTP for a given identifier (email/phone)
  storeOTP(identifier: string, type: 'email' | 'sms'): { otp: string; expiresAt: number } {
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + this.otpExpiryMinutes * 60000);

    this.otpStore.set(identifier, { otp, expiresAt, type });

    return { otp, expiresAt: expiresAt.getTime() };
  }

  // Verify OTP
  verifyOTP(identifier: string, otp: string): boolean {
    const entry = this.otpStore.get(identifier);
    if (!entry) return false;

    // Check expiry
    if (entry.expiresAt < new Date()) {
      this.otpStore.delete(identifier);
      return false;
    }

    if (entry.otp === otp) {
      this.otpStore.delete(identifier);
      return true;
    }

    return false;
  }

  // Send OTP via email
  async sendEmailOTP(email: string, otp: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.error('Email transporter not initialized');
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your OTP Code</h2>
            <p>Your OTP code is:</p>
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
              ${otp}
            </div>
            <p>This code will expire in ${this.otpExpiryMinutes} minutes.</p>
            <p style="color: #666; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
        text: `Your OTP code is ${otp}. It will expire in ${this.otpExpiryMinutes} minutes.`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  }

  // Send OTP via SMS using Vonage/Nexmo
  async sendVonageSMSOTP(phoneNumber: string, otp: string): Promise<any> {
    try {
      const vonageApiKey = process.env.VONAGE_API_KEY;
      const vonageApiSecret = process.env.VONAGE_API_SECRET;

      if (!vonageApiKey || !vonageApiSecret) {
        console.error('Vonage credentials not configured in environment variables');
        console.error('Required: VONAGE_API_KEY and VONAGE_API_SECRET in .env.local');
        throw new Error('Vonage SMS service not configured. Please contact administrator.');
      }

      const vonage = new Vonage({
        apiKey: vonageApiKey,
        apiSecret: vonageApiSecret
      });

      // Format phone number for Vonage (ensure it starts with +)
      let formattedPhone = phoneNumber;
      if (!phoneNumber.startsWith('+')) {
        if (phoneNumber.startsWith('0') && phoneNumber.length === 11) {
          formattedPhone = '+91' + phoneNumber.substring(1);
        } else if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
          formattedPhone = '+' + phoneNumber;
        } else {
          formattedPhone = '+91' + phoneNumber;
        }
      }

      const brandName = process.env.VONAGE_BRAND_NAME || 'CodeQuest';
      const message = `Your OTP for phone verification before switching language is: ${otp}`;

      console.log(`Sending SMS to ${formattedPhone} via Vonage from ${brandName}`);
      const response = await vonage.sms.send({
        to: formattedPhone,
        from: brandName,
        text: message
      });
      
      console.log(`SMS OTP sent successfully to ${formattedPhone} via Vonage`);
      return response;
    } catch (error) {
      // Log full error and OTP for debugging when SMS fails
      console.error('=== SMS SENDING FAILED ===');
      console.error('Full Error Details:', error);
      console.error('Failed Phone Number:', phoneNumber);
      console.error('Failed OTP:', otp);
      console.error('Error Type:', error instanceof Error ? error.constructor.name : typeof error);
      if (error instanceof Error) {
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
      }
      console.error('=== END ERROR DETAILS ===');
      
      // Re-throw the error to be handled by the API route
      throw error;
    }
  }

  // Clean up expired OTPs periodically
  cleanExpiredOTPs() {
    const now = new Date();
    for (const entry of this.otpStore.entries()) {
      const key = entry[0];
      const value = entry[1];
      if (value.expiresAt < now) {
        this.otpStore.delete(key);
      }
    }
  }

  // Get OTP store size (for debugging)
  getStoreSize(): number {
    return this.otpStore.size;
  }
}

// Export a single instance
export const OTPService = new OTPServiceClass();

// Optional: Set up periodic cleanup
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    OTPService.cleanExpiredOTPs();
  }, 5 * 60 * 1000); // Clean up every 5 minutes
}
