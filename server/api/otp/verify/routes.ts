// app/api/otp/verify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '../../../lib/otp/otp-service';
import { OTPVerifyResponse } from '../../../shared/types/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp, identifier, method } = body;

    if (!otp || !identifier || !method) {
      return NextResponse.json<OTPVerifyResponse>(
        {
          success: false,
          message: 'OTP, identifier, and method are required',
          verified: false,
        },
        { status: 400 }
      );
    }

    // Normalize identifier based on method
    const normalizedIdentifier = method === 'email' 
      ? identifier.toLowerCase().trim()
      : identifier.replace(/[\s\-\(\)]/g, '');

    // Verify OTP
    const result = OTPService.verifyOTP(normalizedIdentifier, otp);

    return NextResponse.json<OTPVerifyResponse>({
      success: result.success,
      message: result.message,
      verified: result.success,
      remainingAttempts: result.remainingAttempts,
    }, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json<OTPVerifyResponse>(
      {
        success: false,
        message: 'Internal server error',
        verified: false,
      },
      { status: 500 }
    );
  }
}