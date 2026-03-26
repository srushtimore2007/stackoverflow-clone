# Frontend Integration Guide

## Subscription System Integration

This guide shows how to integrate the subscription payment system in your React frontend.

### 1. Subscription Status Hook

```typescript
// hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import axiosInstance from '../lib/axiosinstance';

interface SubscriptionStatus {
  currentPlan: string;
  planName: string;
  isActive: boolean;
  expiryDate: string | null;
  dailyQuestionLimit: number | string;
  questionsPostedToday: number;
  questionsRemaining: number | string;
  canPostQuestion: boolean;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/subscription/status');
      if (response.data.success) {
        setSubscription(response.data.subscription);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch subscription status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return { subscription, loading, error, refetch: fetchStatus };
};
```

### 2. Payment Component

```typescript
// components/SubscriptionPayment.tsx
import { useState } from 'react';
import axiosInstance from '../lib/axiosinstance';
import { toast } from 'react-toastify';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentProps {
  plan: 'BRONZE' | 'SILVER' | 'GOLD';
  onSuccess?: () => void;
}

const SubscriptionPayment: React.FC<PaymentProps> = ({ plan, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Check current time (client-side validation - backend also validates)
      const now = new Date();
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const currentHour = istTime.getHours();

      if (currentHour < 10 || currentHour >= 11) {
        toast.error('Payments are allowed only between 10 AM and 11 AM IST');
        return;
      }

      // Create order
      const orderResponse = await axiosInstance.post('/api/subscription/create-order', { plan });
      
      if (!orderResponse.data.success) {
        toast.error(orderResponse.data.message);
        return;
      }

      const { order, subscriptionId } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: order.razorpayKeyId,
        amount: order.amount,
        currency: order.currency,
        name: 'StackOverflow Clone',
        description: `Subscription - ${plan} Plan`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await axiosInstance.post('/api/subscription/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              subscriptionId,
            });

            if (verifyResponse.data.success) {
              toast.success('Subscription activated successfully!');
              onSuccess?.();
            } else {
              toast.error(verifyResponse.data.message || 'Payment verification failed');
            }
          } catch (error: any) {
            toast.error(error.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          // Add user email/name if available
        },
        theme: {
          color: '#4CAF50',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to initiate payment';
      toast.error(errorMessage);
      
      if (errorMessage.includes('10 AM and 11 AM')) {
        // Show time restriction message
        toast.info('Please try again between 10 AM and 11 AM IST');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
    >
      {loading ? 'Processing...' : `Subscribe to ${plan} Plan`}
    </button>
  );
};

export default SubscriptionPayment;
```

### 3. Question Limit Display Component

```typescript
// components/QuestionLimitDisplay.tsx
import { useSubscription } from '../hooks/useSubscription';
import { Badge } from './ui/badge';

const QuestionLimitDisplay = () => {
  const { subscription, loading } = useSubscription();

  if (loading) return <div>Loading...</div>;
  if (!subscription) return null;

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold mb-2">Subscription Status</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Current Plan:</span>
          <Badge>{subscription.planName}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Questions Today:</span>
          <span>{subscription.questionsPostedToday} / {subscription.dailyQuestionLimit}</span>
        </div>
        <div className="flex justify-between">
          <span>Remaining:</span>
          <span className={subscription.canPostQuestion ? 'text-green-600' : 'text-red-600'}>
            {subscription.questionsRemaining}
          </span>
        </div>
        {subscription.expiryDate && (
          <div className="flex justify-between">
            <span>Expires:</span>
            <span>{new Date(subscription.expiryDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionLimitDisplay;
```

### 4. Ask Question Component Update

```typescript
// pages/ask/questions.tsx (update existing)
import { useSubscription } from '../../hooks/useSubscription';
import { toast } from 'react-toastify';

const AskQuestionPage = () => {
  const { subscription } = useSubscription();
  // ... existing code ...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user can post question
    if (!subscription?.canPostQuestion) {
      toast.error('Daily question limit reached for your plan');
      return;
    }

    if (!user) {
      toast.error('Please login to ask question');
      router.push('/auth');
      return;
    }

    try {
      const res = await axiosInstance.post('/api/questions/ask', {
        postquestiondata: {
          questiontitle: formData.title,
          questionbody: formData.body,
          questiontags: formData.tags,
          userposted: user.name,
          userid: user?._id,
        },
      });
      
      if (res.data.success) {
        toast.success('Question posted successfully');
        router.push('/');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Something went wrong';
      toast.error(errorMessage);
      
      if (errorMessage.includes('Daily question limit')) {
        // Refresh subscription status
        // subscription.refetch();
      }
    }
  };

  return (
    <Mainlayout>
      {subscription && !subscription.canPostQuestion && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-yellow-800">
            You've reached your daily question limit. Upgrade your plan to post more questions.
          </p>
        </div>
      )}
      {/* ... rest of form ... */}
    </Mainlayout>
  );
};
```

### 5. Add Razorpay Script to Layout

```typescript
// layout/Mainlayout.tsx or _app.tsx
import { useEffect } from 'react';
import Script from 'next/script';

const Mainlayout = ({ children }) => {
  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      {children}
    </>
  );
};
```

### 6. Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

Note: The Razorpay key ID should be public (starts with `rzp_`), but the secret key stays on the backend.

### API Endpoints Summary

- `GET /api/subscription/status` - Get current subscription status
- `POST /api/subscription/create-order` - Create Razorpay order (10 AM - 11 AM IST only)
- `POST /api/subscription/verify-payment` - Verify payment and activate subscription (10 AM - 11 AM IST only)
- `POST /api/questions/ask` - Post a question (with subscription limit check)
- `POST /api/questions/create` - Alias for /ask
