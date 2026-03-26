import mongoose from "mongoose";
import user from "../models/auth.js";
import UserPoints from "../models/UserPoints.js";
import { applyPointsDelta, getOrCreateUserPoints } from "../lib/rewards.js";

export const getMyPoints = async (req, res) => {
  try {
    const userId = req.userid;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const pointsDoc = await getOrCreateUserPoints(userId);
    return res.status(200).json({
      success: true,
      data: {
        userId: pointsDoc.userId,
        points: pointsDoc.points,
        badges: pointsDoc.badges,
      },
    });
  } catch (err) {
    console.error("[getMyPoints]", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserPointsSummary = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Ensure user exists (clean error)
    const exists = await user.findById(id).select("_id").lean();
    if (!exists) return res.status(404).json({ message: "User not found" });

    const pointsDoc = await getOrCreateUserPoints(id);
    return res.status(200).json({
      success: true,
      data: {
        userId: pointsDoc.userId,
        points: pointsDoc.points,
        badges: pointsDoc.badges,
      },
    });
  } catch (err) {
    console.error("[getUserPointsSummary]", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getPointsHistory = async (req, res) => {
  try {
    const userId = req.userid;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const pointsDoc = await getOrCreateUserPoints(userId);
    const history = (pointsDoc.transactionHistory || []).slice().sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return res.status(200).json({
      success: true,
      data: {
        userId: pointsDoc.userId,
        points: pointsDoc.points,
        badges: pointsDoc.badges,
        transactionHistory: history,
      },
    });
  } catch (err) {
    console.error("[getPointsHistory]", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const transferPoints = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const senderId = req.userid;
    if (!senderId) return res.status(401).json({ message: "Unauthorized" });

    const { recipientId, points } = req.body || {};

    if (!recipientId || !mongoose.Types.ObjectId.isValid(String(recipientId))) {
      return res.status(400).json({ message: "Invalid recipient user" });
    }
    if (String(recipientId) === String(senderId)) {
      return res.status(400).json({ message: "Cannot transfer points to yourself" });
    }

    const amount = Number(points);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(amount)) {
      return res.status(400).json({ message: "Invalid points amount" });
    }

    // Ensure recipient exists
    const recipientUser = await user.findById(recipientId).select("_id").lean();
    if (!recipientUser) return res.status(404).json({ message: "Recipient not found" });

    // Use a transaction when possible (best effort)
    let result = null;
    try {
      await session.withTransaction(async () => {
        const senderPoints = await getOrCreateUserPoints(senderId, { session });
        if (!(senderPoints.points > 10)) {
          // requirement: more than 10 points
          throw new Error("INSUFFICIENT_POINTS_TO_TRANSFER");
        }
        if (amount > senderPoints.points) {
          throw new Error("AMOUNT_EXCEEDS_POINTS");
        }

        await applyPointsDelta(senderId, -amount, {
          type: "transferred",
          referenceId: String(recipientId),
          meta: { toUserId: String(recipientId) },
          session,
        });

        await applyPointsDelta(recipientId, amount, {
          type: "received",
          referenceId: String(senderId),
          meta: { fromUserId: String(senderId) },
          session,
        });

        const updatedSender = await UserPoints.findOne({ userId: senderId }).session(session);
        const updatedRecipient = await UserPoints.findOne({ userId: recipientId }).session(session);

        result = {
          sender: {
            userId: updatedSender.userId,
            points: updatedSender.points,
            badges: updatedSender.badges,
          },
          recipient: {
            userId: updatedRecipient.userId,
            points: updatedRecipient.points,
            badges: updatedRecipient.badges,
          },
        };
      });
    } catch (txErr) {
      // Many local MongoDB setups are standalone and don't support transactions.
      const msg = String(txErr?.message || txErr);
      const looksLikeNoTx =
        msg.includes("Transaction numbers") ||
        msg.includes("replica set") ||
        msg.includes("mongos") ||
        msg.includes("transactions");

      if (!looksLikeNoTx) throw txErr;

      // Fallback: non-transactional transfer (still validates + prevents negatives)
      const senderPoints = await getOrCreateUserPoints(senderId);
      if (!(senderPoints.points > 10)) {
        throw new Error("INSUFFICIENT_POINTS_TO_TRANSFER");
      }
      if (amount > senderPoints.points) {
        throw new Error("AMOUNT_EXCEEDS_POINTS");
      }

      await applyPointsDelta(senderId, -amount, {
        type: "transferred",
        referenceId: String(recipientId),
        meta: { toUserId: String(recipientId) },
      });

      await applyPointsDelta(recipientId, amount, {
        type: "received",
        referenceId: String(senderId),
        meta: { fromUserId: String(senderId) },
      });

      const updatedSender = await UserPoints.findOne({ userId: senderId });
      const updatedRecipient = await UserPoints.findOne({ userId: recipientId });
      result = {
        sender: {
          userId: updatedSender.userId,
          points: updatedSender.points,
          badges: updatedSender.badges,
        },
        recipient: {
          userId: updatedRecipient.userId,
          points: updatedRecipient.points,
          badges: updatedRecipient.badges,
        },
      };
    }

    return res.status(200).json({
      success: true,
      message: "Points transferred successfully",
      data: result,
    });
  } catch (err) {
    if (err?.message === "INSUFFICIENT_POINTS_TO_TRANSFER") {
      return res.status(400).json({ message: "Insufficient points to transfer." });
    }
    if (err?.message === "AMOUNT_EXCEEDS_POINTS") {
      return res.status(400).json({ message: "Transfer amount exceeds current points." });
    }
    console.error("[transferPoints]", err);
    return res.status(500).json({ message: "Something went wrong" });
  } finally {
    session.endSession();
  }
};

