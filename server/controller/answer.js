import mongoose from "mongoose";
import question from "../models/question.js";
import { applyPointsDelta } from "../lib/rewards.js";

export const Askanswer = async (req, res) => {
  const { id: _id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  const { answerbody, useranswered } = req.body;
  const userId = req.userid; // trust auth middleware

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!answerbody || typeof answerbody !== "string" || !answerbody.trim()) {
    return res.status(400).json({ message: "Answer body is required" });
  }

  try {
    const answerId = new mongoose.Types.ObjectId();
    const answerDoc = {
      _id: answerId,
      answerbody: answerbody,
      useranswered: useranswered,
      userid: String(userId),
      answeredon: new Date(),
      upvote: [],
      downvote: [],
      isActive: true,
      rewardedForFiveUpvotes: false,
    };

    const updatedQuestion = await question.findByIdAndUpdate(
      _id,
      {
        $push: { answer: answerDoc },
        $inc: { noofanswer: 1 },
      },
      { new: true }
    );

    // +5 points when a user posts an answer
    try {
      await applyPointsDelta(userId, 5, {
        type: "earned",
        referenceId: String(answerId),
        meta: { action: "post_answer", questionId: String(_id) },
      });
    } catch (err) {
      console.error("[Askanswer] Failed to award points:", err?.message || err);
    }

    res.status(200).json({ data: updatedQuestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

export const deleteanswer = async (req, res) => {
  const { id: _id } = req.params;
  const { answerid } = req.body;
  const requesterId = req.userid;

  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerid)) {
    return res.status(400).json({ message: "answer unavailable" });
  }

  try {
    const q = await question.findById(_id);
    if (!q) return res.status(404).json({ message: "question unavailable" });

    const ans = q.answer?.id(answerid);
    if (!ans) return res.status(404).json({ message: "answer unavailable" });

    // Only the answer owner can delete their answer
    if (String(ans.userid) !== String(requesterId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const answerOwnerId = ans.userid;
    const wasRewardedForFive = Boolean(ans.rewardedForFiveUpvotes);

    // Remove answer + adjust count
    ans.deleteOne();
    q.noofanswer = Math.max(0, (q.noofanswer || 0) - 1);
    const updatedQuestion = await q.save();

    // Deduct points if an answer is removed/deleted (+ optional deduction if it had 5-upvote reward)
    try {
      await applyPointsDelta(answerOwnerId, -5, {
        type: "deducted",
        referenceId: String(answerid),
        meta: { action: "delete_answer", questionId: String(_id) },
      });

      if (wasRewardedForFive) {
        await applyPointsDelta(answerOwnerId, -5, {
          type: "deducted",
          referenceId: String(answerid),
          meta: { action: "delete_answer_revoke_5_upvotes_reward", questionId: String(_id) },
        });
      }
    } catch (err) {
      console.error("[deleteanswer] Failed to deduct points:", err?.message || err);
    }

    res.status(200).json({ data: updatedQuestion });
  } catch (error) {
    console.log(error);
    res.status(500).json("something went wrong..");
    return;
  }
};

// ==========================
// VOTE ANSWER (upvote/downvote)
// ==========================
export const voteAnswer = async (req, res) => {
  const { questionId, answerId } = req.params;
  const { value } = req.body;
  const voterId = req.userid;

  if (!voterId) return res.status(401).json({ message: "Unauthorized" });
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: "answer unavailable" });
  }
  if (value !== "upvote" && value !== "downvote") {
    return res.status(400).json({ message: "Invalid vote value" });
  }

  try {
    const q = await question.findById(questionId);
    if (!q) return res.status(404).json({ message: "question unavailable" });

    const ans = q.answer?.id(answerId);
    if (!ans) return res.status(404).json({ message: "answer unavailable" });
    if (ans.isActive === false) {
      return res.status(400).json({ message: "Cannot vote on an inactive answer" });
    }

    const voter = String(voterId);
    ans.upvote = ans.upvote || [];
    ans.downvote = ans.downvote || [];

    const upIndex = ans.upvote.findIndex((id) => id === voter);
    const downIndex = ans.downvote.findIndex((id) => id === voter);

    if (value === "upvote") {
      if (downIndex !== -1) ans.downvote = ans.downvote.filter((id) => id !== voter);
      if (upIndex === -1) ans.upvote.push(voter);
      else ans.upvote = ans.upvote.filter((id) => id !== voter);
    } else {
      if (upIndex !== -1) ans.upvote = ans.upvote.filter((id) => id !== voter);
      if (downIndex === -1) {
        ans.downvote.push(voter);
        try {
          await applyPointsDelta(ans.userid, -1, {
            type: "deducted",
            referenceId: String(answerId),
            meta: { action: "received_downvote", questionId: String(questionId) },
          });
        } catch (err) {
          console.error("[voteAnswer] Failed to deduct point for downvote:", err?.message || err);
        }
      }
      else {
        ans.downvote = ans.downvote.filter((id) => id !== voter);
      }
    }

    // +5 points when the answer receives 5 upvotes (award once)
    const upvoteCount = (ans.upvote || []).length;
    if (upvoteCount >= 5 && !ans.rewardedForFiveUpvotes) {
      ans.rewardedForFiveUpvotes = true;
      try {
        await applyPointsDelta(ans.userid, 5, {
          type: "earned",
          referenceId: String(answerId),
          meta: { action: "answer_reached_5_upvotes", questionId: String(questionId) },
        });
      } catch (err) {
        console.error("[voteAnswer] Failed to award 5-upvotes points:", err?.message || err);
      }
    }

    const updatedQuestion = await q.save();
    return res.status(200).json({ data: updatedQuestion });
  } catch (error) {
    console.error("[voteAnswer]", error);
    return res.status(500).json("something went wrong..");
  }
};

// ==========================
// MARK ANSWER INACTIVE (downtime)
// ==========================
export const markAnswerInactive = async (req, res) => {
  const { questionId, answerId } = req.params;
  const requesterId = req.userid;

  if (!requesterId) return res.status(401).json({ message: "Unauthorized" });
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "question unavailable" });
  }
  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: "answer unavailable" });
  }

  try {
    const q = await question.findById(questionId);
    if (!q) return res.status(404).json({ message: "question unavailable" });

    const ans = q.answer?.id(answerId);
    if (!ans) return res.status(404).json({ message: "answer unavailable" });

    if (String(ans.userid) !== String(requesterId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (ans.isActive === false) {
      return res.status(200).json({ message: "Answer already inactive", data: q });
    }

    ans.isActive = false;
    const updatedQuestion = await q.save();

    // Deduct points if downtime occurs (answer marked inactive)
    try {
      await applyPointsDelta(ans.userid, -5, {
        type: "deducted",
        referenceId: String(answerId),
        meta: { action: "answer_marked_inactive", questionId: String(questionId) },
      });
    } catch (err) {
      console.error("[markAnswerInactive] Failed to deduct points:", err?.message || err);
    }

    return res.status(200).json({ data: updatedQuestion });
  } catch (error) {
    console.error("[markAnswerInactive]", error);
    return res.status(500).json("something went wrong..");
  }
};
