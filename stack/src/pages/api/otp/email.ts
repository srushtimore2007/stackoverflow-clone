import type { NextApiRequest, NextApiResponse } from 'next';
import { OTPService } from '../../../lib/otp/otp-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Use POST' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Invalid email' });

  const { otp, expiresAt } = OTPService.storeOTP(email.toLowerCase(), 'email');
  const sent = await OTPService.sendEmailOTP(email.toLowerCase(), otp);

  if (!sent) return res.status(500).json({ success: false, message: 'Failed to send OTP' });

  return res.status(200).json({ success: true, message: 'OTP sent', expiresAt });
}