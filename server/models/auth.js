import mongoose from "mongoose";

const userschema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: null },
  password: { type: String, required: true },
  about: { type: String },
  tags: { type: [String] },
  joinDate: { type: Date, default: Date.now },

  // ✅ Rewards: cached points/badges (source of truth is UserPoints collection)
  points: { type: Number, default: 0, min: 0 },
  badges: { type: [String], default: [] },

  // ✅ Forgot-password throttling field
  forgotPasswordAt: {
    type: Date,
    default: null,
  },

  // ✅ Subscription fields
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

  // ✅ Preferred language for multi-language support
  preferredLanguage: {
    type: String,
    enum: ["en", "hi", "es", "pt", "zh", "fr"],
    default: "en",
  },

  // ✅ OTP for language switching verification
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
  languageRequested: { type: String, default: null },

  // ✅ Mobile number for SMS OTP (used for non-French language switch)
  mobileNumber: { type: String, default: null },

  // ✅ Public Space - friends and posting limits
  friends: { type: [mongoose.Schema.Types.ObjectId], ref: "user", default: [] },
  postsCreatedToday: { type: Number, default: 0 },
  lastPostDate: { type: Date, default: null },
});

// ✅ Check if subscription is active
userschema.methods.isSubscriptionActive = function () {
  if (this.subscriptionPlan === "FREE") return true;
  if (!this.subscriptionExpiry) return false;
  return this.subscriptionExpiry > new Date();
};

// ✅ Get daily question limit based on plan
userschema.methods.getDailyQuestionLimit = function () {
  const limits = {
    FREE: 1,
    BRONZE: 5,
    SILVER: 10,
    GOLD: Infinity,
  };
  return limits[this.subscriptionPlan] || 1;
};

// ✅ Reset daily count if it's a new day
userschema.methods.resetDailyCountIfNeeded = function () {
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

export default mongoose.model("user", userschema);
