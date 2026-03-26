import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user', // Matches the model name in auth.js
    required: true
  },
  plan: {
    type: String,
    enum: ["BRONZE", "SILVER", "GOLD"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  razorpayOrderId: {
    type: String,
    required: false
  },
  razorpayPaymentId: {
    type: String,
    default: null,
    required:false
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  startDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  invoiceId: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Generate invoice ID
subscriptionSchema.pre('save', async function(next) {
  if (!this.invoiceId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.invoiceId = `INV-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.model('Subscription', subscriptionSchema);