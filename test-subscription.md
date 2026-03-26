# Subscription System Testing Guide

## 🎯 Overview
The subscription-based question posting system is now fully implemented with the following features:

## 📋 Subscription Plans
- **FREE**: 1 question/day
- **BRONZE** (₹100/month): 5 questions/day  
- **SILVER** (₹300/month): 10 questions/day
- **GOLD** (₹1000/month): Unlimited questions/day

## 🕐 Payment Time Restriction
- Payments only allowed between **10 AM - 11 AM IST**
- Mock activation available anytime for testing

## 🧪 Testing Steps

### 1. Start the Servers
```bash
# Backend (already running)
cd server
npm start

# Frontend (in new terminal)
cd stack
npm run dev
```

### 2. Test Subscription Flow

#### Method A: Mock Activation (Recommended for Testing)
1. Navigate to `http://localhost:3000/subscription`
2. If outside 10-11 AM IST, you'll see "Payment Window Closed"
3. Click **"Test Activation (No Payment)"** button on any paid plan
4. Subscription activates immediately without payment
5. Check console for mock email logs

#### Method B: Real Payment (10-11 AM IST only)
1. Navigate to `http://localhost:3000/subscription`
2. During 10-11 AM IST, click "Subscribe" on any plan
3. Razorpay payment gateway opens
4. Complete payment to activate subscription

### 3. Test Question Limits
1. Navigate to `http://localhost:3000/ask/questions`
2. Check your current plan and remaining questions
3. Post questions until you hit the daily limit
4. Try posting one more - should show limit error
5. Upgrade plan to continue posting

### 4. Test API Endpoints

#### Get Subscription Status
```bash
curl -X GET "http://localhost:5000/api/subscription/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Mock Activate Subscription
```bash
curl -X POST "http://localhost:5000/api/subscription/mock-activate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"plan": "BRONZE"}'
```

#### Post Question (with limit check)
```bash
curl -X POST "http://localhost:5000/api/questions/ask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "postquestiondata": {
      "questiontitle": "Test Question",
      "questionbody": "This is a test question for subscription limits"
    }
  }'
```

## 🔧 Key Features Implemented

### Backend
✅ User model with subscription fields  
✅ Daily question limit enforcement  
✅ Payment time window (10-11 AM IST)  
✅ Mock subscription activation  
✅ Email notification system (mock)  
✅ Subscription status API  
✅ Question posting with limits  

### Frontend  
✅ Subscription plans page  
✅ Real-time limit display  
✅ Question submission with limits  
✅ Mock activation button  
✅ Error handling and toasts  

## 🚀 Ready for Payment Gateway
The system is fully prepared for payment gateway integration:
- Razorpay integration already coded
- Mock endpoint for testing
- Email system ready for SendGrid/NodeMailer
- Database schema supports payment tracking

## 📝 Notes
- All subscription data persists in MongoDB
- Daily limits reset at midnight IST
- Expired subscriptions auto-fallback to FREE
- Mock emails logged to server console
- No existing functionality was modified
