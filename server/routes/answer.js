import express from "express";
import { Askanswer, deleteanswer, markAnswerInactive, voteAnswer } from "../controller/answer.js";

import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/postanswer/:id",auth, Askanswer);
router.delete("/delete/:id",auth,deleteanswer)

// Vote on an answer (upvote/downvote)
router.patch("/vote/:questionId/:answerId", auth, voteAnswer);

// Mark answer inactive (downtime)
router.patch("/inactive/:questionId/:answerId", auth, markAnswerInactive);


export default router;
