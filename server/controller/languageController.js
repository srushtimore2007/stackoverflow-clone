import nodemailer from "nodemailer";
import twilio from "twilio";
import user from "../models/auth.js";

const ALLOWED_LANGUAGES = ["en", "hi", "es", "pt", "zh", "fr"];
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/language/send-otp
 * Sends OTP via email (French) or SMS (others)
 */
export const sendOtp = async (req, res) => {
  const userId = req.userid;
  const { language } = req.body;

  try {
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!language || !ALLOWED_LANGUAGES.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Invalid language. Allowed: en, hi, es, pt, zh, fr",
      });
    }

    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    existingUser.otp = otp;
    existingUser.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);
    existingUser.languageRequested = language;
    await existingUser.save();

    if (language === "fr") {
      // Send via EMAIL for French
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

      if (!existingUser.email) {
        return res.status(400).json({
          success: false,
          message: "Email required for French language verification",
        });
      }

      if (!emailUser || !emailPass) {
        console.log("[send-otp] Fallback - OTP for French:", otp);
        return res.status(200).json({
          success: true,
          message: "OTP sent (fallback: check console)",
        });
      }

      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: emailUser, pass: emailPass },
        });
        await transporter.sendMail({
          from: emailUser,
          to: existingUser.email,
          subject: "Language Verification OTP",
          text: `Your OTP is ${otp}`,
          html: `<p>Your OTP is <strong>${otp}</strong></p>`,
        });
      } catch (err) {
        console.error("[send-otp] Email failed:", err.message);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP via email",
        });
      }
    } else {
      // Send via SMS for other languages
      const mobile =
        existingUser.mobileNumber || existingUser.phone;
      if (!mobile) {
        return res.status(400).json({
          success: false,
          message: "Mobile number required for language verification. Please add it in your profile.",
        });
      }

      const twilioSid = process.env.TWILIO_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE;

      if (!twilioSid || !twilioToken || !twilioPhone) {
        console.log("[send-otp] Fallback - OTP for non-French:", otp);
        return res.status(200).json({
          success: true,
          message: "OTP sent (fallback: check console)",
        });
      }

      try {
        const twilioClient = twilio(twilioSid, twilioToken);
        await twilioClient.messages.create({
          body: `Your language verification OTP is: ${otp}`,
          from: twilioPhone,
          to: mobile,
        });
      } catch (err) {
        console.error("[send-otp] SMS failed:", err.message);
        return res.status(500).json({
          success: false,
          message: "Failed to send OTP via SMS",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("[send-otp]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

/**
 * POST /api/language/verify-otp
 * Verifies OTP and updates preferred language
 */
export const verifyOtp = async (req, res) => {
  const userId = req.userid;
  const { otp } = req.body;

  try {
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!otp || typeof otp !== "string" || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!existingUser.otp || !existingUser.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (existingUser.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (new Date() > new Date(existingUser.otpExpiry)) {
      existingUser.otp = null;
      existingUser.otpExpiry = null;
      existingUser.languageRequested = null;
      await existingUser.save();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const languageRequested = existingUser.languageRequested;
    if (!languageRequested || !ALLOWED_LANGUAGES.includes(languageRequested)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    existingUser.preferredLanguage = languageRequested;
    existingUser.otp = null;
    existingUser.otpExpiry = null;
    existingUser.languageRequested = null;
    await existingUser.save();

    return res.status(200).json({
      success: true,
      message: "Language updated successfully",
      preferredLanguage: languageRequested,
    });
  } catch (error) {
    console.error("[verify-otp]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
