import mongoose from "mongoose";
import UserPoints from "../models/UserPoints.js";
import user from "../models/auth.js";

function computeBadges(points) {
  // Keep it simple + deterministic (can be expanded later)
  const badges = [];
  if (points >= 0) badges.push("Newbie");
  if (points >= 10) badges.push("Contributor");
  if (points >= 50) badges.push("Enthusiast");
  if (points >= 100) badges.push("Expert");
  return badges;
}

export async function getOrCreateUserPoints(userId, { session } = {}) {
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    throw new Error("Invalid userId");
  }

  const existing = await UserPoints.findOne({ userId }).session(session || null);
  if (existing) return existing;

  const created = await UserPoints.create(
    [
      {
        userId,
        points: 0,
        badges: computeBadges(0),
        transactionHistory: [],
      },
    ],
    session ? { session } : undefined
  );
  return created[0];
}

/**
 * Apply points delta and log transaction. Never allows negative points.
 * Returns the updated UserPoints doc.
 */
export async function applyPointsDelta(
  userId,
  delta,
  { type, referenceId = null, meta = {}, session } = {}
) {
  if (!Number.isFinite(delta) || delta === 0) {
    throw new Error("Invalid delta");
  }
  if (!type) throw new Error("Transaction type required");

  const userPoints = await getOrCreateUserPoints(userId, { session });

  const current = userPoints.points || 0;
  let actualDelta = delta;
  if (delta < 0) {
    // Clamp deductions so points never go below 0
    actualDelta = -Math.min(current, Math.abs(delta));
  }

  const nextPoints = Math.max(0, current + actualDelta);
  userPoints.points = nextPoints;
  userPoints.badges = computeBadges(nextPoints);

  userPoints.transactionHistory.unshift({
    type,
    points: Math.abs(actualDelta),
    referenceId,
    date: new Date(),
    meta,
  });

  await userPoints.save({ session });

  // Keep cached fields on user profile in sync (best effort)
  try {
    await user.findByIdAndUpdate(
      userId,
      { $set: { points: nextPoints, badges: userPoints.badges } },
      session ? { session } : undefined
    );
  } catch (e) {
    // Do not block core flow if cache update fails
    console.error("[applyPointsDelta] Failed to sync user cache:", e?.message || e);
  }
  return userPoints;
}

