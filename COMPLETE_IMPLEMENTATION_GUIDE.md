# Complete Subscription Payment System Implementation Guide

## ✅ Implementation Complete!

All backend and frontend components have been successfully implemented. Here's a comprehensive guide to what was done and how to use it.

---

## 📦 Backend Implementation

### 1. **User Model** (`server/models/auth.js`)
✅ Added subscription fields:
- `subscriptionPlan`: FREE, BRONZE, SILVER, GOLD
- `subscriptionExpiry`: Date when subscription expires
- `dailyQuestionCount`: Number of questions posted today
- `lastQuestionDate`: Last date a question was posted

✅ Added methods:
- `isSubscriptionActive()`: Checks if subscription is valid
- `getDailyQuestionLimit()`: Returns daily limit based on plan
- `resetDailyCountIfNeeded()`: Resets count on new day

### 2. **Subscription Plans** (`server/config/plans.js`)
✅ Configured plans:
- **FREE**: ₹0, 1 question/day
- **BRONZE**: ₹100/month, 5 questions/day
- **SILVER**: ₹300/month, 10 questions/day
- **GOLD**: ₹1000/month, Unlimited questions

### 3. **Payment Time Restriction** (`server/middleware/checkPaymentTime.js`)
✅ Enforces payments ONLY between 10:00 AM - 11:00 AM IST
✅ Returns clear error message when outside window

### 4. **Question Limit Middleware** (`server/middleware/checkQuestionLimit.js`)
✅ Checks daily limits before allowing question posting
✅ Resets daily count on new day
✅ Handles expired subscriptions (fallback to FREE)

### 5. **Subscription Controller** (`server/controller/subscriptionController.js`)
✅ `createSubscriptionOrder`: Creates Razorpay order
✅ `verifySubscriptionPayment`: Verifies payment and activates subscription
✅ `getSubscriptionStatus`: Returns current subscription status

### 6. **Email Service** (`server/lib/utils/emailService.js`)
✅ Sends subscription confirmation emails via Nodemailer
✅ Includes invoice ID, plan name, amount, dates

### 7. **Routes** (`server/routes/subscription.js`)
✅ `GET /api/subscription/status` - Get subscription status
✅ `POST /api/subscription/create-order` - Create payment order (10-11 AM only)
✅ `POST /api/subscription/verify-payment` - Verify payment (10-11 AM only)

---

## 🎨 Frontend Implementation

### 1. **Axios Instance** (`stack/src/lib/axiosinstance.ts`)
✅ Added JWT token interceptor
✅ Automatically adds `Authorization: Bearer <token>` header
✅ Handles 401 errors (redirects to login)

### 2. **Subscription Service** (`stack/src/services/subscriptionService.ts`)
✅ Updated to use axiosInstance
✅ Proper error handling
✅ Correct API endpoints

### 3. **Subscription Hook** (`stack/src/hooks/useSubscription.ts`)
✅ Fetches subscription status
✅ Provides loading and error states
✅ Refetch capability

### 4. **Subscription Plans Component** (`stack/src/components/SubscriptionPlans.tsx`)
✅ Shows all subscription plans
✅ Payment time window check (10 AM - 11 AM IST)
✅ Disables payment button outside window
✅ Razorpay integration

### 5. **Subscription Status Component** (`stack/src/components/SubscriptionStatus.tsx`)
✅ Shows current plan
✅ Displays questions posted today
✅ Shows remaining questions
✅ Shows expiry date

### 6. **Ask Question Page** (`stack/src/pages/ask/questions.tsx`)
✅ Checks subscription limit before posting
✅ Shows subscription status
✅ Displays warning when limit reached
✅ Proper error handling

### 7. **Razorpay Script** (`stack/src/pages/_document.tsx`)
✅ Added Razorpay checkout script

---

## 🔧 Setup Instructions

### Backend Setup

1. **Install Dependencies** (if not already installed):
```bash
cd server
npm install razorpay nodemailer
```

2. **Environment Variables** (`.env`):
```env
# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# JWT
JWT_SECRET=your_jwt_secret

# MongoDB
MONGODB_URL=your_mongodb_connection_string
```

3. **Start Backend Server**:
```bash
cd server
npm start
```

### Frontend Setup

1. **Environment Variables** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

2. **Token Storage**:
Make sure your login flow stores the JWT token in `localStorage`:
```typescript
// After successful login
localStorage.setItem('token', response.data.token);
// or
localStorage.setItem('authToken', response.data.token);
```

3. **Start Frontend**:
```bash
cd stack
npm run dev
```

---

## 🧪 Testing Checklist

### Backend Tests

