'use client';

import React, { useState, useEffect } from 'react';
import { sendOTP, verifyOTP, getLanguageRequirements } from '../services/otpService';

interface LanguageVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLanguage: string;
  onVerified: () => void;
  userEmail?: string;
}

const LanguageVerificationModal: React.FC<LanguageVerificationModalProps> = ({
  isOpen,
  onClose,
  targetLanguage,
  onVerified,
  userEmail
}) => {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [contactValue, setContactValue] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugOTP, setDebugOTP] = useState('');

  const languageNames: Record<string, string> = {
    en: 'English',
    fr: 'French',
    hi: 'Hindi',
    es: 'Spanish',
    pt: 'Portuguese',
    zh: 'Chinese'
  };

  const [requirements, setRequirements] = useState<{
    required: boolean;
    type: 'email' | 'phone' | null;
  }>({ required: false, type: null });

  useEffect(() => {
    if (isOpen && targetLanguage) {
      loadRequirements();
    }
  }, [isOpen, targetLanguage]);

  useEffect(() => {
    if (userEmail && requirements.type === 'email') {
      setContactValue(userEmail);
    }
  }, [userEmail, requirements.type]);

  const loadRequirements = async () => {
    try {
      const response = await getLanguageRequirements(targetLanguage);
      if (response.success && response.requirements) {
        setRequirements(response.requirements);
      }
    } catch (error) {
      console.error('Failed to load requirements:', error);
    }
  };

  const handleSendOTP = async () => {
    if (!contactValue.trim()) {
      setError('Please enter your contact information');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await sendOTP({
        type: requirements.type!,
        value: contactValue,
        language: targetLanguage
      });

      if (response.success) {
        setStep('verify');
        if (response.debugOTP) {
          setDebugOTP(response.debugOTP);
          console.log(`📱 OTP for ${contactValue}: ${response.debugOTP}`);
        }
      } else {
        setError(response.error || 'Failed to send OTP');
      }
    } catch (error) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await verifyOTP({
        value: contactValue,
        otp
      });

      if (response.success && response.verified) {
        onVerified();
        onClose();
        // Reset state
        setStep('input');
        setContactValue('');
        setOtp('');
        setError('');
        setDebugOTP('');
      } else {
        setError(response.error || 'Invalid OTP');
      }
    } catch (error) {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      // Reset state
      setStep('input');
      setContactValue('');
      setOtp('');
      setError('');
      setDebugOTP('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Verify for {languageNames[targetLanguage]}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {step === 'input' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              {requirements.type === 'email' 
                ? 'Enter your email address to receive a verification code.'
                : 'Enter your phone number to receive a verification code.'
              }
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {requirements.type === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <input
                type={requirements.type === 'email' ? 'email' : 'tel'}
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={requirements.type === 'email' ? 'your@email.com' : '+1234567890'}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <button
              onClick={handleSendOTP}
              disabled={isLoading || !contactValue.trim()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Enter the 6-digit verification code sent to {contactValue}
            </p>

            {debugOTP && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                <strong>Development Mode:</strong> OTP is {debugOTP}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                maxLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="space-y-2">
              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button
                onClick={() => setStep('input')}
                disabled={isLoading}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageVerificationModal;
