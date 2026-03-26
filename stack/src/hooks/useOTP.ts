// hooks/useOTP.ts

import { useState } from 'react';
import { OTPResponse, OTPVerifyResponse } from '../shared/types/otp.js'
interface UseOTPReturn {
  sendOTP: (method: 'email' | 'mobile', identifier: string) => Promise<OTPResponse>;
  verifyOTP: (otp: string, method: 'email' | 'mobile', identifier: string) => Promise<OTPVerifyResponse>;
  loading: boolean;
  error: string | null;
}

export function useOTP(): UseOTPReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOTP = async (
    method: 'email' | 'mobile',
    identifier: string
  ): Promise<OTPResponse> => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = method === 'email' ? '/api/otp/email' : '/api/otp/mobile';
      const body = method === 'email' ? { email: identifier } : { mobile: identifier };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data: OTPResponse = await response.json();

      if (!data.success) {
        setError(data.message);
      }

      return data;
    } catch (err) {
      const errorMessage = 'Failed to send OTP. Please try again.';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (
    otp: string,
    method: 'email' | 'mobile',
    identifier: string
  ): Promise<OTPVerifyResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp, identifier, method }),
      });

      const data: OTPVerifyResponse = await response.json();

      if (!data.success) {
        setError(data.message);
      }

      return data;
    } catch (err) {
      const errorMessage = 'Failed to verify OTP. Please try again.';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
        verified: false,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendOTP,
    verifyOTP,
    loading,
    error,
  };
}