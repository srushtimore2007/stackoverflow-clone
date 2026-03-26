// components/otp-modal.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useOTP } from '../hooks/useOTP.js';
import { useTranslation } from '../hooks/useTranslation.js';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  method: 'email' | 'mobile';
  identifier: string;
}

export function OTPModal({
  isOpen,
  onClose,
  onVerified,
  method,
  identifier,
}: OTPModalProps) {
  const { t } = useTranslation('common');
  const { t: tError } = useTranslation('errors');
  const { sendOTP, verifyOTP, loading } = useOTP();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Send OTP on mount when modal opens
  useEffect(() => {
    if (isOpen && !otpSent) {
      handleSendOTP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, remainingTime]);

  const handleSendOTP = async () => {
    setError(null);
    const result = await sendOTP(method, identifier);

    if (result.success) {
      setOtpSent(true);
      setRemainingTime(300);
      setCanResend(false);
    } else {
      setError(result.message);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError(tError('invalidOTP'));
      return;
    }

    setError(null);
    const result = await verifyOTP(otp, method, identifier);

    if (result.verified) {
      onVerified();
      handleClose();
    } else {
      setError(result.message);
      if (result.remainingAttempts !== undefined && result.remainingAttempts === 0) {
        setTimeout(() => {
          handleClose();
        }, 2000);
      }
    }
  };

  const handleResend = () => {
    setOtp('');
    setError(null);
    handleSendOTP();
  };

  const handleClose = () => {
    setOtp('');
    setError(null);
    setOtpSent(false);
    setRemainingTime(300);
    setCanResend(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('otp.title')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          {method === 'email' ? t('otp.emailMessage') : t('otp.mobileMessage')}
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('otp.enterOTP')}
          </label>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="000000"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mb-4 text-sm text-gray-600">
          {remainingTime > 0 ? (
            <p>{t('otp.expiresIn', { time: remainingTime })}</p>
          ) : (
            <p className="text-red-600">{tError('expiredOTP')}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleVerifyOTP}
            disabled={loading || otp.length !== 6}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('loading') : t('otp.verify')}
          </button>

          <button
            onClick={handleResend}
            disabled={!canResend || loading}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('otp.resend')}
          </button>
        </div>
      </div>
    </div>
  );
}