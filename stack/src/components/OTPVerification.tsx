import React, { useState } from 'react';
import axios from 'axios';
import { useTranslationManager } from '../hooks/useTranslationManager';

interface OTPVerificationProps {
  onVerificationSuccess?: (phoneNumber: string) => void;
}

interface OTPResponse {
  success: boolean;
  message?: string;
  otp?: string;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  onVerificationSuccess 
}) => {
  const { t } = useTranslationManager();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [timeLeft, setTimeLeft] = useState(0);
  const [resendTimer, setResendTimer] = useState<NodeJS.Timeout | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const showMessage = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const startResendTimer = () => {
    setTimeLeft(60);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setResendTimer(timer);
  };

  const clearResendTimer = () => {
    if (resendTimer) {
      clearInterval(resendTimer);
      setResendTimer(null);
    }
    setTimeLeft(0);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  // ✅ FIXED ENDPOINT
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhoneNumber(phoneNumber)) {
      showMessage('Please enter a valid Indian mobile number', 'error');
      return;
    }

    setIsLoading(true);
    clearResendTimer();

    try {
      const response = await axios.post<OTPResponse>(
        `${API_BASE_URL}/api/otp/send`,
        {  
          type: "phone",
          value: phoneNumber.replace(/\s/g, '')
        }
      );

      if (response.data.success) {
        setIsOtpSent(true);
        setReceivedOtp(response.data.otp || '');
        showMessage(t('otp.success'), 'success');
        startResendTimer();
      } else {
        showMessage(response.data.message || t('otp.failedToSend'), 'error');
      }
    } catch (error: any) {
      console.error('Send OTP error:', error.response?.data || error.message);
      showMessage(
        error.response?.data?.message || t('otp.failedToSend'),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED ENDPOINT
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      showMessage(t('otp.invalid'), 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post<OTPResponse>(
        `${API_BASE_URL}/api/otp/verify`,
        {
          value: phoneNumber.replace(/\s/g, ''),
          otp
        }
      );

      if (response.data.success) {
        showMessage(t('otp.verified'), 'success');
        clearResendTimer();
        onVerificationSuccess?.(phoneNumber);

        setTimeout(() => {
          setPhoneNumber('');
          setOtp('');
          setReceivedOtp('');
          setIsOtpSent(false);
        }, 2000);
      } else {
        showMessage(response.data.message || t('otp.invalid'), 'error');
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error.response?.data || error.message);
      showMessage(
        error.response?.data?.message || t('otp.failedToVerify'),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED ENDPOINT
  const handleResendOTP = async () => {
    if (timeLeft > 0) return;

    setIsLoading(true);
    clearResendTimer();

    try {
      const response = await axios.post<OTPResponse>(
        `${API_BASE_URL}/api/otp/send`,
        {
          type: "phone",
          value: phoneNumber.replace(/\s/g, '')
        }
      );

      if (response.data.success) {
        setReceivedOtp(response.data.otp || '');
        showMessage(t('otp.resent'), 'success');
        startResendTimer();
      } else {
        showMessage(response.data.message || t('otp.failedToResend'), 'error');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error.response?.data || error.message);
      showMessage(
        error.response?.data?.message || t('otp.failedToResend'),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">{t('otp.verifyTitle')}</h2>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm ${
            messageType === 'success' ? 'bg-green-100 text-green-700' :
            messageType === 'error' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}
        >
          {message}
        </div>
      )}

      {receivedOtp && (
        <div className="mb-4 p-4 bg-yellow-100 border-2 border-yellow-300 rounded-md">
          <p className="text-center text-lg font-bold text-yellow-800">
            Your OTP is: <span className="text-2xl text-yellow-900">{receivedOtp}</span>
          </p>
          <p className="text-center text-sm text-yellow-600 mt-1">
            {t('otp.useOtpToVerify')}
          </p>
        </div>
      )}

      {!isOtpSent ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+91 9876543210"
            className="w-full px-3 py-2 border rounded-md"
          />

          <button
            type="submit"
            disabled={isLoading || !phoneNumber}
            className="w-full bg-blue-600 text-white py-2 rounded-md"
          >
            {isLoading ? t('otp.sending') : t('otp.send')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t('otp.enterOtp')}
            className="w-full px-3 py-2 border rounded-md text-center"
          />

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full bg-green-600 text-white py-2 rounded-md"
          >
            {isLoading ? t('otp.verifying') : t('otp.verify')}
          </button>

          <button
            type="button"
            onClick={handleResendOTP}
            disabled={timeLeft > 0}
            className="w-full bg-gray-500 text-white py-2 rounded-md"
          >
            {timeLeft > 0 ? `${t('otp.resendIn')} ${timeLeft}s` : t('otp.resend')}
          </button>
        </form>
      )}
    </div>
  );
};