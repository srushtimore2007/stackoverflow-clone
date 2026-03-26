import express from "express";
import auth from "../middleware/auth.js";
import { sendOtp, verifyOtp } from "../controller/languageController.js";

const router = express.Router();

router.post("/send-otp", auth, sendOtp);
router.post("/verify-otp", auth, verifyOtp);

export default router;
