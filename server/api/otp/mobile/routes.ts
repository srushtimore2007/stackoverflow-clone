// app/api/otp/mobile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { OTPService } from '../../../lib/otp/otp-service';
import { OTPResponse } from '../../../shared/types/otp';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobile } = body;

    if (!mobile) {
      return NextResponse.json<OTPResponse>(
        {
          success: false,
          message: 'Mobile number is required',
        },
        { status: 400 }
      );
    }

    // Normalize and validate mobile format
    const normalizedMobile = mobile.replace(/[\s\-\(\)]/g, '');
    const mobileRegex = /^\+?[0-9]{10,15}$/;
    if (!mobileRegex.test(normalizedMobile)) {
      return NextResponse.json<OTPResponse>(
        {
          success: false,
          message: 'Invalid mobile number format',
        },
        { status: 400 }
      );
    }

    // Generate and store OTP (automatically replaces existing OTP if any)
    const { otp, expiresAt } = OTPService.storeOTP(normalizedMobile, 'phone');

    // Send OTP via SMS
    const sent = await OTPService.sendMobileOTP(normalizedMobile, otp);

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
      message: 'OTP sent successfully to your mobile',
      expiresAt,
    });
  } catch (error) {
    console.error('Mobile OTP Error:', error);
    return NextResponse.json<OTPResponse>(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}