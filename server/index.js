import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cors from "cors";

// Middleware
import deviceDetection from "./middleware/deviceDetection.js";

// Routes
import authRoutes from "./routes/auth.js";
import questionRoutes from "./routes/question.js";
import answerRoutes from "./routes/answer.js";
import subscriptionRoutes from "./routes/subscription.js";
import languageRoutes from "./routes/language.js";
import postRoutes from "./routes/post.js";
import pointsRoutes from "./routes/points.js";
import loginHistoryRoutes from "./routes/loginHistory.js";
import otpRoutes from "./routes/otp.js";
import translateRoutes from "./routes/translate.js";

// ======================
// Load .env
// ======================
dotenv.config({ path: path.resolve('./.env') }); // if .env is in root
// If .env is inside server/, change to './server/.env'

// ======================
// Setup __dirname for ES Modules
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ======================
// Middleware
// ======================
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(deviceDetection);
const allowedOrigins = [
  "http://localhost:3000",                        // local dev
  "https://stackoverflow-clone-tau.vercel.app"    // deployed frontend
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow requests like Postman
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));app.set("trust proxy", true); // for cloud deployments

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ======================
// Routes
// ======================
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/answer", answerRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/language", languageRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/points", pointsRoutes);
app.use("/api/login-history", loginHistoryRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/translate", translateRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Stackoverflow clone is running perfect 🚀");
});

// ======================
// MongoDB Connection
// ======================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI is missing in .env file");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });