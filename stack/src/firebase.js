// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDu7BAEWxf1rbLJbtaVDIqUWhOHemnrFMA",
  authDomain: "codequest-1b25c.firebaseapp.com",
  projectId: "codequest-1b25c",
  storageBucket: "codequest-1b25c.firebasestorage.app",
  messagingSenderId: "471695710454",
  appId: "1:471695710454:web:07ae0c498b78803af834d7",
  measurementId: "G-J33NHPHQS0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Store confirmation result for verify step (language OTP flow)
let confirmationResultStore = null;

// ================== RECAPTCHA (invisible) ==================
const setupRecaptcha = () => {
  if (typeof window === "undefined") return null;

  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      { size: "invisible" }
    );
  }

  return window.recaptchaVerifier;
};

// ================== SEND PHONE OTP ==================
/**
 * Sends Firebase phone OTP. Call verifyPhoneOtp(otp) after user enters code.
 * @param {string} phoneNumber - E.164 format (e.g. +919876543210)
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const sendPhoneOtp = async (phoneNumber) => {
  if (typeof window === "undefined") {
    return { success: false, message: "OTP can only be sent from browser" };
  }

  try {
    const appVerifier = setupRecaptcha();
    if (!appVerifier) {
      return { success: false, message: "reCAPTCHA not ready" };
    }

    const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    confirmationResultStore = result;
    return { success: true };
  } catch (err) {
    const code = err?.code || "";
    const msg =
      code === "auth/too-many-requests"
        ? "Too many attempts. Please try again later."
        : code === "auth/invalid-phone-number"
          ? "Invalid phone number."
          : err?.message || "Failed to send OTP";
    return { success: false, message: msg };
  }
};

// ================== VERIFY PHONE OTP ==================
/**
 * Verifies the OTP sent via sendPhoneOtp. Use after user submits code.
 * @param {string} otp - 6-digit code
 * @returns {Promise<{ success: boolean, message?: string }>}
 */
const verifyPhoneOtp = async (otp) => {
  if (typeof window === "undefined") {
    return { success: false, message: "Verification only available in browser" };
  }

  if (!confirmationResultStore) {
    return {
      success: false,
      message: "Session expired. Please request a new OTP.",
    };
  }

  try {
    await confirmationResultStore.confirm(otp);
    confirmationResultStore = null;
    await signOut(auth);
    return { success: true };
  } catch (err) {
    const code = err?.code || "";
    const msg =
      code === "auth/invalid-verification-code"
        ? "Invalid OTP. Please try again."
        : code === "auth/code-expired"
          ? "OTP has expired. Please request a new one."
        : code === "auth/too-many-requests"
          ? "Too many attempts. Please try again later."
          : err?.message || "Verification failed. Please try again.";
    return { success: false, message: msg };
  }
};

// Legacy export for any existing usage
const sendOtp = async (phone) => {
  const res = await sendPhoneOtp(phone);
  if (!res.success) throw new Error(res.message);
  return confirmationResultStore;
};

export { auth, sendOtp, sendPhoneOtp, verifyPhoneOtp };
