// pages/subscription/index.tsx

import React from 'react';
import SubscriptionPlans from '../../components/SubscriptionPlans';

const SubscriptionPage: React.FC = () => {
  return (
    <div className="subscription-page">
      <SubscriptionPlans />
      
      <style jsx>{`
        .subscription-page {
          min-height: 100vh;
          background: #f8f9fa;
          padding: 2rem 0;
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPage;
