// import { useState, useEffect} from 'react';
// import { sendOtp } from '../firebase';

// const OtpForm = () => {
//   const [phone, setPhone] = useState<string>('');
//   const [otp, setOtp] = useState<string>('');
//   const [confirmationResult, setConfirmationResult] = useState<any>(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string>('');
//   const [success, setSuccess] = useState<string>('');

//   useEffect(() => {
//     if (confirmationResult) {
//       const otpInput = document.getElementById('otp');
//       otpInput?.focus();
//     }
//   }, [confirmationResult]);

//   const handleSendOtp = async () => {
//     setError('');
//     setSuccess('');
    
//     if (!phone || phone.length < 10) {
//       setError('Please enter a valid phone number with country code (e.g., +91XXXXXXXXXX)');
//       return;
//     }

//     setLoading(true);
//     try {
//       const result = await sendOtp(phone);
//       setConfirmationResult(result);
//       setSuccess('OTP sent successfully! Check your phone.');
//       alert('OTP sent successfully! Check your phone.');
//     } catch (err) {
//       const errorMessage = err.message || 'Failed to send OTP. Please try again.';
//       setError(errorMessage);
//       alert(`Error: ${errorMessage}`);
//       console.error('OTP Send Error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerifyOtp = async () => {
//     setError('');
//     setSuccess('');

//     if (!otp || otp.length !== 6) {
//       setError('Please enter a valid 6-digit OTP');
//       return;
//     }

//     if (!confirmationResult) {
//       setError('Please send OTP first');
//       return;
//     }

//     setLoading(true);
//     try {
//       const result = await confirmationResult.confirm(otp);
//       setSuccess('OTP verified successfully! User authenticated.');
//       alert('OTP verified successfully! User authenticated.');
//       console.log('User:', result.user);
      
//       // Reset form after successful verification
//       setPhone('');
//       setOtp('');
//       setConfirmationResult(null);
//     } catch (err) {
//   let errorMessage = 'Failed to verify OTP. Please try again.';

//   if (err instanceof Error) {
//     // Firebase error codes are on (err as any).code
//     const firebaseErr = err as { code?: string; message?: string };

//     if (firebaseErr.code === 'auth/invalid-verification-code') {
//       errorMessage = 'Invalid OTP. Please check and try again.';
//     } else if (firebaseErr.message) {
//       errorMessage = firebaseErr.message;
//     }
//   }

//   setError(errorMessage);
// }

//       alert(`Error: ${errorMessage}`);
//       console.error('OTP Verification Error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
//       <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
//         <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
//           Phone Authentication
//         </h2>
        
//         {/* reCAPTCHA Container */}
//         <div id="recaptcha-container" className="mb-4"></div>

//         {/* Phone Number Input */}
//         <div className="mb-4">
//           <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
//             Phone Number
//           </label>
//           <input
//             id="phone"
//             type="tel"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//             placeholder="+91XXXXXXXXXX"
//             disabled={loading}
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
//           />
//         </div>

//         {/* Send OTP Button */}
//         <button
//           onClick={handleSendOtp}
//           disabled={loading || !phone}
//           className="w-full mb-6 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
//         >
//           {loading && !confirmationResult ? 'Sending...' : 'Send OTP'}
//         </button>

//         {/* OTP Input */}
//         <div className="mb-4">
//           <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
//             Enter OTP
//           </label>
//           <input
//             id="otp"
//             type="text"
//             value={otp}
//             onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
//             placeholder="000000"
//             maxLength={6}
//             disabled={loading || !confirmationResult}
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed text-center text-2xl tracking-widest font-mono"
//           />
//         </div>

//         {/* Verify OTP Button */}
//         <button
//           onClick={handleVerifyOtp}
//           disabled={loading || !confirmationResult || otp.length !== 6}
//           className="w-full mb-4 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
//         >
//           {loading && confirmationResult ? 'Verifying...' : 'Verify OTP'}
//         </button>

//         {/* Success Message */}
//         {success && (
//           <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded-lg">
//             <p className="text-sm text-green-800 font-medium">{success}</p>
//           </div>
//         )}

//         {/* Error Message */}
//         {error && (
//           <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
//             <p className="text-sm text-red-800 font-medium">{error}</p>
//           </div>
//         )}

//         {/* Helper Text */}
//         <p className="text-xs text-gray-500 text-center mt-6">
//           Make sure to include country code (e.g., +91 for India)
//         </p>
//       </div>
//     </div>
//   );
// };

// export default OtpForm;

import { useState, useEffect } from "react";
import { sendOtp } from "../firebase.js";

const OtpForm = () => {
  const [phone, setPhone] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    if (confirmationResult) {
      document.getElementById("otp")?.focus();
    }
  }, [confirmationResult]);

  // ================= SEND OTP =================
  const handleSendOtp = async () => {
    setError("");
    setSuccess("");

    if (!phone || phone.length < 10) {
      setError(
        "Please enter a valid phone number with country code (e.g., +91XXXXXXXXXX)"
      );
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(phone);
      setConfirmationResult(result);
      setSuccess("OTP sent successfully! Check your phone.");
    } catch (err) {
      let errorMessage = "Failed to send OTP. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error("OTP Send Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY OTP =================
  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (!confirmationResult) {
      setError("Please send OTP first");
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      setSuccess("OTP verified successfully! User authenticated.");
      console.log("User:", result.user);

      // reset form
      setPhone("");
      setOtp("");
      setConfirmationResult(null);
    } catch (err) {
      let errorMessage = "Failed to verify OTP. Please try again.";

      if (err instanceof Error) {
        const firebaseErr = err as { code?: string; message?: string };

        if (firebaseErr.code === "auth/invalid-verification-code") {
          errorMessage = "Invalid OTP. Please check and try again.";
        } else if (firebaseErr.message) {
          errorMessage = firebaseErr.message;
        }
      }

      setError(errorMessage);
      console.error("OTP Verification Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center mb-6">
          Phone Authentication
        </h2>

        <div id="recaptcha-container" className="mb-4" />

        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91XXXXXXXXXX"
          disabled={loading}
          className="w-full px-4 py-3 border rounded-lg mb-4"
        />

        <button
          onClick={handleSendOtp}
          disabled={loading || !phone}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg mb-6"
        >
          {loading && !confirmationResult ? "Sending..." : "Send OTP"}
        </button>

        <input
          id="otp"
          type="text"
          value={otp}
          onChange={(e) =>
            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="000000"
          disabled={loading || !confirmationResult}
          className="w-full px-4 py-3 border rounded-lg mb-4 text-center text-xl"
        />

        <button
          onClick={handleVerifyOtp}
          disabled={loading || otp.length !== 6}
          className="w-full bg-green-600 text-white py-3 rounded-lg"
        >
          {loading && confirmationResult ? "Verifying..." : "Verify OTP"}
        </button>

        {success && <p className="text-green-600 mt-4">{success}</p>}
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default OtpForm;
