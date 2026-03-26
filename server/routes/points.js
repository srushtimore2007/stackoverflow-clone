import express from "express";
import auth from "../middleware/auth.js";
import {
  getMyPoints,
  getPointsHistory,
  getUserPointsSummary,
  transferPoints,
} from "../controller/pointsController.js";

const router = express.Router();

// Summary for current user
router.get("/me", auth, getMyPoints);

// Public-ish summary for profile display
router.get("/user/:id", getUserPointsSummary);

// Full history for logged-in user
router.get("/history", auth, getPointsHistory);

// Transfer points
router.post("/transfer", auth, transferPoints);

export default router;

