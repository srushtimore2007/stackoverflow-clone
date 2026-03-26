import { PAYMENT_WINDOW } from '../config/plans.js';

/**
 * Middleware to enforce payment time restriction
 * Users can only make payments between 10:00 AM and 11:00 AM IST
 */
const checkPaymentTime = (req, res, next) => {
  try {
    // Get current time in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    
    // Get IST time components
    const istHour = istTime.getUTCHours(); // IST hour in UTC format
    const istMinute = istTime.getUTCMinutes();
    
    console.log('💳 Payment Time Check:', {
      utcTime: now.toISOString(),
      istTime: istTime.toISOString(),
      istHour,
      istMinute,
      timeWindow: '10:00 AM - 11:00 AM IST'
    });
    
    // Check if current time is within payment window (10:00 AM - 11:00 AM IST)
    // In IST: 10:00 AM = 4:30 UTC, 11:00 AM = 5:30 UTC
    const isWithinPaymentWindow = istHour === 10 && istMinute >= 0 && istMinute < 60;
    
    if (!isWithinPaymentWindow) {
      console.error('❌ Payment blocked - outside time window:', {
        istHour,
        istMinute,
        allowedWindow: '10:00 AM - 11:00 AM IST'
      });
      
      return res.status(403).json({
        success: false,
        message: "Payments are allowed only between 10:00 AM and 11:00 AM IST."
      });
    }
    
    console.log('✅ Payment time check passed - within allowed window');
    next();
  } catch (error) {
    console.error('Payment time check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking payment time window'
    });
  }
};

export default checkPaymentTime;