import mongoose from "mongoose";

const loginHistorySchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
    index: true, // Index for faster queries
  },
  ip: {
    type: String,
    required: true,
  },
  browser: {
    type: String,
    required: true,
  },
  os: {
    type: String,
    required: true,
  },
  deviceType: {
    type: String,
    enum: ["Mobile", "Desktop", "Laptop", "Tablet", "Unknown"],
    required: true,
  },
  loginTime: {
    type: Date,
    default: Date.now,
    required: true,
    index: true, // Index for sorting by date
  },
});

// Compound index for efficient queries: userId + loginTime (descending)
loginHistorySchema.index({ userId: 1, loginTime: -1 });

export default mongoose.model("LoginHistory", loginHistorySchema);
