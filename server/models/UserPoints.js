import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["earned", "transferred", "received", "deducted"],
      required: true,
    },
    points: { type: Number, required: true, min: 1 },
    referenceId: { type: String, default: null },
    date: { type: Date, default: Date.now },
    // Optional metadata for future audit/debugging
    meta: { type: Object, default: {} },
  },
  { _id: false }
);

const userPointsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
      index: true,
    },
    points: { type: Number, default: 0, min: 0 },
    badges: { type: [String], default: [] },
    transactionHistory: { type: [transactionSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("UserPoints", userPointsSchema);

