// components/UpgradePlanCTA.tsx
// Upgrade Plan Call-to-Action Component for Questions Page

import React from 'react';
import { Link } from 'react-router-dom';
import { SubscriptionStatus } from '../types/subscription';
import styles from './UpgradePlanCTA.module.css';

interface UpgradePlanCTAProps {
  subscription?: SubscriptionStatus | null;
}

const UpgradePlanCTA: React.FC<UpgradePlanCTAProps> = ({ subscription }) => {
  const currentPlan = subscription?.currentPlan || 'FREE';

  return (
    <div className={styles['upgrade-cta-container']}>
      <div className={styles['upgrade-cta-content']}>
        <h3>Upgrade your plan to post more questions daily</h3>
        <p className={styles['current-plan-text']}>
          Current Plan: <span className={styles['plan-badge']}>{currentPlan}</span>
        </p>
        <Link to="/subscription" className={styles['upgrade-button']}>
          Upgrade Plan
        </Link>
      </div>
    </div>
  );
};

export default UpgradePlanCTA;
