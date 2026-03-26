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

const SubscriptionPlans: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentPlan, setCurrentPlan] = useState<PlanType>('FREE');

  const plans: Plan[] = [
    {
      id: 'FREE',
      name: 'Free Plan',
      price: 0,
      limit: '1 question/day',
      features: ['1 question per day', 'Basic support', 'Community access'],
    },
    {
      id: 'BRONZE',
      name: 'Bronze Plan',
      price: 100,
      limit: '5 questions/day',
      features: ['5 questions per day', 'Priority support', 'Email notifications'],
    },
    {
      id: 'SILVER',
      name: 'Silver Plan',
      price: 300,
      limit: '10 questions/day',
      features: ['10 questions per day', 'Premium support', 'Advanced analytics'],
    },
    {
      id: 'GOLD',
      name: 'Gold Plan',
      price: 1000,
      limit: 'Unlimited questions',
      features: ['Unlimited questions', 'VIP support', 'All premium features'],
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
   * Check if current time is within payment window (TEMPORARILY DISABLED FOR TESTING)
   * Originally: 10 AM - 11 AM IST restriction
   * Now: Always returns true for testing email and invoice flow
   */
  const isWithinPaymentWindow = (): boolean => {
    // TEMPORARY BYPASS: Always allow payments for testing
    // This bypasses the 10 AM - 11 AM IST time restriction
    // TODO: Re-enable time restriction after testing is complete
    return true;
  };

  const handleSubscribe = async (planId: PlanType): Promise<void> => {
    // IMMEDIATE UPGRADE: No payment required, no restrictions
    // Upgrades plan immediately and sends confirmation email

    setLoading(true);
    setError('');

    try {
      // Use immediate upgrade for instant plan change
      const upgradeResponse = await immediateUpgradeSubscription(planId);

      if (upgradeResponse.success) {
        toast.success(`Plan upgraded successfully to ${upgradeResponse.newPlan}! Check your email for confirmation and invoice.`);
        setCurrentPlan(planId);
        fetchCurrentSubscription();
      } else {
        // Check if this is an upgrade restriction response
        if (upgradeResponse.canUpgradeOn) {
          const upgradeDate = new Date(upgradeResponse.canUpgradeOn);
          const formattedDate = upgradeDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          toast.error(`Cannot upgrade now. Your current plan is active until ${formattedDate}.`);
        } else {
          // Check if this is a payment time restriction
          if (upgradeResponse.message && upgradeResponse.message.includes('Payments are allowed only between')) {
            toast.error('Payments are allowed only between 10:00 AM and 11:00 AM IST.');
          } else {
            throw new Error(upgradeResponse.message);
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upgrade subscription';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMockSubscribe = async (planId: PlanType): Promise<void> => {
    // TEMPORARY BYPASS: Allow subscribing to any plan including current plan
    // Originally prevented subscribing to current plan
    // Now allows re-subscribing to same plan for testing
    // TODO: Re-enable restriction after testing is complete

    setLoading(true);
    setError('');

    try {
      const mockResponse = await mockActivateSubscription(planId);

      if (mockResponse.success) {
        toast.success(`Subscription activated successfully (mock mode)! Plan: ${mockResponse.subscription.plan}`);
        setCurrentPlan(planId);
        fetchCurrentSubscription();
      } else {
        // Check if this is a payment time restriction
        if (mockResponse.message && mockResponse.message.includes('Payments are allowed only between')) {
          toast.error('Payments are allowed only between 10:00 AM and 11:00 AM IST.');
        } else {
          throw new Error(mockResponse.message);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to activate subscription';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-plans">
      <h1>Choose Your Plan</h1>
      {error && <div className="error-message">{error}</div>}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${currentPlan === plan.id ? 'active' : ''}`}>
            <h3>{plan.name}</h3>
            <div className="price">
              ₹{plan.price}
              <span>/month</span>
            </div>
            <div className="limit">{plan.limit}</div>

            <ul className="features">
              {plan.features.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading}
              className={currentPlan === plan.id ? 'current-plan' : ''}
            >
              {loading ? 'Processing...' : 'Upgrade Plan'}
            </button>

            {/* Upgrade indicator - shows when user is on current plan */}
            {currentPlan === plan.id && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                💡 Current Plan
              </div>
            )}
          </div>
        ))}
      </div>

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