// In-memory OTP storage for language switching
const otpStore = new Map();

const otpUtils = {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  saveOTP(key, otp) {
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(key, { otp, expiresAt });
    console.log(`OTP saved for ${key}: ${otp}`);
  },

  verifyOTP(key, inputOTP) {
    const stored = otpStore.get(key);

    if (!stored) return { valid: false, message: 'OTP not found' };

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(key);
      return { valid: false, message: 'OTP expired' };
    }

    if (stored.otp !== inputOTP) {
      return { valid: false, message: 'Invalid OTP' };
    }

    otpStore.delete(key);
    return { valid: true, message: 'OTP verified successfully' };
  },

  cleanupExpired() {
    const now = Date.now();
    for (const [key, value] of otpStore.entries()) {
      if (now > value.expiresAt) {
        otpStore.delete(key);
      }
    }
  },

  getAll() {
    return Array.from(otpStore.entries());
  }
};

setInterval(otpUtils.cleanupExpired, 2 * 60 * 1000);

export default otpUtils;