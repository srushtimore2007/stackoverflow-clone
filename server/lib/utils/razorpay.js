// import Razorpay from 'razorpay';
// import crypto from 'crypto';

// const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET
// });

// export const createOrder = async (amount, currency = 'INR', receipt) => {
//   try {
//     const options = {
//       amount: amount,
//       currency,
//       receipt,
//       payment_capture: 1
//     };

//     const order = await razorpayInstance.orders.create(options);
//     return order;
//   } catch (error) {
//     console.error('Razorpay order creation error:', error);
//     throw new Error('Failed to create payment order');
//   }
// };

// export const verifyPaymentSignature = (orderId, paymentId, signature) => {
//   try {
//     const body = orderId + '|' + paymentId;
//     const expectedSignature = crypto
//       .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
//       .update(body.toString())
//       .digest('hex');

//     return expectedSignature === signature;
//   } catch (error) {
//     console.error('Signature verification error:', error);
//     return false;
//   }
// };

// export const fetchPayment = async (paymentId) => {
//   try {
//     const payment = await razorpayInstance.payments.fetch(paymentId);
//     return payment;
//   } catch (error) {
//     console.error('Fetch payment error:', error);
//     throw new Error('Failed to fetch payment details');
//   }
// };

// export { razorpayInstance }

// import Razorpay from "razorpay";
// import crypto from "crypto";

// const razorpayInstance = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// export default razorpayInstance;

// // ----------------- helpers -----------------

// export const createOrder = async (amount, currency = "INR", receipt) => {
//   try {
//     const options = {
//       amount,
//       currency,
//       receipt,
//       payment_capture: 1,
//     };

//     const order = await razorpayInstance.orders.create(options);
//     return order;
//   } catch (error) {
//     console.error("Razorpay order creation error:", error);
//     throw new Error("Failed to create payment order");
//   }
// };

// export const verifyPaymentSignature = (orderId, paymentId, signature) => {
//   try {
//     const body = `${orderId}|${paymentId}`;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body)
//       .digest("hex");

//     return expectedSignature === signature;
//   } catch (error) {
//     console.error("Signature verification error:", error);
//     return false;
//   }
// };

// export const fetchPayment = async (paymentId) => {
//   try {
//     const payment = await razorpayInstance.payments.fetch(paymentId);
//     return payment;
//   } catch (error) {
//     console.error("Fetch payment error:", error);
//     throw new Error("Failed to fetch payment details");
//   }
// };
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();


const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (amount, currency = "INR", receipt) => {
  const order = await razorpayInstance.orders.create({
    amount,
    currency,
    receipt,
    payment_capture: 1,
  });
  return order;
};

export const verifyPaymentSignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
};

export default razorpayInstance;
