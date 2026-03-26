import express from 'express';

const router = express.Router();

// Mock OTP Store for simulated mobile verification
// Key: mobile number, Value: { otp, attempts, expiresAt }
const otpStore = {};

function generateOTP() { 
  return Math.floor(1000 + Math.random() * 9000).toString(); 
}

function storeOTP(mobile, otp) { 
  otpStore[mobile] = {
    otp: otp,
    attempts: 0,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes expiry
  }; 
}

function verifyOTP(mobile, otp) { 
  const record = otpStore[mobile];
  if (!record) return { valid: false, message: "No OTP sent to this number" };
  
  if (Date.now() > record.expiresAt) {
    delete otpStore[mobile];
    return { valid: false, message: "OTP has expired" };
  }

  if (record.attempts >= 3) {
    delete otpStore[mobile];
    return { valid: false, message: "Maximum attempts reached. Please request a new OTP" };
  }

  if (record.otp === otp) {
    return { valid: true, message: "Verification successful" };
  } else {
    record.attempts += 1;
    return { valid: false, message: "Invalid OTP" };
  }
}

// @route POST /api/mobile-otp/send
// @desc Generate and simulate sending an OTP
router.post('/send', (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ success: false, message: "Mobile number is required" });
  }
  
  const otp = generateOTP();
  storeOTP(mobile, otp);
  
  // Simulate sending OTP (Logs to backend console)
  console.log(`\n================================`);
  console.log(`[SIMULATED SMS] OTP for ${mobile} is ${otp}`);
  console.log(`================================\n`);
  
  // TODO: Replace above with real SMS API integration (e.g. Twilio, AWS SNS)
  // await twilioClient.messages.create({ body: `Your OTP is ${otp}`, to: mobile, from: '...' });

  res.status(200).json({ success: true, message: "OTP sent successfully" });
});

// @route POST /api/mobile-otp/verify
// @desc Verify the submitted OTP
router.post('/verify', (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ success: false, message: "Mobile number and OTP are required" });
  }
  
  const result = verifyOTP(mobile, otp);
  
  if (result.valid) {
    // Clear OTP after successful verification
    delete otpStore[mobile];
    res.status(200).json({ success: true, message: result.message });
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
});

export default router;
