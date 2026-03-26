// app/api/otp/email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '../../../lib/otp/otp-service';
import { OTPResponse } from '../../../shared/types/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json<OTPResponse>(
        {
          success: false,
          message: 'Email is required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<OTPResponse>(
        {
          success: false,
          message: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Generate and store OTP (automatically replaces existing OTP if any)
    const { otp, expiresAt } = OTPService.storeOTP(email.toLowerCase().trim(), 'email');

    // Send OTP via email
    const sent = await OTPService.sendEmailOTP(email.toLowerCase().trim(), otp);

    if (!sent) {
      return NextResponse.json<OTPResponse>(
        {
          success: false,
          message: 'Failed to send OTP. Please try again.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json<OTPResponse>({
      success: true,
      message: 'OTP sent successfully to your email',
      expiresAt,
    });
  } catch (error) {
    console.error('Email OTP Error:', error);
    return NextResponse.json<OTPResponse>(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}