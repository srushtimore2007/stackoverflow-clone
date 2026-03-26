import { useState, useRef } from 'react';
import axiosInstance from '../lib/axiosinstance';
import { sendPhoneOtp, verifyPhoneOtp } from '../lib/phoneOtp';

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
      
      // Non-French: use Firebase phone OTP when phone is provided
      if (phone) {
        const result = await sendPhoneOtp(phone);
        if (result.success) {
          lastSentViaFirebase.current = true;
          // Console fallback for testing
          console.log('[useLanguageOTP] Phone OTP sent via Firebase');
        }
        return result;
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
      
      // Non-French: use Firebase phone OTP verification
      if (lastSentViaFirebase.current) {
        const result = await verifyPhoneOtp(otp);
        if (result.success) {
          lastSentViaFirebase.current = false;
          // Update language preference after successful verification
          await axiosInstance.patch('/api/auth/language', { language });
        }
        return result;
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
