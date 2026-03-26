// ===============================
// Forgot Password (API)
// ===============================
export interface ForgotPasswordRequest {
  identifier: string;
  identifierType?: 'email' | 'phone';
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
  data?: {
    sentTo: string;
    method: 'email' | 'sms';
  };
}

// ===============================
// User & Password Reset
// ===============================
export interface User {
  id: string;
  email?: string;
  phone?: string;
  password: string;
  lastPasswordResetAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetResult {
  canReset: boolean;
  remainingHours?: number;
  user?: User;
}
