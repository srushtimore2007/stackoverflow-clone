import express from 'express';
import auth from '../middleware/auth.js';
import checkPaymentTime from '../middleware/checkPaymentTime.js';
import {
  createSubscriptionOrder,
  verifySubscriptionPayment,
  getSubscriptionStatus,
  mockActivateSubscription,
  immediateUpgradeSubscription
} from '../controller/subscriptionController.js';

const router = express.Router();

// Get subscription status (no time restriction)
router.get('/status', auth, getSubscriptionStatus);

// Create order (with payment time restriction)
router.post('/create-order', auth, checkPaymentTime, createSubscriptionOrder);

// Verify payment (with payment time restriction)
router.post('/verify-payment', auth, checkPaymentTime, verifySubscriptionPayment);

// Mock activation (with payment time restriction)
router.post('/mock-activate', auth, checkPaymentTime, mockActivateSubscription);

// Immediate upgrade (with payment time restriction)
router.post('/immediate-upgrade', auth, checkPaymentTime, immediateUpgradeSubscription);

export default router;