'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguageOTP } from '../hooks/useLanguageOTP';
import type { Locale } from '../shared/types/i18n';
import { getOTPMethod } from '../shared/lib/i18n';

interface LanguageOTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (locale: Locale) => void;
  pendingLanguage: Locale | null;
  /** User phone for resend OTP (Firebase phone flow) */
  userPhone?: string | null;
  /** User email for resend OTP (Email OTP flow for French) */
  userEmail?: string | null;
}

export function LanguageOTPModal({
  isOpen,
  onClose,
  onVerified,
  pendingLanguage,
  userPhone = null,
  userEmail = null,
}: LanguageOTPModalProps) {
  const { t } = useTranslation('common');
  const { t: tError } = useTranslation('errors');
  const { verifyOTP, sendOTP, loading } = useLanguageOTP();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const method = pendingLanguage ? getOTPMethod(pendingLanguage) : 'mobile';

  useEffect(() => {
    if (!isOpen) return;
    setOtp('');
    setError(null);
    setRemainingTime(300);
    setCanResend(false);
  }, [isOpen]);

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

  const handleVerify = async () => {
    if (otp.length !== 6 || !pendingLanguage) {
      setError(tError('invalidOTP'));
      return;
    }
    setError(null);
    const result = await verifyOTP(otp, pendingLanguage);
    if (result.success && pendingLanguage) {
      setOtp('');
      onVerified(pendingLanguage);
      onClose();
    } else {
      setError(result.message || tError('invalidOTP'));
    }
  };

  const handleResend = async () => {
    if (!pendingLanguage) return;
    setError(null);
    // Get user email/phone from props or localStorage
    const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
    const result = await sendOTP(
      pendingLanguage,
      pendingLanguage === 'fr' ? undefined : (userPhone ?? undefined),
      pendingLanguage === 'fr' ? (userEmail ?? undefined) : undefined
    );
    if (result.success) {
      setOtp('');
      setRemainingTime(300);
      setCanResend(false);
    } else {
      setError(result.message || tError('otpSendFailed'));
    }
  };

  const handleCancel = () => {
    setOtp('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('otp.title')}</h2>
          <button
            onClick={handleCancel}
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
              <path d="M6 18L18 6M6 6l12 12" />
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
            onClick={handleVerify}
            disabled={loading || otp.length !== 6}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('loading') : t('otp.verify')}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('cancel')}
          </button>
        </div>
        <div className="mt-3">
          <button
            onClick={handleResend}
            disabled={!canResend || loading}
            className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {t('otp.resend')}
          </button>
        </div>
      </div>
    </div>
  );
}
