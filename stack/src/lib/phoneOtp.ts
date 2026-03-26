// Phone OTP using Firebase Authentication with invisible reCAPTCHA
import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";
import { auth } from "./firebase";

// Store confirmation result in window object for verify step
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    phoneOtpConfirmationResult?: any; // Firebase ConfirmationResult
  }
}

/**
 * Setup invisible reCAPTCHA verifier
 * Must be called before sendPhoneOtp
 */
export const setupRecaptcha = (): RecaptchaVerifier | null => {
  if (typeof window === "undefined") {
    console.error("[phoneOtp] setupRecaptcha: Not in browser environment");
    return null;
  }

  // Check if container exists
  const container = document.getElementById("recaptcha-container");
  if (!container) {
    console.error("[phoneOtp] setupRecaptcha: recaptcha-container not found in DOM");
    return null;
  }

  // Create verifier if not exists
  if (!window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible", // Invisible reCAPTCHA - no visible UI
        }
      );
      console.log("[phoneOtp] Invisible reCAPTCHA verifier created");
    } catch (error) {
      console.error("[phoneOtp] setupRecaptcha error:", error);
      return null;
    }
  }

  return window.recaptchaVerifier;
};

/**
 * Send phone OTP using Firebase
 * @param phoneNumber - Phone number in E.164 format (e.g., +919876543210)
 * @returns Promise with success status and message
 */
export const sendPhoneOtp = async (
  phoneNumber: string
): Promise<{ success: boolean; message?: string; otp?: string }> => {
  if (typeof window === "undefined") {
    return { success: false, message: "OTP can only be sent from browser" };
  }

  try {
    // Validate phone number format (basic check)
    if (!phoneNumber || !phoneNumber.startsWith("+")) {
      return {
        success: false,
        message: "Phone number must be in E.164 format (e.g., +919876543210)",
      };
    }

    // Setup reCAPTCHA
    const appVerifier = setupRecaptcha();
    if (!appVerifier) {
      return { success: false, message: "reCAPTCHA not ready. Please refresh the page." };
    }

    console.log("[phoneOtp] Sending OTP to:", phoneNumber);

    // Send OTP via Firebase
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    
    // Store confirmation result in window object
    window.phoneOtpConfirmationResult = confirmationResult;

    // Console fallback for testing (remove in production or use env flag)
    console.log("[phoneOtp] OTP sent successfully to", phoneNumber);
    console.log("[phoneOtp] Check your phone for the verification code");

    return { success: true };
  } catch (error: any) {
    console.error("[phoneOtp] sendPhoneOtp error:", error);
    const code = error?.code || "";
    let message = "Failed to send OTP";

    // Map Firebase error codes to user-friendly messages
    switch (code) {
      case "auth/too-many-requests":
        message = "Too many attempts. Please try again later.";
        break;
      case "auth/invalid-phone-number":
        message = "Invalid phone number format.";
        break;
      case "auth/quota-exceeded":
        message = "SMS quota exceeded. Please try again later.";
        break;
      case "auth/captcha-check-failed":
        message = "reCAPTCHA verification failed. Please refresh and try again.";
        break;
      default:
        message = error?.message || "Failed to send OTP. Please try again.";
    }

    return { success: false, message };
  }
};

/**
 * Verify phone OTP
 * @param otp - 6-digit verification code
 * @returns Promise with success status and message
 */
export const verifyPhoneOtp = async (
  otp: string
): Promise<{ success: boolean; message?: string }> => {
  if (typeof window === "undefined") {
    return { success: false, message: "Verification only available in browser" };
  }

  // Validate OTP format
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return { success: false, message: "Please enter a valid 6-digit OTP" };
  }

  // Get stored confirmation result
  const confirmationResult = window.phoneOtpConfirmationResult;
  if (!confirmationResult) {
    return {
      success: false,
      message: "Session expired. Please request a new OTP.",
    };
  }

  try {
    console.log("[phoneOtp] Verifying OTP...");

    // Verify OTP
    await confirmationResult.confirm(otp);

    // Clear stored confirmation result
    window.phoneOtpConfirmationResult = null;

    // Sign out from Firebase (we only use Firebase for OTP, not auth)
    await signOut(auth);

    console.log("[phoneOtp] OTP verified successfully");

    return { success: true };
  } catch (error: any) {
    console.error("[phoneOtp] verifyPhoneOtp error:", error);
    const code = error?.code || "";
    let message = "Verification failed";

    // Map Firebase error codes
    switch (code) {
      case "auth/invalid-verification-code":
        message = "Invalid OTP. Please try again.";
        break;
      case "auth/code-expired":
        message = "OTP has expired. Please request a new one.";
        break;
      case "auth/too-many-requests":
        message = "Too many attempts. Please try again later.";
        break;
      case "auth/session-expired":
        message = "Session expired. Please request a new OTP.";
        break;
      default:
        message = error?.message || "Verification failed. Please try again.";
    }

    return { success: false, message };
  }
};

/**
 * Clear stored confirmation result (call on logout or cleanup)
 */
export const clearPhoneOtpSession = () => {
  if (typeof window !== "undefined") {
    window.phoneOtpConfirmationResult = null;
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined;
    }
  }
};
