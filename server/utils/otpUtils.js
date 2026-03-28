// In-memory OTP storage with rate limiting
const otpStore = new Map();
const rateLimitStore = new Map();

// Rate limiting: max 5 OTP requests per hour per email
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

/**
 * Check if email/phone is rate limited
 */
function isRateLimited(key) {
  const now = Date.now();
  const requests = rateLimitStore.get(key) || [];
  
  // Remove expired requests
  const validRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT) {
    return true;
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  return false;
}

const otpUtils = {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  saveOTP(key, otp) {
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore.set(key, { otp, expiresAt });
    console.log(`🔐 OTP saved for ${key}: ${otp}`);
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
    // Clear rate limit on successful verification
    rateLimitStore.delete(key);
    return { valid: true, message: 'OTP verified successfully' };
  },

  cleanupExpired() {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Clean expired OTPs
    for (const [key, value] of otpStore.entries()) {
      if (now > value.expiresAt) {
        otpStore.delete(key);
        cleanedCount++;
      }
    }
    
    // Clean expired rate limit entries
    for (const [key, requests] of rateLimitStore.entries()) {
      const validRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
      if (validRequests.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, validRequests);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired OTPs`);
    }
  },

  getAll() {
    return Array.from(otpStore.entries());
  },

  getRateLimitInfo(key) {
    const requests = rateLimitStore.get(key) || [];
    const now = Date.now();
    const validRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    return {
      remaining: Math.max(0, RATE_LIMIT - validRequests.length),
      resetTime: validRequests.length > 0 ? Math.min(...validRequests) + RATE_LIMIT_WINDOW : now + RATE_LIMIT_WINDOW
    };
  }
};

// Cleanup expired OTPs every 2 minutes
setInterval(otpUtils.cleanupExpired, 2 * 60 * 1000);

export { isRateLimited };
export default otpUtils;
