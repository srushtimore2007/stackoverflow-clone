// pages/api/subscription.ts
// Simple API endpoint for subscription (frontend convenience)

import { NextApiRequest, NextApiResponse } from 'next';
import axiosInstance from '../../lib/axiosinstance';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { plan } = req.body;

    // Validate plan
    if (!plan || !['FREE', 'BRONZE', 'SILVER', 'GOLD'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    // Payment window check disabled for testing
    // Originally: 10 AM - 11 AM IST restriction
    // Now: Always allows payments for testing email and invoice flow

    // For now, mock the subscription activation
    // In production, this would integrate with actual payment gateway
    
    // Mock subscription details
    const subscriptionDetails: Record<string, { price: number; duration: number; questionLimit: number | string }> = {
      FREE: { price: 0, duration: 30, questionLimit: 1 },
      BRONZE: { price: 100, duration: 30, questionLimit: 5 },
      SILVER: { price: 300, duration: 30, questionLimit: 10 },
      GOLD: { price: 1000, duration: 30, questionLimit: 'Unlimited' }
    };

    const details = subscriptionDetails[plan];

    // Mock successful subscription
    return res.status(200).json({
      success: true,
      message: `Subscription to ${plan} plan activated successfully!`,
      subscription: {
        plan,
        price: details.price,
        duration: details.duration,
        questionLimit: details.questionLimit,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + details.duration * 24 * 60 * 60 * 1000),
        mockMode: true
      }
    });

  } catch (error) {
    console.error('Subscription API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
