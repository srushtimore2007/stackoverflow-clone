import express from "express";
import {
  Askquestion,
  deletequestion,
  getallquestion,
  votequestion,
} from "../controller/question.js";
import auth from "../middleware/auth.js";
import checkQuestionLimit from "../middleware/checkQuestionLimit.js";

const router = express.Router();

// Create question with subscription limit check
router.post("/ask", auth, checkQuestionLimit, Askquestion);
router.post("/create", auth, checkQuestionLimit, Askquestion); // Alias for consistency

// Existing routes
router.get("/getallquestion", getallquestion);
router.delete("/delete/:id", auth, deletequestion);
router.patch("/vote/:id", auth, votequestion);

export default router;