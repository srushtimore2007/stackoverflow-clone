import mongoose from "mongoose";
import nodemailer from "nodemailer";
import user from "../models/auth.js";
import LoginHistory from "../models/LoginHistory.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

/**
 * Generate a secure password: only A-Z, a-z, length 8-12,
 * at least 1 uppercase and 1 lowercase.
 */
function generateSecurePassword() {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const all = lower + upper;
  const len = 8 + Math.floor(Math.random() * 5); // 8 to 12

  let pwd = "";
  pwd += lower.charAt(Math.floor(Math.random() * lower.length));
  pwd += upper.charAt(Math.floor(Math.random() * upper.length));
  for (let i = 2; i < len; i++) {
    pwd += all.charAt(Math.floor(Math.random() * all.length));
  }
  // Shuffle
  return pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

/* ========================= SIGNUP ========================= */
export const Signup = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exisitinguser = await user.findOne({ email });
    if (exisitinguser) {
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
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= LOGIN ========================= */
// export const Login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const exisitinguser = await user.findOne({ email });
//     if (!exisitinguser) {
//       return res.status(404).json({ message: "User does not exist" });
//     }

//     const ispasswordcrct = await bcrypt.compare(password, exisitinguser.password);
//     if (!ispasswordcrct) {
//       return res.status(400).json({ message: "Invalid password" });
//     }

//     const token = jwt.sign(
//       { email: exisitinguser.email, id: exisitinguser._id },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.status(200).json({ data: exisitinguser, token });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Something went wrong" });
//   }
// };



export const Login = async (req, res) => {
  const { email, password } = req.body;

  console.log("EMAIL:", email);
  console.log("PASSWORD:", password);

  try {
    const exisitinguser = await user.findOne({ email });

    console.log("USER:", exisitinguser);

    if (!exisitinguser) {
      return res.status(404).json({
        success: false,
        requiresOTP: false,
        message: "User does not exist"
      });
    }

    const ispasswordcrct = await bcrypt.compare(
      password,
      exisitinguser.password
    );

    console.log("PASSWORD MATCH:", ispasswordcrct);
    console.log("INPUT PASSWORD:", password);
    console.log("STORED HASH:", exisitinguser.password.substring(0, 20) + "...");

    if (!ispasswordcrct) {
      return res.status(400).json({
        success: false,
        requiresOTP: false,
        message: "Invalid password"
      });
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
    const browser = deviceInfo.browser || "Unknown";
    const deviceType = deviceInfo.deviceType || "desktop"; // "mobile" or "desktop"
    
    // Browser-based OTP requirements
    let requiresOTP = false;
    if (browser.toLowerCase().includes("chrome")) {
      requiresOTP = true; // Chrome requires OTP
    } else if (browser.toLowerCase().includes("edge")) {
      requiresOTP = false; // Edge allows direct login
    } else {
      requiresOTP = true; // All other browsers require OTP
    }

    // Mobile device time restriction (10 AM - 1 PM server time)
    if (deviceType === "mobile") {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      // Server time: 10:00 AM to 1:00 PM (10:00 = 600 minutes, 13:00 = 780 minutes)
      const allowedStartMinutes = 10 * 60; // 10:00 AM
      const allowedEndMinutes = 13 * 60; // 1:00 PM
      
      if (currentTimeMinutes < allowedStartMinutes || currentTimeMinutes >= allowedEndMinutes) {
        return res.status(403).json({
          success: false,
          requiresOTP: false,
          message: "Mobile device login allowed only between 10 AM to 1 PM (server time)"
        });
      }
    }

    // ✅ Store login history
    try {
      await LoginHistory.create({
        userId: exisitinguser._id,
        ip: deviceInfo.ip,
        browser: browser,
        os: deviceInfo.os,
        deviceType: deviceType === "mobile" ? "Mobile" : "Desktop", // Match enum in model
        loginTime: new Date(),
      });
      console.log("Login history saved");
    } catch (historyError) {
      console.error("[Login] Failed to save login history:", historyError);
      // Don't fail login if history save fails, just log it
    }

    // ✅ OTP handling
    if (requiresOTP) {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

      // Store OTP in memory
      if (!global.loginOtpStore) {
        global.loginOtpStore = new Map();
      }
      global.loginOtpStore.set(exisitinguser.email, {
        otp,
        expiresAt,
        userId: exisitinguser._id
      });

      // Send OTP via email
      try {
        const emailSent = await sendEmail(
          exisitinguser.email,
          "Login Verification OTP",
          `
            <h2>Login Verification</h2>
            <p>Your OTP for login verification is:</p>
            <h3>${otp}</h3>
            <p>This OTP will expire in 5 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `
        );

        if (!emailSent) {
          console.error("Failed to send OTP email, but proceeding with OTP requirement");
        }
      } catch (emailError) {
        console.error("[Login] Email sending error:", emailError);
      }

      return res.status(200).json({
        success: true,
        requiresOTP: true,
        message: "OTP sent to your email. Please verify to complete login."
      });
    }

    // ✅ Direct login (no OTP required)
    const token = jwt.sign(
      { email: exisitinguser.email, id: exisitinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      requiresOTP: false,
      message: "Login successful",
      data: exisitinguser,
      token
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      requiresOTP: false,
      message: "Something went wrong"
    });
  }
};



/* ========================= FORGOT PASSWORD ========================= */
export const forgotPassword = async (req, res) => {
  const { identifier, identifierType } = req.body;

  try {
    // Validate input
    const trimmed = typeof identifier === "string" ? identifier.trim() : "";
    if (!trimmed) {
      return res.status(400).json({ message: "Email or phone is required" });
    }

    // Determine type: explicit or auto-detect (email contains @)
    const type =
      identifierType === "email" || identifierType === "phone"
        ? identifierType
        : trimmed.includes("@")
          ? "email"
          : "phone";

    let existingUser;
    if (type === "email") {
      existingUser = await user.findOne({ email: trimmed.toLowerCase() });
    } else {
      const normalizedPhone = trimmed.replace(/[\s\-\(\)]/g, "");
      existingUser = await user.findOne({ phone: normalizedPhone });
    }

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Rate limit: only 1 request per 24 hours
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (
      existingUser.forgotPasswordAt &&
      Date.now() - new Date(existingUser.forgotPasswordAt).getTime() < ONE_DAY_MS
    ) {
      return res.status(429).json({
        message: "You can request password reset only once per day",
      });
    }

    // Generate secure password: A-Z a-z only, 8-12 chars, at least 1 upper + 1 lower
    const newPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    existingUser.password = hashedPassword;
    existingUser.forgotPasswordAt = new Date();
    await existingUser.save();

    // Send password via email (never expose in API response)
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;
    const recipientEmail = existingUser.email;

    let emailSent = false;
    if (recipientEmail && emailUser && emailPass) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        });
        await transporter.sendMail({
          from: emailUser,
          to: recipientEmail,
          subject: "Password Reset",
          text: `Your new password is: ${newPassword}\n\nPlease change it after logging in.`,
          html: `<p>Your new password is: <strong>${newPassword}</strong></p><p>Please change it after logging in.</p>`,
        });
        emailSent = true;
      } catch (err) {
        console.error("[ForgotPassword] Email failed:", err.message);
      }
    }

    if (!emailSent) {
      console.log("[ForgotPassword] Fallback - new password:", newPassword);
    }

    return res.status(200).json({
      success: true,
      message: "New password has been sent to your email",
    });
  } catch (error) {
    console.error("[ForgotPassword]", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

/* ========================= GET ALL USERS ========================= */
export const getallusers = async (req, res) => {
  try {
    const alluser = await user.find();
    res.status(200).json({ data: alluser });
  } catch (error) {
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    // - Send via email (using nodemailer) or SMS (using Twilio)
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

    // Key the OTP store by normalized email so verification
    // does not depend on JWT / auth middleware.
    global.emailOtpStore.set(normalizedEmail, {
      otp,
      expiresAt,
    });

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD;

    if (emailUser && emailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      await transporter.sendMail({
        from: emailUser,
        to: email,
        subject: "Your Verification OTP",
        text: `Your OTP is: ${otp}. It expires in 5 minutes.`,
      });
    } else {
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