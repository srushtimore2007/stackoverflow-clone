export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free Plan',
    price: 0, // ₹0
    currency: 'INR',
    questionLimit: 1,
    duration: 30 // days
  },
  BRONZE: {
    name: 'Bronze Plan',
    price: 10000, // ₹100 in paise (Razorpay uses paise)
    currency: 'INR',
    questionLimit: 5,
    duration: 30 // days
  },
  SILVER: {
    name: 'Silver Plan',
    price: 30000, // ₹300 in paise
    currency: 'INR',
    questionLimit: 10,
    duration: 30 // days
  },
  GOLD: {
    name: 'Gold Plan',
    price: 100000, // ₹1000 in paise
    currency: 'INR',
    questionLimit: Infinity,
    duration: 30 // days
  }
};

export const PAYMENT_WINDOW = {
  startHour: 10, // 10 AM
  endHour: 11, // 11 AM
  timezone: 'Asia/Kolkata' // IST
};
