import axiosInstance from '../lib/axiosinstance';

export interface OTPRequest {
  type: 'email' | 'phone';
  value: string;
  language?: string;
}

export interface OTPVerifyRequest {
  value: string;
  otp: string;
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  type?: string;
  debugOTP?: string;
  verified?: boolean;
  error?: string;
}

export interface LanguageRequirement {
  required: boolean;
  type: 'email' | 'phone' | null;
}

export interface LanguageRequirementResponse {
  success: boolean;
  requirements?: LanguageRequirement;
  error?: string;
}

// Send OTP
export const sendOTP = async (request: OTPRequest): Promise<OTPResponse> => {
  try {
    const response = await axiosInstance.post<OTPResponse>('/api/otp/send', request);
    return response.data;
  } catch (error: any) {
    console.error('Send OTP error:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        error: error.response.data.error || 'Failed to send OTP'
      };
    }

    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
};

// Verify OTP
export const verifyOTP = async (request: OTPVerifyRequest): Promise<OTPResponse> => {
  try {
    const response = await axiosInstance.post<OTPResponse>('/api/otp/verify', request);
    return response.data;
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        error: error.response.data.error || 'Failed to verify OTP'
      };
    }

    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
};

// Get language requirements
export const getLanguageRequirements = async (language: string): Promise<LanguageRequirementResponse> => {
  try {
    const response = await axiosInstance.get<LanguageRequirementResponse>(`/api/otp/requirements/${language}`);
    return response.data;
  } catch (error: any) {
    console.error('Get language requirements error:', error);
    
    if (error.response?.data) {
      return {
        success: false,
        error: error.response.data.error || 'Failed to get requirements'
      };
    }

    return {
      success: false,
      error: 'Network error. Please try again.'
    };
  }
};
