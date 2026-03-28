import mongoose from "mongoose";
import user from "../models/auth.js";
import LoginHistory from "../models/LoginHistory.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";

/**
 * Generate a secure password: only A-Z, a-z, length 8-12,
 * at least 1 uppercase and 1 lowercase.
 */
function generateSecurePassword() {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const all = lower + upper;
  const len = 8 + Math.floor(Math.random() * 5); 

  let pwd = "";
  pwd += lower.charAt(Math.floor(Math.random() * lower.length));
  pwd += upper.charAt(Math.floor(Math.random() * upper.length));
  for (let i = 2; i < len; i++) {
    pwd += all.charAt(Math.floor(Math.random() * all.length));
  }
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

/* ========================= SIGNUP ========================= */
export const Signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existinguser = await user.findOne({ email });
    if (existinguser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashpassword = await bcrypt.hash(password, 12);

    const newuser = await user.create({
      name,
      email,
      password: hashpassword,
    });

    const token = jwt.sign(
      { email: newuser.email, id: newuser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ data: newuser, token });
  } catch (error) {
    console.error("[Signup] Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= LOGIN ========================= */

export const Login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await user.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User does not exist" });
    }

    const ispasswordcrct = await bcrypt.compare(password, existingUser.password);

    if (!ispasswordcrct) {
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // ✅ Device detection (should be set by deviceDetection middleware)
    const deviceInfo = req.device || {
      ip: req.ip || "Unknown",
      browser: "Unknown",
      os: "Unknown",
      deviceType: "Unknown",
    };

    console.log("Device Info:", deviceInfo);

    // ✅ Conditional Access Rules
    const browser = (deviceInfo.browser || "Unknown").toLowerCase();
    const deviceType = (deviceInfo.deviceType || "desktop").toLowerCase(); // "mobile" or "desktop"

    // let requiresOTP = !browser.includes("edge"); // Chrome/Others require OTP, Edge doesn't

    let requiresOTP;
    if (browser.includes("edge")) {
      requiresOTP = false; // Edge allows direct login
    } else {
      requiresOTP = true;  // Chrome and all others require OTP
    }
    // OTP Rules
    // let requiresOTP = !browser.includes("edge"); // Chrome/Others require OTP, Edge doesn't

    // Mobile Time Restriction (10 AM - 1 PM)
    if (deviceType === "mobile") {
      const istDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const currentHour = new Date(istDate).getHours();

      if (currentHour < 10 || currentHour >= 13) {
        return res.status(403).json({
          success: false,
          requiresOTP: false,
          message: "Mobile device login allowed only between 10 AM to 1 PM (IST)",
        });
      }
    }

    // Save history
    await LoginHistory.create({
      userId: existingUser._id,
      ip: deviceInfo.ip,
      browser: browser,
      os: deviceInfo.os,
      deviceType: deviceType === "mobile" ? "Mobile" : "Desktop",
      loginTime: new Date(),
    }).catch(err => console.error("History Save Error:", err));

    if (requiresOTP) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000;

      if (!global.loginOtpStore) global.loginOtpStore = new Map();
      global.loginOtpStore.set(existingUser.email, { otp, expiresAt, userId: existingUser._id });

      // Send OTP via Brevo
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0092ff;">Login Verification</h2>
          <p>Your OTP for login verification is:</p>
          <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `;
      
      try {
        await sendEmail(existingUser.email, "Login Verification OTP", emailHtml);
      } catch (emailError) {
        console.error('[Login] Failed to send OTP email:', emailError.message);
        // Continue with OTP flow even if email fails
      }

      return res.status(200).json({
        success: true,
        requiresOTP: true,
        message: "OTP sent to your email."
      });
    }

    // Direct Login
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );
    
    return res.status(200).json({ success: true, data: existingUser, token });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};


/* ========================= FORGOT PASSWORD ========================= */
export const forgotPassword = async (req, res) => {
  const { identifier } = req.body;

  try {
    const existingUser = await user.findOne({ email: identifier.toLowerCase().trim() });
    if (!existingUser) return res.status(404).json({ message: "User not found" });

    // Rate limit: 1 request per day
    const lastRequest = existingUser.forgotPasswordAt ? new Date(existingUser.forgotPasswordAt).getTime() : 0;
    if (Date.now() - lastRequest < 24 * 60 * 60 * 1000) {
      return res.status(429).json({ message: "Reset allowed once per day" });
    }

    const newPassword = generateSecurePassword();
    existingUser.password = await bcrypt.hash(newPassword, 12); // Used 12 salt rounds to match Signup
    existingUser.forgotPasswordAt = new Date();
    await existingUser.save();

    const emailHtml = `
      <div style="border: 2px solid #dc3545; padding: 20px; border-radius: 8px;">
        <h2 style="color: #dc3545;">🔒 Password Reset</h2>
        <p>Your temporary password is: <strong>${newPassword}</strong></p>
        <p>Please log in and change it immediately.</p>
      </div>
    `;

    try {
      await sendEmail(existingUser.email, "Password Reset - StackOverflow Clone", emailHtml);
    } catch (emailError) {
      console.error('[forgotPassword] Failed to send password reset email:', emailError.message);
      // Still return success since password was reset
    }

    return res.status(200).json({ success: true, message: "New password sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= GET ALL USERS ========================= */
export const getallusers = async (req, res) => {
  try {
    const alluser = await user.find();
    res.status(200).json({ data: alluser });
  } catch (error) {
    console.error("[getallusers] Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= GET USER BY ID ========================= */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const foundUser = await user
      .findById(id)
      .select("-password -otp -otpExpiry -languageRequested -forgotPasswordAt")
      .populate("friends", "name email joinDate")
      .lean();
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ data: foundUser });
  } catch (error) {
    console.error("[getUserById]", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= SEARCH USERS ========================= */
export const searchUsers = async (req, res) => {
  try {
    const query = (req.query.query || "").trim();
    if (!query) {
      const alluser = await user.find().select("name email joinDate friends").lean();
      return res.status(200).json({ data: alluser });
    }
    const regex = new RegExp(query, "i");
    const users = await user
      .find({
        $or: [{ name: regex }, { email: regex }],
      })
      .select("name email joinDate friends")
      .lean();
    res.status(200).json({ data: users });
  } catch (error) {
    console.error("[searchUsers]", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= GET FRIEND LIST ========================= */
export const getFriendList = async (req, res) => {
  const currentUserId = req.userid;
  try {
    const currentUser = await user
      .findById(currentUserId)
      .populate("friends", "name email joinDate")
      .lean();
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const friends = currentUser.friends || [];
    res.status(200).json({ success: true, data: friends });
  } catch (error) {
    console.error("[getFriendList]", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= UPDATE PROFILE ========================= */
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { name, about, tags } = req.body.editForm;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "User unavailable" });
  }

  try {
    const updatedProfile = await user.findByIdAndUpdate(
      _id,
      { $set: { name, about, tags } },
      { new: true }
    );

    res.status(200).json({ data: updatedProfile });
  } catch (error) {
    console.error("[updateprofile] Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= ADD FRIEND (for Public Space posting) ========================= */
export const addFriend = async (req, res) => {
  const currentUserId = req.userid;
  const { friendId } = req.body;

  try {
    if (!friendId || !mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ message: "Invalid friend ID" });
    }

    if (friendId === currentUserId) {
      return res.status(400).json({ message: "Cannot add yourself as friend" });
    }

    const currentUser = await user.findById(currentUserId);
    const friendUser = await user.findById(friendId);

    if (!currentUser || !friendUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.friends) currentUser.friends = [];
    if (currentUser.friends.includes(friendId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    currentUser.friends.push(friendId);
    if (!friendUser.friends) friendUser.friends = [];
    if (!friendUser.friends.includes(currentUserId)) {
      friendUser.friends.push(currentUserId);
      await friendUser.save();
    }
    await currentUser.save();

    return res.status(200).json({
      success: true,
      message: "Friend added",
      friends: currentUser.friends,
    });
  } catch (error) {
    console.error("[addFriend]", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= UPDATE LANGUAGE PREFERENCE ========================= */
export const updateLanguagePreference = async (req, res) => {
  try {
    const userId = req.userid; // set by auth middleware
    const { language } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const allowedLanguages = ["en", "hi", "es", "pt", "zh", "fr"];

    if (!language || !allowedLanguages.includes(language)) {
      return res.status(400).json({ message: "Invalid language code" });
    }

    const existingUser = await user.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ message: "User does not exist" });
    }

    existingUser.preferredLanguage = language;
    await existingUser.save();

    return res.status(200).json({
      success: true,
      message: "Language preference updated successfully",
      preferredLanguage: existingUser.preferredLanguage,
    });
  } catch (error) {
    console.error("[updateLanguagePreference] Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= GET LOGIN HISTORY ========================= */
export const getLoginHistory = async (req, res) => {
  try {
    const userId = req.userid; // set by auth middleware

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get all login records for the user, sorted by latest first
    const loginHistory = await LoginHistory.find({ userId })
      .sort({ loginTime: -1 }) // Sort by loginTime descending (latest first)
      .lean();

    return res.status(200).json({
      success: true,
      data: loginHistory,
    });
  } catch (error) {
    console.error("[getLoginHistory]", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= SEND OTP (PLACEHOLDER FOR FUTURE) ========================= */
export const sendOTP = async (req, res) => {
  try {
    const userId = req.userid; // set by auth middleware
    const { email, phone } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // TODO: Implement OTP generation and sending logic
    // - Generate 6-digit OTP
    // - Store OTP with expiry in user model or separate collection
    // - Send via email (using Brevo) or SMS (using Twilio)
    // - Return success response

    return res.status(501).json({
      message: "OTP functionality not yet implemented",
    });
  } catch (error) {
    console.error("[sendOTP]", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= VERIFY OTP (PLACEHOLDER FOR FUTURE) ========================= */
export const verifyOTP = async (req, res) => {
  try {
    const userId = req.userid; // set by auth middleware
    const { otp } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // TODO: Implement OTP verification logic
    // - Retrieve stored OTP for user
    // - Check if OTP matches and hasn't expired
    // - If valid, mark OTP as used and allow login to proceed
    // - Return success response with token or session

    return res.status(501).json({
      message: "OTP verification not yet implemented",
    });
  } catch (error) {
    console.error("[verifyOTP]", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= LOGIN OTP VERIFICATION ========================= */
/**
 * POST /api/verify-login-otp
 * Verifies the OTP sent during login process
 * Returns JWT token if OTP is valid and not expired
 */
export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required for OTP verification.",
      });
    }

    if (!otp || typeof otp !== "string" || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP format. Please enter a 6-digit code.",
      });
    }

    // Get stored OTP from memory
    if (!global.loginOtpStore) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    const stored = global.loginOtpStore.get(normalizedEmail);
    if (!stored) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      global.loginOtpStore.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // OTP verified - remove from store
    global.loginOtpStore.delete(normalizedEmail);

    // Find user and generate token
    const existingUser = await user.findOne({ email: normalizedEmail });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log(`[verifyLoginOtp] OTP verified successfully for email ${normalizedEmail}`);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: existingUser,
      token
    });

  } catch (error) {
    console.error("[verifyLoginOtp]", error);
    res.status(500).json({ 
      success: false, 
      message: "Something went wrong" 
    });
  }
};

/* ========================= EMAIL OTP: SEND ========================= */
/**
 * POST /api/send-email-otp
 * Sends 6-digit OTP to user's email
 * Stores OTP in memory (Map) with expiry (5 minutes)
 */
export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    const existingUser = await user.findOne({
      email: normalizedEmail,
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    if (!global.emailOtpStore) {
      global.emailOtpStore = new Map();
    }

    // Key OTP store by normalized email so verification
    // does not depend on JWT / auth middleware.
    global.emailOtpStore.set(normalizedEmail, {
      otp,
      expiresAt,
    });

    // Send OTP via Brevo
    let emailSent = false;
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Verification OTP</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #007bff; color: white; padding: 30px; border-radius: 8px; text-align: center;">
            <h1>🔐 Your Verification Code</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-top: 20px;">
            <p>Hello,</p>
            <p>Your verification code is:</p>
            <div style="background: white; border: 2px solid #007bff; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
              <h2 style="color: #007bff; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 3px;">${otp}</h2>
            </div>
            <p>This code will expire in <strong>5 minutes</strong>.</p>
            <p style="font-size: 12px; color: #6c757d;">If you didn't request this, please ignore this email.</p>
          </div>
        </body>
        </html>
      `;
      
      emailSent = await sendEmail(
        email,
        "Your Verification OTP - StackOverflow Clone",
        emailHtml
      );
    } catch (error) {
      console.error("[sendEmailOtp] Email sending error:", error.message);
    }

    if (!emailSent) {
      console.log(`OTP for ${email}: ${otp}`);
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      expiresAt,
    });
  } catch (error) {
    console.error("[sendEmailOtp]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

/* ========================= GET CURRENT USER ========================= */
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userid; // set by auth middleware

    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized - No user ID found" 
      });
    }

    const currentUser = await user
      .findById(userId)
      .select("-password -otp -otpExpiry -languageRequested -forgotPasswordAt")
      .populate("friends", "name email joinDate")
      .lean();

    if (!currentUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    return res.status(200).json({
      success: true,
      data: currentUser
    });
  } catch (error) {
    console.error("[getCurrentUser]", error);
    return res.status(500).json({ 
      success: false, 
      message: "Something went wrong" 
    });
  }
};

/* ========================= EMAIL OTP: VERIFY ========================= */
/**
 * POST /api/verify-email-otp
 * Verifies the OTP sent via email
 * Returns success if OTP is valid and not expired
 */
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const normalizedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required for OTP verification.",
      });
    }

    if (!otp || typeof otp !== "string" || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP format. Please enter a 6-digit code.",
      });
    }

    // Get stored OTP from memory
    if (!global.emailOtpStore) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    const stored = global.emailOtpStore.get(normalizedEmail);
    if (!stored) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one.",
      });
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      global.emailOtpStore.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // OTP verified - remove from store
    global.emailOtpStore.delete(normalizedEmail);

    console.log(
      `[verifyEmailOtp] OTP verified successfully for email ${normalizedEmail}`
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("[verifyEmailOtp]", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
};