- [ ] Test FREE plan: Post 1 question, verify limit reached
- [ ] Test BRONZE plan: Post 5 questions, verify limit reached
- [ ] Test SILVER plan: Post 10 questions, verify limit reached
- [ ] Test GOLD plan: Post unlimited questions
- [ ] Test payment time restriction: Try payment outside 10-11 AM IST
- [ ] Test expired subscription: Verify fallback to FREE plan
- [ ] Test daily count reset: Verify reset on new day
- [ ] Test email notification: Verify email sent on successful payment

### Frontend Tests

- [ ] Test subscription status display
- [ ] Test payment button disabled outside 10-11 AM IST
- [ ] Test Razorpay payment flow
- [ ] Test question posting with limit check
- [ ] Test error messages display correctly
- [ ] Test token authentication

---

## 📝 API Usage Examples

### Get Subscription Status
```typescript
import { getSubscriptionStatus } from '../services/subscriptionService';

const status = await getSubscriptionStatus();
console.log(status.subscription);
```

### Create Payment Order
```typescript
import { createSubscriptionOrder } from '../services/subscriptionService';

const order = await createSubscriptionOrder('BRONZE');
// Use order.order.id with Razorpay
```

### Verify Payment
```typescript
import { verifyPayment } from '../services/subscriptionService';

const result = await verifyPayment({
  razorpay_order_id: 'order_xxx',
  razorpay_payment_id: 'pay_xxx',
  razorpay_signature: 'signature_xxx',
  subscriptionId: 'subscription_id'
});
```

### Post Question (with limit check)
```typescript
import axiosInstance from '../lib/axiosinstance';

const response = await axiosInstance.post('/api/questions/ask', {
  postquestiondata: {
    questiontitle: 'How to...',
    questionbody: 'I want to know...',
    questiontags: ['javascript'],
    userposted: 'John Doe',
    userid: 'user_id'
  }
});
```

---

## 🚨 Important Notes

1. **Payment Time Window**: Payments are ONLY allowed between 10:00 AM - 11:00 AM IST. This is enforced on both frontend and backend.

2. **Token Storage**: Make sure your login flow stores the JWT token in `localStorage` with key `'token'` or `'authToken'`.

3. **Razorpay Keys**: 
   - Use test keys for development
   - Use production keys for production
   - Key ID is public (can be in frontend)
   - Key Secret must stay on backend only

4. **Email Configuration**: 
   - For Gmail, use App Password (not regular password)
   - Enable "Less secure app access" or use OAuth2

5. **Daily Count Reset**: Happens automatically when date changes (based on IST timezone)

6. **Subscription Expiry**: After expiry, user automatically falls back to FREE plan

---

## 🐛 Troubleshooting

### Payment Not Working
- Check if current time is between 10 AM - 11 AM IST
- Verify Razorpay keys are correct
- Check browser console for errors

### Token Not Sent
- Verify token is stored in localStorage
- Check axios interceptor is working
- Verify token format: `Bearer <token>`

### Email Not Sending
- Check email credentials
- Verify EMAIL_SERVICE is set correctly
- Check spam folder

### Question Limit Not Working
- Verify subscription status is fetched
- Check daily count reset logic
- Verify middleware is applied to route

---

## 📚 Files Modified/Created

### Backend
- ✅ `server/models/auth.js` - User model with subscription fields
- ✅ `server/models/Subscription.js` - Subscription model
- ✅ `server/config/plans.js` - Subscription plans configuration
- ✅ `server/middleware/checkPaymentTime.js` - Payment time restriction
- ✅ `server/middleware/checkQuestionLimit.js` - Question limit check
- ✅ `server/controller/subscriptionController.js` - Subscription logic
- ✅ `server/controller/question.js` - Updated question posting
- ✅ `server/routes/subscription.js` - Subscription routes
- ✅ `server/lib/utils/razorpay.js` - Razorpay integration
- ✅ `server/lib/utils/emailService.js` - Email service

### Frontend
- ✅ `stack/src/lib/axiosinstance.ts` - Added JWT interceptor
- ✅ `stack/src/services/subscriptionService.ts` - Updated API calls
- ✅ `stack/src/components/SubscriptionPlans.tsx` - Payment UI
- ✅ `stack/src/components/SubscriptionStatus.tsx` - Status display
- ✅ `stack/src/pages/ask/questions.tsx` - Added limit check
- ✅ `stack/src/pages/_document.tsx` - Added Razorpay script

---

## 🎉 You're All Set!

The subscription payment system is fully implemented and ready to use. Follow the setup instructions above and start testing!

For any issues or questions, refer to the troubleshooting section or check the code comments for detailed explanations.
