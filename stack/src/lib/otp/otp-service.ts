// lib/otp/otp-service.ts

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

  // Send OTP via email (browser-safe version - needs API endpoint)
  async sendEmailOTP(email: string, otp: string): Promise<boolean> {
    try {
      // In browser, we need to call API endpoint instead of using nodemailer directly
      const response = await fetch('/api/otp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        console.error('Failed to send email OTP via API');
        return false;
      }

      const result = await response.json();
      console.log(`OTP sent successfully to ${email}`);
      return result.success;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  }

  // Send OTP via SMS using Vonage (browser-safe version - needs API endpoint)
  async sendVonageSMSOTP(phoneNumber: string, otp: string): Promise<any> {
    try {
      // In browser, we need to call API endpoint instead of using Vonage directly
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phoneNumber,
          otp: otp 
        }),
      });

      if (!response.ok) {
        console.error('Failed to send SMS OTP via API');
        throw new Error('SMS service not available');
      }

      const result = await response.json();
      console.log(`SMS OTP sent successfully to ${phoneNumber}`);
      return result;
    } catch (error) {
      console.error('Error sending SMS OTP:', error);
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
