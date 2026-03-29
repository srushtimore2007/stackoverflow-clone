import { useState, useRef } from 'react';
import axiosInstance from '../lib/axiosinstance';
import { OTPService } from '../lib/otp/otp-service';

interface SendOTPResponse {
  success: boolean;
  message?: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  preferredLanguage?: string;
}

interface UseLanguageOTPReturn {
  sendOTP: (language: string, phone?: string, email?: string) => Promise<SendOTPResponse>;
  verifyOTP: (otp: string, language: string) => Promise<VerifyOTPResponse>;
  loading: boolean;
}

export function useLanguageOTP(): UseLanguageOTPReturn {
  const [loading, setLoading] = useState(false);
  const lastSentViaFirebase = useRef(false);
  const lastLanguage = useRef<string>('');
  const lastEmail = useRef<string | null>(null);

  const sendOTP = async (
    language: string,
    phone?: string,
    email?: string
  ): Promise<SendOTPResponse> => {
    setLoading(true);
    lastSentViaFirebase.current = false;
    lastLanguage.current = language;
    
    try {
      // French: use backend email OTP
      if (language === 'fr') {
        if (!email) {
          return { success: false, message: 'Email required for French language verification' };
        }
        lastEmail.current = email;
        const res = await axiosInstance.post<SendOTPResponse>(
          '/api/auth/send-email-otp',
          { email }
        );
        return res.data;
      }
      
      // Non-French: use backend phone OTP when phone is provided
      if (phone) {
        try {
          // Normalize phone number
          const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
          
          // Validate phone number format
          const phoneRegex = /^\+?[0-9]{10,15}$/;
          if (!phoneRegex.test(normalizedPhone)) {
            return { success: false, message: 'Invalid phone number format. Use E.164 format (e.g., +919876543210)' };
          }

          // Store OTP and send via Vonage SMS
          const { otp, expiresAt } = OTPService.storeOTP(normalizedPhone, 'sms');
          const sent = await OTPService.sendVonageSMSOTP(normalizedPhone, otp);
          
          if (sent) {
            lastSentViaFirebase.current = true;
            console.log('[useLanguageOTP] Phone OTP sent via Vonage');
            return { success: true, message: 'OTP sent successfully' };
          } else {
            return { success: false, message: 'Failed to send OTP' };
          }
        } catch (error) {
          console.error('[useLanguageOTP] Send OTP error:', error);
          return { success: false, message: 'Failed to send OTP' };
        }
      }
      
      return { success: false, message: 'Phone number required for language verification' };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to send OTP';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (otp: string, language: string): Promise<VerifyOTPResponse> => {
    setLoading(true);
    try {
      // French: use backend email OTP verification
      if (language === 'fr' || lastLanguage.current === 'fr') {
        if (!lastEmail.current) {
          return {
            success: false,
            message: 'Missing email for OTP verification. Please request a new OTP.',
          };
        }
        const res = await axiosInstance.post<VerifyOTPResponse>(
          '/api/auth/verify-email-otp',
          { otp, email: lastEmail.current }
        );
        if (res.data.success) {
          // Update language preference after successful verification
          await axiosInstance.patch('/api/auth/language', { language });
        }
        return res.data;
      }
      
      // Non-French: use backend phone OTP verification
      if (lastSentViaFirebase.current) {
        try {
          // We need to get the phone number from somewhere - for now, we'll need to pass it
          // Since this hook doesn't store the phone number, we'll return an error
          // In practice, the LanguageOtpDialog should handle verification directly
          return { success: false, message: 'Please use the phone verification dialog to verify OTP' };
        } catch (error) {
          console.error('[useLanguageOTP] Verify OTP error:', error);
          return { success: false, message: 'Failed to verify OTP' };
        }
      }
      
      return { success: false, message: 'No active OTP session. Please request a new OTP.' };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Invalid or expired OTP';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  return { sendOTP, verifyOTP, loading };
}
