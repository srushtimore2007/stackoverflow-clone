// components/SubscriptionStatus.tsx

import React, { useState, useEffect } from 'react';
import { SubscriptionStatus as ISubscriptionStatus } from '../types/subscription';
import { getSubscriptionStatus } from '../services/subscriptionService';

const SubscriptionStatus: React.FC = () => {
  const [subscription, setSubscription] = useState<ISubscriptionStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async (): Promise<void> => {
    try {
      const response = await getSubscriptionStatus();
      if (response.success) {
        setSubscription(response.subscription);
      }
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading subscription status...</div>;
  }

  if (!subscription) {
    return <div>Unable to load subscription information</div>;
  }

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (): string => {
    if (!subscription.isActive) return '#e74c3c';
    if (subscription.currentPlan === 'GOLD') return '#f39c12';
    if (subscription.currentPlan === 'SILVER') return '#95a5a6';
    if (subscription.currentPlan === 'BRONZE') return '#cd7f32';
    return '#3498db';
  };

  const formatLimit = (limit: number | 'Unlimited'): string => {
    return limit === 'Unlimited' ? '∞ Unlimited' : String(limit);
  };

  const formatRemaining = (remaining: number | 'Unlimited'): string => {
    return remaining === 'Unlimited' ? '∞ Unlimited' : String(remaining);
  };

  return (
    <div className="subscription-status">
      <div className="status-card">
        <div className="status-header" style={{ borderLeftColor: getStatusColor() }}>
          <h3>{subscription.planName}</h3>
          <span className={`status-badge ${subscription.isActive ? 'active' : 'inactive'}`}>
            {subscription.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="status-body">
          <div className="status-item">
            <span className="label">Questions Today:</span>
            <span className="value">{subscription.questionsPostedToday}</span>
          </div>

          <div className="status-item">
            <span className="label">Daily Limit:</span>
            <span className="value">{formatLimit(subscription.dailyQuestionLimit)}</span>
          </div>

          <div className="status-item">
            <span className="label">Remaining Today:</span>
            <span className="value highlight">{formatRemaining(subscription.questionsRemaining)}</span>
          </div>

          {subscription.expiryDate && (
            <div className="status-item">
              <span className="label">Expires On:</span>
              <span className="value">{formatDate(subscription.expiryDate)}</span>
            </div>
          )}
        </div>

        {!subscription.canPostQuestion && subscription.currentPlan !== 'GOLD' && (
          <div className="upgrade-prompt">
            ⚠️ Daily limit reached! Upgrade your plan to ask more questions.
          </div>
        )}
      </div>

      <style jsx>{`
        .subscription-status {
          margin: 1rem 0;
        }

        .status-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .status-header {
          padding: 1.5rem;
          background: #f8f9fa;
          border-left: 4px solid #3498db;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-header h3 {
          margin: 0;
          color: #2c3e50;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .status-body {
          padding: 1.5rem;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          border-bottom: 1px solid #ecf0f1;
        }

        .status-item:last-child {
          border-bottom: none;
        }

        .label {
          color: #7f8c8d;
          font-weight: 500;
        }

        .value {
          color: #2c3e50;
          font-weight: 600;
        }

        .value.highlight {
          color: #27ae60;
          font-size: 1.1rem;
        }

        .upgrade-prompt {
          background: #fff3cd;
          color: #856404;
          padding: 1rem;
          text-align: center;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionStatus;