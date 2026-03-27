// components/SubscriptionPlans.tsx

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plan, PlanType, RazorpayResponse } from '../types/subscription';
import {
  getSubscriptionStatus,
  createSubscriptionOrder,
  verifyPayment,
  mockActivateSubscription,
  immediateUpgradeSubscription,
} from '../services/subscriptionService';
import RazorpayPayment from './RazorpayPayment';
import { useTranslationManager } from '../hooks/useTranslationManager';

const SubscriptionPlans: React.FC = () => {
  const { t } = useTranslationManager();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentPlan, setCurrentPlan] = useState<PlanType>('FREE');
  const [razorpayPayment, setRazorpayPayment] = useState<{
    orderId: string;
    amount: number;
    currency: string;
    planName: string;
    keyId: string;
    subscriptionId: string;
  } | null>(null);

  const plans: Plan[] = [
    {
      id: 'FREE',
      name: t('subscription.plans.free.name'),
      price: 0,
      limit: t('subscription.plans.free.limit'),
      features: [
        t('subscription.plans.free.features.questionPerDay'),
        t('subscription.plans.free.features.basicSupport'),
        t('subscription.plans.free.features.communityAccess')
      ],
    },
    {
      id: 'BRONZE',
      name: t('subscription.plans.bronze.name'),
      price: 100,
      limit: t('subscription.plans.bronze.limit'),
      features: [
        t('subscription.plans.bronze.features.questionsPerDay'),
        t('subscription.plans.bronze.features.prioritySupport'),
        t('subscription.plans.bronze.features.emailNotifications')
      ],
    },
    {
      id: 'SILVER',
      name: t('subscription.plans.silver.name'),
      price: 300,
      limit: t('subscription.plans.silver.limit'),
      features: [
        t('subscription.plans.silver.features.questionsPerDay'),
        t('subscription.plans.silver.features.premiumSupport'),
        t('subscription.plans.silver.features.advancedAnalytics')
      ],
    },
    {
      id: 'GOLD',
      name: t('subscription.plans.gold.name'),
      price: 1000,
      limit: t('subscription.plans.gold.limit'),
      features: [
        t('subscription.plans.gold.features.unlimitedQuestions'),
        t('subscription.plans.gold.features.vipSupport'),
        t('subscription.plans.gold.features.allPremiumFeatures')
      ],
    },
  ];

  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async (): Promise<void> => {
    try {
      const response = await getSubscriptionStatus();
      if (response.success) {
        setCurrentPlan(response.subscription.currentPlan);
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  };

  /**
   * Check if current time is within payment window (10:00 AM - 11:00 AM IST)
   */
  const isWithinPaymentWindow = (): boolean => {
    // Get current time in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    
    // Get IST time components
    const istHour = istTime.getUTCHours(); // IST hour in UTC format
    const istMinute = istTime.getUTCMinutes();
    
    // Check if current time is within payment window (10:00 AM - 11:00 AM IST)
    // In IST: 10:00 AM = 4:30 UTC, 11:00 AM = 5:30 UTC
    const isWithinWindow = istHour === 10 && istMinute >= 0 && istMinute < 60;
    
    console.log('💳 Payment window check:', {
      utcTime: now.toISOString(),
      istTime: istTime.toISOString(),
      istHour,
      istMinute,
      isWithinWindow,
      timeWindow: '10:00 AM - 11:00 AM IST'
    });
    
    return isWithinWindow;
  };

  const handleSubscribe = async (planId: PlanType): Promise<void> => {
    if (planId === 'FREE') {
      toast.info(t('subscription.messages.freePlanNoPayment'));
      return;
    }

    if (planId === currentPlan) {
      toast.info(t('subscription.messages.alreadyOnPlan'));
      return;
    }

    // Check if current time is within payment window (10:00 AM - 11:00 AM IST)
    if (!isWithinPaymentWindow()) {
      toast.error(t('subscription.messages.paymentWindowClosed'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create Razorpay order
      const orderResponse = await createSubscriptionOrder(planId);

      if (orderResponse.success) {
        // Set up Razorpay payment
        setRazorpayPayment({
          orderId: orderResponse.order.id,
          amount: orderResponse.order.amount,
          currency: orderResponse.order.currency,
          planName: plans.find(p => p.id === planId)?.name || planId,
          keyId: orderResponse.order.razorpayKeyId,
          subscriptionId: orderResponse.subscriptionId,
        });
      } else {
        // Check if this is an upgrade restriction response
        if (orderResponse.message && orderResponse.message.includes('Cannot upgrade now')) {
          throw new Error(orderResponse.message);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('subscription.messages.failedToCreateOrder');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData: any): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      // Verify payment and activate subscription
      const verifyResponse = await verifyPayment(paymentData);

      if (verifyResponse.success) {
        toast.success(`Payment successful! Plan upgraded to ${verifyResponse.subscription.plan}. Check your email for confirmation.`);
        setCurrentPlan(verifyResponse.subscription.plan);
        fetchCurrentSubscription();
      } else {
        throw new Error(verifyResponse.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment verification failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRazorpayPayment(null);
    }
  };

  const handlePaymentError = (error: any): void => {
    setError(error.message);
    toast.error(error.message);
    setRazorpayPayment(null);
    setLoading(false);
  };

  const handlePaymentClose = (): void => {
    setRazorpayPayment(null);
    setLoading(false);
  };

  const handleMockSubscribe = async (planId: PlanType): Promise<void> => {
    // Check if current time is within payment window (10:00 AM - 11:00 AM IST)
    if (!isWithinPaymentWindow()) {
      toast.error('Payments are allowed only between 10:00 AM and 11:00 AM IST.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const mockResponse = await mockActivateSubscription(planId);

      if (mockResponse.success) {
        toast.success(`Subscription activated successfully (mock mode)! Plan: ${mockResponse.subscription.plan}`);
        setCurrentPlan(mockResponse.subscription.plan);
      } else {
        throw new Error(mockResponse.message);
      }
    } catch (err) {
      setError('');
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate subscription';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-plans">
      <h1>{t('subscription.title')}</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${currentPlan === plan.id ? 'active' : ''}`}>
            <h3>{plan.name}</h3>
            <div className="price">
              ₹{plan.price}
              <span>{t('subscription.perMonth')}</span>
            </div>
            <div className="limit">{plan.limit}</div>

            <ul className="features">
              {plan.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading || !isWithinPaymentWindow()}
              className={currentPlan === plan.id ? 'current-plan' : ''}
            >
              {loading ? t('subscription.buttons.processing') : !isWithinPaymentWindow() ? t('subscription.buttons.paymentWindowClosed') : t('subscription.buttons.upgradePlan')}
            </button>

            {/* Payment window status indicator */}
            {plan.id !== 'FREE' && (
              <div style={{ 
                marginTop: '0.5rem', 
                fontSize: '0.8rem', 
                color: isWithinPaymentWindow() ? '#28a745' : '#dc3545',
                textAlign: 'center'
              }}>
                {isWithinPaymentWindow() ? t('subscription.paymentWindow.open') : t('subscription.paymentWindow.closed')}
              </div>
            )}

            {/* Upgrade indicator - shows when user is on current plan */}
            {currentPlan === plan.id && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                {t('subscription.status.currentPlan')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Razorpay Payment Modal */}
      {razorpayPayment && (
        <RazorpayPayment
          orderId={razorpayPayment.orderId}
          amount={razorpayPayment.amount}
          currency={razorpayPayment.currency}
          planName={razorpayPayment.planName}
          keyId={razorpayPayment.keyId}
          subscriptionId={razorpayPayment.subscriptionId}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          onClose={handlePaymentClose}
        />
      )}

      <style jsx>{`
        .subscription-plans {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        h1 {
          text-align: center;
          margin-bottom: 2rem;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .plans-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .plan-card {
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s;
        }

        .plan-card.active {
          border-color: #3399cc;
          box-shadow: 0 4px 12px rgba(51, 153, 204, 0.2);
        }

        .plan-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .price {
          font-size: 2.5rem;
          font-weight: bold;
          color: #333;
          margin: 1rem 0;
        }

        .price span {
          font-size: 1rem;
          color: #666;
        }

        .limit {
          color: #666;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }

        .features {
          list-style: none;
          padding: 0;
          margin: 1.5rem 0;
          text-align: left;
        }

        .features li {
          padding: 0.5rem 0;
          color: #555;
        }

        button {
          width: 100%;
          padding: 0.75rem;
          background: #3399cc;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.3s;
        }

        button:hover:not(:disabled) {
          background: #2980b9;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        button.current-plan {
          background: #27ae60;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPlans;