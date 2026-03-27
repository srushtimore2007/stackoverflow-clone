import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cors from "cors";
import mongoose from "mongoose";

// Middleware
import deviceDetection from "./middleware/deviceDetection.js";

// Existing routes
import authRoutes from "./routes/auth.js";
import questionRoutes from "./routes/question.js";
import answerRoutes from "./routes/answer.js";

// ✅ NEW: Subscription routes
import subscriptionRoutes from "./routes/subscription.js";
import languageRoutes from "./routes/language.js";
import postRoutes from "./routes/post.js";
import pointsRoutes from "./routes/points.js";
import loginHistoryRoutes from "./routes/loginHistory.js";
import mobileOtpRoutes from "./routes/mobileOtp.js";
 
import otpRoutes from "./routes/otp.js";
import translateRoutes from "./routes/translate.js";

const app = express();

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================
// ✅ Middleware FIRST
// ======================
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// Attach device / user-agent info for all requests (used by Login)
app.use(deviceDetection);

// ✅ Trust proxy for accurate IP detection (important for production)
app.set("trust proxy", true);

// ======================
// ✅ CORS
// ======================
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// ======================
// ✅ Test route
// ======================
app.get("/", (req, res) => {
  res.send("Stackoverflow clone is running perfect 🚀");
});

// ======================
// ✅ Routes
// ======================
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes); // (kept consistent with api prefix)
app.use("/api/answer", answerRoutes);

// ✅ NEW: Subscription routes
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/language", languageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/login-history", loginHistoryRoutes);
// app.use("/api/mobile-otp", mobileOtpRoutes);
// app.use("/api/otp", otpRoutes);
// ✅ OTP ROUTES (clean unified)
// import otpRoutes from "./routes/otp.js";
app.use("/api/otp", otpRoutes);

// ✅ Translation routes
app.use("/api/translate", translateRoutes);

// app.use("/api", router);
// ======================
// ✅ Server + DB
// ======================
const PORT = process.env.PORT || 5000;

const databaseurl =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/stackoverflow";

mongoose
  .connect(databaseurl)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // stop server if DB fails
  });

