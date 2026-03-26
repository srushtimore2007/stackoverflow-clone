import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    subscriptionPlan: {
      type: String,
      enum: ["FREE", "BRONZE", "SILVER", "GOLD"],
      default: "FREE",
    },
    subscriptionExpiry: {
      type: Date,
      default: null,
    },
    dailyQuestionCount: {
      type: Number,
      default: 0,
    },
    lastQuestionDate: {
      type: Date,
      default: null,
    },
    razorpayCustomerId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Check if subscription is active
userSchema.methods.isSubscriptionActive = function () {
  if (this.subscriptionPlan === "FREE") return true;
  if (!this.subscriptionExpiry) return false;
  return this.subscriptionExpiry > new Date();
};

// ✅ Daily question limit
userSchema.methods.getDailyQuestionLimit = function () {
  const limits = {
    FREE: 1,
    BRONZE: 5,
    SILVER: 10,
    GOLD: Infinity,
  };
  return limits[this.subscriptionPlan] || 1;
};

// ✅ Reset daily count if new day
userSchema.methods.resetDailyCountIfNeeded = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = this.lastQuestionDate
    ? new Date(this.lastQuestionDate)
    : null;

  if (!lastDate) {
    this.dailyQuestionCount = 0;
    this.lastQuestionDate = new Date();
    return true;
  }

  lastDate.setHours(0, 0, 0, 0);

  if (today.getTime() > lastDate.getTime()) {
    this.dailyQuestionCount = 0;
    this.lastQuestionDate = new Date();
    return true;
  }

  return false;
};

export default mongoose.model("User", userSchema);
