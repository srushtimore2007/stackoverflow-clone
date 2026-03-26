// lib/otp/otp-service.ts

import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import axios from 'axios';

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

  // Send OTP via SMS using RapidAPI
  async sendSMSOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      const rapidApiHost = process.env.RAPIDAPI_HOST;

      if (!rapidApiKey || !rapidApiHost) {
        console.error('RapidAPI credentials not configured in environment variables');
        console.error('Required: RAPIDAPI_KEY and RAPIDAPI_HOST in .env.local');
        throw new Error('SMS service not configured. Please contact administrator.');
      }

      // Format phone number for Indian numbers (ensure it starts with +91)
      let formattedPhone = phoneNumber;
      if (phoneNumber.startsWith('0') && phoneNumber.length === 11) {
        formattedPhone = '+91' + phoneNumber.substring(1);
      } else if (phoneNumber.startsWith('91') && phoneNumber.length === 12) {
        formattedPhone = '+' + phoneNumber;
      } else if (!phoneNumber.startsWith('+')) {
        formattedPhone = '+91' + phoneNumber;
      }

      const message = `Your verification code is ${otp}. Valid for ${this.otpExpiryMinutes} minutes. Do not share this code.`;

      const options = {
        method: 'POST',
        url: `https://${rapidApiHost}/sms/send`,
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': rapidApiHost
        },
        data: {
          to: formattedPhone,
          message: message,
          type: 'OTP'
        }
      };

      console.log(`Sending SMS to ${formattedPhone} via RapidAPI`);
      const response = await axios.request(options);
      console.log(`SMS OTP sent successfully to ${formattedPhone}`);
      return true;
    } catch (error) {
      console.error('Error sending SMS OTP:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('API Error Response:', error.response.data);
          console.error('API Status:', error.response.status);
        } else if (error.request) {
          console.error('No response received from RapidAPI');
        } else {
          console.error('Request setup error:', error.message);
        }
      }
      
      throw error; // Re-throw to handle in API route
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