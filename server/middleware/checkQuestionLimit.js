import User from '../models/auth.js';
import { SUBSCRIPTION_PLANS } from '../config/plans.js';

/**
 * Middleware to check if user can post a question based on their subscription plan
 */
const checkQuestionLimit = async (req, res, next) => {
  try {
    const userId = req.userid; // Auth middleware sets req.userid (lowercase)
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User ID not found'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if subscription has expired - fallback to FREE plan
    if (!user.isSubscriptionActive() && user.subscriptionPlan !== 'FREE') {
      user.subscriptionPlan = 'FREE';
      user.subscriptionExpiry = null;
      user.dailyQuestionCount = 0;
      user.lastQuestionDate = null;
      await user.save();
    }

    // Reset daily count if it's a new day
    user.resetDailyCountIfNeeded();
    await user.save();

    // Get the user's daily limit
    const dailyLimit = user.getDailyQuestionLimit();

    // Check if user has reached their limit (Gold plan has Infinity limit)
    if (user.dailyQuestionCount >= dailyLimit && dailyLimit !== Infinity) {
      return res.status(403).json({
        success: false,
        message: 'Daily question limit reached for your plan',
        currentPlan: user.subscriptionPlan,
        dailyLimit: dailyLimit,
        questionsPostedToday: user.dailyQuestionCount,
        upgradeRequired: true
      });
    }

    // Attach user to request for use in controller
    req.userWithSubscription = user;
    next();
  } catch (error) {
    console.error('Question limit check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking question limit',
      error: error.message
    });
  }
};

export default checkQuestionLimit;