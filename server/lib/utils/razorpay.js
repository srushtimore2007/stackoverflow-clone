// import Razorpay from "razorpay";
// import crypto from "crypto";
// import dotenv from "dotenv";

// // Load environment variables
// dotenv.config();

// // Validate environment variables on startup
// if (!process.env.RAZORPAY_KEY_ID) {
//   console.error('❌ RAZORPAY_KEY_ID not found in environment variables');
//   console.error('Please add RAZORPAY_KEY_ID to your .env file');
// }

// if (!process.env.RAZORPAY_KEY_SECRET) {
//   console.error('❌ RAZORPAY_KEY_SECRET not found in environment variables');
//   console.error('Please add RAZORPAY_KEY_SECRET to your .env file');
// }

// const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// console.log('✅ Razorpay instance initialized with key_id:', process.env.RAZORPAY_KEY_ID?.substring(0, 10) + '...');

// export const createOrder = async (amount, currency = "INR", receipt) => {
//   try {
//     // Validate environment variables
//     if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
//       throw new Error('Razorpay credentials not configured in environment variables');
//     }

//     // Validate parameters
//     if (!amount || amount <= 0) {
//       throw new Error('Invalid amount: must be a positive number');
//     }
//     if (!receipt || typeof receipt !== 'string') {
//       throw new Error('Invalid receipt: must be a non-empty string');
//     }

//     console.log('Creating Razorpay order:', { amount, currency, receipt });
    
//     const order = await razorpayInstance.orders.create({
//       amount,
//       currency,
//       receipt,
//       payment_capture: 1,
//     });
    
//     console.log('Razorpay order created successfully:', { orderId: order.id, amount: order.amount });
//     return order;
//   } catch (error) {
//     console.error("Razorpay order creation error:", {
//       error: error.message,
//       stack: error.stack,
//       amount,
//       currency,
//       receipt
//     });
//     throw new Error(`Failed to create payment order: ${error.message}`);
//   }
// };

// export const verifyPaymentSignature = (orderId, paymentId, signature) => {
//   try {
//     // Validate environment variables
//     if (!process.env.RAZORPAY_KEY_SECRET) {
//       throw new Error('Razorpay secret not configured in environment variables');
//     }

//     // Validate parameters
//     if (!orderId || !paymentId || !signature) {
//       throw new Error('Missing required parameters for signature verification');
//     }

//     const body = `${orderId}|${paymentId}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");
    
//     console.log('Verifying payment signature:', { 
//       orderId, 
//       paymentId, 
//       signatureValid: expectedSignature === signature 
//     });
    
//     return expectedSignature === signature;
//   } catch (error) {
//     console.error("Signature verification error:", error.message);
//     return false;
//   }
// };

// export default razorpayInstance;

import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// ✅ Validate ENV on startup
if (!process.env.RAZORPAY_KEY_ID) {
  console.error("❌ RAZORPAY_KEY_ID missing in .env");
}
if (!process.env.RAZORPAY_KEY_SECRET) {
  console.error("❌ RAZORPAY_KEY_SECRET missing in .env");
}

// ✅ Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log(
  "✅ Razorpay initialized:",
  process.env.RAZORPAY_KEY_ID?.slice(0, 10) + "..."
);

// ✅ CREATE ORDER
export const createOrder = async (amount, currency = "INR", receipt) => {
  try {
    // 🔒 ENV validation
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }

    // 🧪 Input validation
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}`);
    }

    if (!receipt || typeof receipt !== "string") {
      throw new Error("Invalid receipt");
    }

    console.log("📦 Creating Razorpay order:", {
      amount,
      currency,
      receipt,
    });

    const order = await razorpayInstance.orders.create({
      amount: Number(amount), // ensure number
      currency,
      receipt,
    });

    console.log("✅ Order created:", {
      order_id: order.id,
      amount: order.amount,
    });

    return order;
  } catch (error) {
    // 🔥 FULL ERROR LOG (VERY IMPORTANT)
    console.error("❌ Razorpay FULL ERROR:", {
      full: error,
      message: error?.message,
      description: error?.error?.description,
      code: error?.error?.code,
      amount,
      currency,
      receipt,
    });

    // ✅ Proper error message extraction
    const errorMsg =
      error?.error?.description ||
      error?.message ||
      "Unknown Razorpay error";

    throw new Error(`Failed to create payment order: ${errorMsg}`);
  }
};

// ✅ VERIFY SIGNATURE
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay secret not configured");
    }

    if (!orderId || !paymentId || !signature) {
      throw new Error("Missing parameters for signature verification");
    }

    const body = `${orderId}|${paymentId}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === signature;

    console.log("🔐 Signature verification:", {
      orderId,
      paymentId,
      isValid,
    });

    return isValid;
  } catch (error) {
    console.error("❌ Signature verification error:", error);
    return false;
  }
};

export default razorpayInstance;