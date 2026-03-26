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
import axiosInstance from '../../lib/axiosinstance';

interface SimulatedMobileOTPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after OTP is successfully verified */
  onVerified: (phoneNumber: string) => void;
  initialPhone?: string | null;
}

export function SimulatedMobileOTPModal({
  open,
  onOpenChange,
  onVerified,
  initialPhone = '',
}: SimulatedMobileOTPModalProps) {
  const [phone, setPhone] = useState<string>(initialPhone || '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhone(initialPhone || '');
      setOtp('');
      setStep('phone');
      setError(null);
      setSuccessMsg(null);
      setLoading(false);
    }
  }, [open, initialPhone]);

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/mobile-otp/send', { mobile: phone.trim() });
      if (response.data.success) {
        setStep('otp');
        setSuccessMsg(response.data.message || 'OTP Sent successfully');
      } else {
        setError(response.data.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const response = await axiosInstance.post('/api/mobile-otp/verify', {
        mobile: phone.trim(),
        otp: otp
      });
      if (response.data.success) {
        setSuccessMsg('Verification successful');
        // Let user see success before closing
        setTimeout(() => {
          onVerified(phone.trim());
          onOpenChange(false);
        }, 800);
      } else {
        setError(response.data.message || 'Invalid or expired OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify your phone (Simulated Mobile OTP)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'phone' ? (
            <>
              <label className="block text-sm font-medium text-gray-700">
                Phone number
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
              <p className="text-xs text-blue-500 italic block mb-2">Check backend server console for the simulated OTP</p>
              <label className="block text-sm font-medium text-gray-700">
                Enter OTP
              </label>
              <Input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                maxLength={6}
                placeholder="0000"
                disabled={loading}
              />
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded px-2 py-1">
              {successMsg}
            </p>
          )}
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
              <Button onClick={handleVerify} disabled={loading || otp.length < 4}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
