// types/otp.ts

export interface OTPRequest {
  email?: string;
  mobile?: string;
  method: 'email' | 'mobile';
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresAt?: number;
  remainingAttempts?: number;
}

export interface OTPVerifyRequest {
  otp: string;
  method: 'email' | 'mobile';
  identifier: string; // email or mobile
}

export interface OTPVerifyResponse {
  success: boolean;
  message: string;
  verified: boolean;
  remainingAttempts?: number;
}

export interface OTPStorage {
  otp: string;
  expiresAt: number;
  attempts: number;
  identifier: string;
  method: 'email' | 'mobile';
}