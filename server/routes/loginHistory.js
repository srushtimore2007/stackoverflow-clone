import express from "express";
import LoginHistory from "../models/LoginHistory.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// GET login history for logged-in user
router.get("/", auth, async (req, res) => {
  try {
    console.log("REQ.USERID:", req.userid); // debug

    if (!req.userid) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No user ID"
      });
    }

    const history = await LoginHistory.find({ userId: req.userid })
      .sort({ loginTime: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: history,
    });

  } catch (error) {
    console.error("LOGIN HISTORY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default router;