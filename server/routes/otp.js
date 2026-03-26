import express from "express";
import * as otpController from "../controller/otpController.js";

const router = express.Router();

// Send OTP
router.post("/send", otpController.sendOTP);

// Verify OTP
router.post("/verify", otpController.verifyOTP);

// Get language requirements
router.get("/requirements/:language", otpController.getLanguageRequirements);

export default router;