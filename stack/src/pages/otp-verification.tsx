import React from 'react';
import { OTPVerification } from '../components/OTPVerification';

const OTPPage: React.FC = () => {
  const handleVerificationSuccess = (phoneNumber: string) => {
    console.log('Phone number verified:', phoneNumber);
    // Here you can redirect, update state, or perform other actions
    alert(`Phone number ${phoneNumber} verified successfully!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mobile OTP Verification
          </h1>
          <p className="text-gray-600">
            Enter your mobile number to receive a verification code
          </p>
        </div>
        
        <OTPVerification onVerificationSuccess={handleVerificationSuccess} />
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Enter your Indian mobile number</li>
            <li>2. Receive a 6-digit OTP via SMS</li>
            <li>3. Enter the OTP to verify your number</li>
            <li>4. OTP expires in 5 minutes</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;
