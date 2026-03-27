import express from "express";
import { sendEmail } from '../utils/sendEmail.js';
import User from "../models/auth.js";
import bcrypt from "bcryptjs";
import auth from "../middleware/auth.js";
import deviceDetection from "../middleware/deviceDetection.js";
import { registerUser } from "../controller/userController.js";
import { addFriend,getFriendList,sendEmailOtp,verifyEmailOtp, verifyLoginOtp, getCurrentUser } from "../controller/auth.js";
import { Signup, Login, getUserById, searchUsers } from "../controller/auth.js";

const router = express.Router();

router.get("/user/:id", getUserById);
router.get("/current-user", auth, getCurrentUser);
router.get("/friends", auth, getFriendList);
router.post("/login", deviceDetection, Login);
router.post("/signup", Signup);
router.post("/register", registerUser);
router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-login-otp", verifyLoginOtp); 
router.post("/add-friend", auth, addFriend);


// Helper: generate only letters (a-z, A-Z) with proper mix
function generatePassword(length = 8) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const allChars = lowercase + uppercase;
  
  let password = '';
  
  // Ensure at least one uppercase and one lowercase
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  
  // Fill remaining characters with random mix
  for (let i = 2; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    password += allChars.charAt(randomIndex);
  }
  
  // Shuffle to randomize positions
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Route
router.post('/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;

    console.log(" FORGOT PASSWORD HIT:", identifier);

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      });
    }

    // Find user by email
    const user = await User.findOne({ email: identifier.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Rate limiting: check if user requested password reset in last 24 hours
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    if (user.forgotPasswordAt && Date.now() - new Date(user.forgotPasswordAt).getTime() < ONE_DAY_MS) {
      return res.status(429).json({
        success: false,
        message: "You can request password reset only once per day"
      });
    }

    // Generate password (only a-z A-Z, 8 characters)
    const newPassword = generatePassword(8);
    console.log("Generated Password:", newPassword);

    // Hash password with bcrypt (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log("Hashed Password:", hashedPassword);

    // Update user password and timestamp
    user.password = hashedPassword;
    user.forgotPasswordAt = new Date();
    await user.save();

    // Verify update by re-fetching
    const updatedUser = await User.findById(user._id);
    console.log("DB Password After Save:", updatedUser.password.substring(0, 20) + "...");

    // Prepare email content
    const subject = "Password Reset";
    const html = `
      <h2>Password Reset</h2>
      <p>Your new password is:</p>
      <h3>${newPassword}</h3>
      <p>Please login and change it immediately.</p>
    `;

    // Send email
    const emailSent = await sendEmail(identifier, subject, html);

    if (!emailSent) {
      console.error("Email failed but password was reset");
      // Don't fail the request - password was still reset
    }

    return res.json({
      success: true,
      message: "New password has been sent to your email"
    });

  } catch (err) {
    console.error(" Forgot Password Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

router.post("/verify-email-otp", verifyEmailOtp);
router.post("/language", async (req, res) => {
  try {
    const { language } = req.body;

    // You can store language in DB or just return success
    res.json({
      success: true,
      language,
      message: "Language updated successfully"
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
router.patch("/language", async (req, res) => {
  try {
    const { language } = req.body;

    // Example: just return success
    res.json({
      success: true,
      language,
      message: "Language updated successfully"
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ ADD THIS (VERY IMPORTANT)
router.get("/search", searchUsers);
// router.get("/profile", auth, getProfile);

// ✅ Update phone number
router.post("/update-phone", auth, async (req, res) => {
  try {
    const userId = req.user?._id;
    const { phoneNumber } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { phoneNumber, isPhoneVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data: { phoneNumber: user.phoneNumber } });
  } catch (err) {
    console.error("Error in /update-phone:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;