// components/AskQuestion.tsx

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { SubscriptionStatus } from '../types/subscription';
import { getSubscriptionStatus } from '../services/subscriptionService';
import { createQuestion } from '../services/questionService';

const AskQuestion: React.FC = () => {
  const [title, setTitle] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [canPost, setCanPost] = useState<boolean>(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async (): Promise<void> => {
    try {
      const response = await getSubscriptionStatus();
      if (response.success) {
        setSubscription(response.subscription);
        setCanPost(response.subscription.canPostQuestion);
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!canPost) {
      setError('Daily question limit reached. Please upgrade your plan.');
      return;
    }

    if (!title.trim() || !body.trim()) {
      setError('Title and body are required');
      return;
    }

    setLoading(true);

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await createQuestion({
        title,
        body,
        tags: tagsArray,
      });

      if (response.success) {
        setSuccess('Question posted successfully!');
        setTitle('');
        setBody('');
        setTags('');

        // Update subscription info
        if (response.subscription) {
          setSubscription((prev) =>
            prev
              ? {
                  ...prev,
                  questionsPostedToday: response.subscription.questionsPostedToday,
                  questionsRemaining: response.subscription.questionsRemaining,
                }
              : null
          );

          // Check if can still post
          setCanPost(response.subscription.questionsRemaining !== 0);
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post question';
      setError(errorMessage);

      if (errorMessage.includes('limit reached')) {
        setCanPost(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatLimit = (limit: number | 'Unlimited'): string => {
    return limit === 'Unlimited' ? '∞' : String(limit);
  };

  const formatRemaining = (remaining: number | 'Unlimited'): string => {
    return remaining === 'Unlimited' ? '∞' : String(remaining);
  };

  return (
    <div className="ask-question">
      <h1>Ask a Question</h1>

      {subscription && (
        <div className="quota-info">
          <div className="quota-card">
            <span>
              Plan: <strong>{subscription.currentPlan}</strong>
            </span>
            <span>
              Today: <strong>{subscription.questionsPostedToday}</strong> /{' '}
              <strong>{formatLimit(subscription.dailyQuestionLimit)}</strong>
            </span>
            <span>
              Remaining:{' '}
              <strong className={canPost ? 'available' : 'exhausted'}>
                {formatRemaining(subscription.questionsRemaining)}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Upgrade Plan CTA - Always Visible */}
      <div className="upgrade-cta-container">
        <div className="upgrade-cta-content">
          <h3>Upgrade your plan to post more questions daily</h3>
          <p className="current-plan-text">
            Current Plan: <span className="plan-badge">{subscription?.currentPlan || 'FREE'}</span>
          </p>
          <Link to="/subscription" className="upgrade-button">
            Upgrade Plan
          </Link>
        </div>
      </div>

      {!canPost && (
        <div className="limit-warning">
          <p>⚠️ You've reached your daily question limit!</p>
          <Link to="/subscription" className="upgrade-link">
            Upgrade Your Plan →
          </Link>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="What's your programming question? Be specific."
            disabled={!canPost || loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="body">Question Details</label>
          <textarea
            id="body"
            value={body}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
            placeholder="Include all the information someone would need to answer your question..."
            rows={10}
            disabled={!canPost || loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma-separated)</label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTags(e.target.value)}
            placeholder="e.g. javascript, react, node.js"
            disabled={!canPost || loading}
          />
        </div>

        <button type="submit" disabled={!canPost || loading} className={!canPost ? 'disabled' : ''}>
          {loading ? 'Posting...' : !canPost ? 'Limit Reached' : 'Post Question'}
        </button>
      </form>

      <style jsx>{`
        .ask-question {
          max-width: 800px;
          margin: 2rem auto;
          padding: 0 1rem;
        }

        h1 {
          margin-bottom: 1.5rem;
        }

        .quota-info {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .quota-card {
          display: flex;
          gap: 2rem;
          justify-content: space-around;
          flex-wrap: wrap;
        }

        .quota-card span {
          color: #555;
        }

        .quota-card strong {
          color: #2c3e50;
          margin-left: 0.5rem;
        }

        .quota-card strong.available {
          color: #27ae60;
        }

        .quota-card strong.exhausted {
          color: #e74c3c;
        }

        .limit-warning {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 1rem;
          margin-bottom: 1.5rem;
          border-radius: 4px;
        }

        .limit-warning p {
          margin: 0 0 0.5rem 0;
          color: #856404;
        }

        .upgrade-link {
          color: #007bff;
          text-decoration: none;
          font-weight: 600;
        }

        .upgrade-link:hover {
          text-decoration: underline;
        }

        .upgrade-cta-container {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);
        }

        .upgrade-cta-content {
          text-align: center;
          color: white;
        }

        .upgrade-cta-content h3 {
          margin: 0 0 1rem 0;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .current-plan-text {
          margin: 0 0 1.5rem 0;
          font-size: 1rem;
          opacity: 0.9;
        }

        .plan-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 600;
          margin-left: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .upgrade-button {
          display: inline-block;
          background: white;
          color: #667eea;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .upgrade-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          background: #f8f9fa;
          color: #764ba2;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
        }

        input[type='text'],
        textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          font-family: inherit;
        }

        input[type='text']:focus,
        textarea:focus {
          outline: none;
          border-color: #3498db;
          box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }

        input:disabled,
        textarea:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        button {
          width: 100%;
          padding: 1rem;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s;
        }

        button:hover:not(:disabled) {
          background: #2980b9;
        }

        button:disabled {
          background: #95a5a6;
          cursor: not-allowed;
        }

        button.disabled {
          background: #e74c3c;
        }
      `}</style>
    </div>
  );
};

export default AskQuestion;