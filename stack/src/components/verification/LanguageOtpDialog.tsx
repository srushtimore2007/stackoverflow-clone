'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { sendPhoneOtp, verifyPhoneOtp } from '../../lib/phoneOtp';

interface LanguageOtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after OTP is successfully verified */
  onVerified: (phoneNumber: string) => void;
  initialPhone?: string | null;
}

export function LanguageOtpDialog({
  open,
  onOpenChange,
  onVerified,
  initialPhone = '',
}: LanguageOtpDialogProps) {
  const [phone, setPhone] = useState<string>(initialPhone || '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhone(initialPhone || '');
      setOtp('');
      setStep('phone');
      setError(null);
      setLoading(false);
    }
  }, [open, initialPhone]);

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await sendPhoneOtp(phone.trim());
      if (!result.success) {
        setError(result.message || 'Failed to send OTP');
        return;
      }
      setStep('otp');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await verifyPhoneOtp(otp);
      if (!result.success) {
        setError(result.message || 'Invalid or expired OTP');
        return;
      }
      onVerified(phone.trim());
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify your phone to change language</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'phone' ? (
            <>
              <label className="block text-sm font-medium text-gray-700">
                Phone number (E.164 format, e.g. +919876543210)
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                disabled={loading}
              />
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                We have sent an SMS with a verification code to:
              </p>
              <p className="font-medium">{phone}</p>
              <label className="block text-sm font-medium text-gray-700">
                Enter OTP
              </label>
              <Input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                maxLength={6}
                placeholder="000000"
                disabled={loading}
              />
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
              {error}
            </p>
          )}

          {/* Invisible reCAPTCHA container required by Firebase phone auth */}
          <div id="recaptcha-container" />
        </div>

        <DialogFooter>
          {step === 'phone' ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleSendOtp} disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleVerify} disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

