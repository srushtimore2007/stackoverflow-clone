import twilio from "twilio";
import user from "../models/auth.js";
import sendEmail from "../utils/sendEmail.js";

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
      if (!existingUser.email) {
        return res.status(400).json({
          success: false,
          message: "Email required for French language verification",
        });
      }

      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Language Verification OTP</title>
          </head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #007bff; color: white; padding: 30px; border-radius: 8px; text-align: center;">
              <h1>🌐 Language Verification</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
              <p>Hello,</p>
              <p>Your language change verification code is:</p>
              <div style="background: white; border: 2px solid #007bff; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
                <h2 style="color: #007bff; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 3px;">${otp}</h2>
              </div>
              <p>This code will expire in <strong>5 minutes</strong>.</p>
              <p style="font-size: 12px; color: #6c757d;">If you didn't request this, please ignore this email.</p>
            </div>
          </body>
          </html>
        `;

        const emailSent = await sendEmail(
          existingUser.email,
          "Language Verification OTP - StackOverflow Clone",
          emailHtml
        );

        if (!emailSent) {
          console.error("[send-otp] Email failed");
          return res.status(500).json({
            success: false,
            message: "Failed to send OTP via email",
          });
        }
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
