import User from "../models/auth.js";
import Subscription from "../models/Subscription.js";
import { SUBSCRIPTION_PLANS } from "../config/plans.js";
import { createOrder, verifyPaymentSignature } from "../lib/utils/razorpay.js";
import { sendSubscriptionEmail } from "../lib/utils/emailService.js";

/**
 * Create Razorpay order for subscription
 * POST /subscription/create-order
 */
export const createSubscriptionOrder = async (req, res) => {
  // Log incoming request for debugging
  console.log('🚀 Create Order Request:', {
    body: req.body,
    userId: req.userid,
    timestamp: new Date().toISOString()
  });

  try {
    const { plan, amount } = req.body;
    const userId = req.userid; // Auth middleware sets req.userid (lowercase)

    // Validate user authentication
    if (!userId) {
      console.error('❌ Unauthorized: User ID not found in request');
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User ID not found"
      });
    }

    // Validate request body data
    if (!req.body || typeof req.body !== 'object') {
      console.error('❌ Invalid request body:', req.body);
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Must be a JSON object."
      });
    }

    // Validate plan parameter
    if (!plan) {
      console.error('❌ Missing plan parameter:', { body: req.body });
      return res.status(400).json({ 
        success: false, 
        message: "Missing required parameter: plan" 
      });
    }

    if (typeof plan !== 'string') {
      console.error('❌ Invalid plan type:', { plan, type: typeof plan });
      return res.status(400).json({ 
        success: false, 
        message: "Invalid plan type. Must be a string." 
      });
    }

    // Validate amount parameter (optional - if provided, must be valid)
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount <= 0) {
        console.error('❌ Invalid amount:', { amount, type: typeof amount });
        return res.status(400).json({ 
          success: false, 
          message: "Invalid amount. Must be a positive number." 
        });
      }
    }

    const validPlans = ["BRONZE", "SILVER", "GOLD"];
    if (!validPlans.includes(plan.toUpperCase())) {
      console.error('❌ Invalid plan value:', { plan, validPlans });
      return res.status(400).json({ 
        success: false, 
        message: `Invalid subscription plan. Must be one of: ${validPlans.join(', ')}` 
      });
    }

    // Normalize plan to uppercase
    const normalizedPlan = plan.toUpperCase();

    // Get user from database
    let user;
    try {
      user = await User.findById(userId);
    } catch (dbError) {
      console.error('❌ Database error finding user:', dbError);
      return res.status(500).json({
        success: false,
        message: "Database error while finding user"
        // Note: Don't send raw error to client for security
      });
    }

    if (!user) {
      console.error('❌ User not found:', { userId });
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // TEMPORARY BYPASS: Allow users with active subscriptions to upgrade for testing
    // Originally prevented users with active subscriptions from upgrading
    // Now allows upgrades regardless of current subscription status
    // TODO: Re-enable restriction after testing is complete
    console.log('✅ User validated:', { 
      userId: user._id, 
      email: user.email, 
      currentPlan: user.subscriptionPlan,
      requestedPlan: normalizedPlan 
    });

    // Get plan details
    let planDetails;
    try {
      planDetails = SUBSCRIPTION_PLANS[normalizedPlan];
      if (!planDetails) {
        throw new Error(`Plan configuration not found for: ${normalizedPlan}`);
      }
    } catch (planError) {
      console.error('❌ Plan configuration error:', planError);
      return res.status(500).json({
        success: false,
        message: "Plan configuration error"
        // Note: Don't send raw error to client for security
      });
    }

    // Validate plan details structure
    if (!planDetails.price || !planDetails.currency) {
      console.error('❌ Invalid plan configuration:', { plan: normalizedPlan, planDetails });
      return res.status(500).json({
        success: false,
        message: "Invalid plan configuration"
      });
    }

    const receipt = `receipt_${userId}_${Date.now()}`;

    // Create Razorpay order with comprehensive error handling
    let order;
    try {
      // Validate payment gateway function exists
      if (typeof createOrder !== 'function') {
        throw new Error('Payment gateway function not available');
      }

      order = await createOrder(planDetails.price, planDetails.currency, receipt);
      
      // Validate order response structure
      if (!order || !order.id || !order.amount || !order.currency) {
        throw new Error('Invalid payment gateway response');
      }
      
      console.log('✅ Razorpay order created:', { orderId: order.id, amount: order.amount });
    } catch (razorpayError) {
      console.error('❌ Razorpay order creation failed:', {
        error: razorpayError.message,
        stack: razorpayError.stack,
        plan: normalizedPlan,
        amount: planDetails.price
      });
      return res.status(500).json({
        success: false,
        message: "Failed to create payment order"
        // Note: Don't send raw error to client for security
      });
    }

    // Create subscription record in database with validation
    let subscription;
    try {
      // Validate required fields before creating subscription
      if (!order.id || !userId || !normalizedPlan) {
        throw new Error('Missing required fields for subscription creation');
      }

      subscription = new Subscription({
        userId,
        plan: normalizedPlan,
        amount: planDetails.price,
        currency: planDetails.currency,
        razorpayOrderId: order.id,
        status: "PENDING",
      });
      
      await subscription.save();
      
      // Validate subscription was saved properly
      if (!subscription._id) {
        throw new Error('Subscription record was not saved properly');
      }
      
      console.log('✅ Subscription record created:', { subscriptionId: subscription._id });
    } catch (subscriptionError) {
      console.error('❌ Subscription record creation failed:', {
        error: subscriptionError.message,
        stack: subscriptionError.stack,
        userId,
        plan: normalizedPlan
      });
      return res.status(500).json({
        success: false,
        message: "Failed to create subscription record"
        // Note: Don't send raw error to client for security
      });
    }

    // Success response with validated data
    const responseData = {
      success: true,
      message: "Order created successfully",
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || null, // Handle missing env var
      },
      subscriptionId: subscription._id,
    };

    console.log('✅ Order creation successful:', { 
      orderId: order.id, 
      subscriptionId: subscription._id,
      plan: normalizedPlan,
      userId 
    });

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Unexpected error in createSubscriptionOrder:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.userid,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create order"
      // Note: Don't send raw error to client for security
    });
  }
};

/**
 * Verify payment and activate subscription
 * POST /subscription/verify-payment
 */
export const verifySubscriptionPayment = async (req, res) => {
  // Log incoming request for debugging
  console.log('🚀 Verify Payment Request:', {
    body: req.body,
    userId: req.userid,
    timestamp: new Date().toISOString()
  });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, subscriptionId } = req.body;
    const userId = req.userid; // Auth middleware sets req.userid (lowercase)

    // Validate user authentication
    if (!userId) {
      console.error('❌ Unauthorized: User ID not found in request');
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User ID not found"
      });
    }

    // Validate request body data
    if (!req.body || typeof req.body !== 'object') {
      console.error('❌ Invalid request body:', req.body);
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Must be a JSON object."
      });
    }

    // Validate required payment fields
    const requiredFields = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'subscriptionId'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required payment fields:', { missingFields, body: req.body });
      return res.status(400).json({ 
        success: false, 
        message: `Missing required payment details: ${missingFields.join(', ')}` 
      });
    }

    // Validate field types
    if (typeof razorpay_order_id !== 'string' || razorpay_order_id.trim() === '') {
      console.error('❌ Invalid razorpay_order_id:', { razorpay_order_id, type: typeof razorpay_order_id });
      return res.status(400).json({ 
        success: false, 
        message: "Invalid razorpay_order_id. Must be a non-empty string." 
      });
    }

    if (typeof razorpay_payment_id !== 'string' || razorpay_payment_id.trim() === '') {
      console.error('❌ Invalid razorpay_payment_id:', { razorpay_payment_id, type: typeof razorpay_payment_id });
      return res.status(400).json({ 
        success: false, 
        message: "Invalid razorpay_payment_id. Must be a non-empty string." 
      });
    }

    if (typeof razorpay_signature !== 'string' || razorpay_signature.trim() === '') {
      console.error('❌ Invalid razorpay_signature:', { razorpay_signature, type: typeof razorpay_signature });
      return res.status(400).json({ 
        success: false, 
        message: "Invalid razorpay_signature. Must be a non-empty string." 
      });
    }

    if (typeof subscriptionId !== 'string' || subscriptionId.trim() === '') {
      console.error('❌ Invalid subscriptionId:', { subscriptionId, type: typeof subscriptionId });
      return res.status(400).json({ 
        success: false, 
        message: "Invalid subscriptionId. Must be a non-empty string." 
      });
    }

    // Verify Razorpay signature
    let isValid;
    try {
      isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      console.log('✅ Payment signature verification:', { isValid, orderId: razorpay_order_id });
    } catch (signatureError) {
      console.error('❌ Payment signature verification error:', signatureError);
      return res.status(500).json({
        success: false,
        message: "Payment signature verification failed",
        error: signatureError.message
      });
    }

    if (!isValid) {
      console.error('❌ Invalid payment signature:', { 
        orderId: razorpay_order_id, 
        paymentId: razorpay_payment_id 
      });
      return res.status(400).json({ 
        success: false, 
        message: "Invalid payment signature" 
      });
    }

    // Get subscription record from database
    let subscription;
    try {
      subscription = await Subscription.findById(subscriptionId);
    } catch (dbError) {
      console.error('❌ Database error finding subscription:', dbError);
      return res.status(500).json({
        success: false,
        message: "Database error while finding subscription",
        error: dbError.message
      });
    }

    if (!subscription) {
      console.error('❌ Subscription not found:', { subscriptionId });
      return res.status(404).json({ 
        success: false, 
        message: "Subscription not found" 
      });
    }

    // Validate subscription ownership
    if (subscription.userId.toString() !== userId.toString()) {
      console.error('❌ Subscription ownership mismatch:', { 
        subscriptionUserId: subscription.userId, 
        requestUserId: userId 
      });
      return res.status(404).json({ 
        success: false, 
        message: "Subscription does not belong to user" 
      });
    }

    // Prevent double-processing
    if (subscription.status === "COMPLETED") {
      console.error('❌ Payment already processed:', { subscriptionId, status: subscription.status });
      return res.status(400).json({ 
        success: false, 
        message: "Payment already processed" 
      });
    }

    // Update subscription record
    try {
      subscription.razorpayPaymentId = razorpay_payment_id;
      subscription.razorpaySignature = razorpay_signature;
      subscription.status = "COMPLETED";
      subscription.startDate = new Date();
      
      // Set expiry to 30 days from now
      const expiryDate = new Date();
      const duration = SUBSCRIPTION_PLANS[subscription.plan]?.duration || 30;
      expiryDate.setDate(expiryDate.getDate() + duration);
      subscription.expiryDate = expiryDate;
      
      await subscription.save();
      console.log('✅ Subscription updated:', { 
        subscriptionId: subscription._id, 
        plan: subscription.plan,
        status: subscription.status 
      });
    } catch (updateError) {
      console.error('❌ Subscription update failed:', updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update subscription",
        error: updateError.message
      });
    }

    // Get user for email and update
    let user;
    try {
      user = await User.findById(userId);
    } catch (dbError) {
      console.error('❌ Database error finding user for update:', dbError);
      return res.status(500).json({
        success: false,
        message: "Database error while finding user for update",
        error: dbError.message
      });
    }

    if (!user) {
      console.error('❌ User not found during payment verification:', { userId });
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Update user subscription
    try {
      user.subscriptionPlan = subscription.plan;
      user.subscriptionExpiry = subscription.expiryDate;
      user.dailyQuestionCount = 0; // Reset daily count
      user.lastQuestionDate = null; // Reset last question date
      await user.save();
      console.log('✅ User subscription updated:', { 
        userId: user._id, 
        newPlan: user.subscriptionPlan,
        expiryDate: user.subscriptionExpiry 
      });
    } catch (userUpdateError) {
      console.error('❌ User subscription update failed:', userUpdateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update user subscription",
        error: userUpdateError.message
      });
    }

    // Send confirmation email (wrapped in try/catch to prevent 500 errors)
    try {
      console.log('📧 Sending confirmation email...');
      await sendSubscriptionEmail(user.email, {
        plan: subscription.plan,
        invoiceId: subscription.invoiceId,
        amount: subscription.amount,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        userName: user.name,
      });
      console.log('✅ Confirmation email sent successfully:', { 
        email: user.email, 
        plan: subscription.plan 
      });
    } catch (emailError) {
      console.error('❌ Email sending failed (non-critical):', {
        emailError: emailError.message,
        email: user.email,
        plan: subscription.plan,
        stack: emailError.stack
      });
      // Don't fail the request if email fails - continue with success response
    }

    // Success response
    const responseData = {
      success: true,
      message: "Subscription activated successfully",
      subscription: {
        plan: subscription.plan,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        invoiceId: subscription.invoiceId,
      },
    };

    console.log('✅ Payment verification successful:', { 
      subscriptionId: subscription._id,
      plan: subscription.plan,
      userId 
    });

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Unexpected error in verifySubscriptionPayment:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.userid,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      success: false, 
      message: "Failed to verify payment", 
      error: error.message 
    });
  }
};

/**
 * Get user's subscription status
 * GET /subscription/status
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.userid; // Auth middleware sets req.userid (lowercase)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User ID not found"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Check and update expired subscriptions - fallback to FREE plan
    if (!user.isSubscriptionActive() && user.subscriptionPlan !== "FREE") {
      user.subscriptionPlan = "FREE";
      user.subscriptionExpiry = null;
      await user.save();
    }

    // Reset daily count if needed (new day)
    user.resetDailyCountIfNeeded();
    await user.save();

    const planDetails = SUBSCRIPTION_PLANS[user.subscriptionPlan];
    const questionsRemaining =
      planDetails.questionLimit === Infinity
        ? "Unlimited"
        : Math.max(0, planDetails.questionLimit - user.dailyQuestionCount);

    return res.status(200).json({
      success: true,
      subscription: {
        currentPlan: user.subscriptionPlan,
        planName: planDetails.name,
        isActive: user.isSubscriptionActive(),
        expiryDate: user.subscriptionExpiry,
        dailyQuestionLimit: planDetails.questionLimit === Infinity ? "Unlimited" : planDetails.questionLimit,
        questionsPostedToday: user.dailyQuestionCount,
        questionsRemaining,
        canPostQuestion: planDetails.questionLimit === Infinity 
          ? true 
          : user.dailyQuestionCount < planDetails.questionLimit,
      },
    });
  } catch (error) {
    console.error("Get subscription status error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to get subscription status", 
      error: error.message 
    });
  }
};

/**
 * Immediate subscription upgrade (no payment required)
 * POST /subscription/immediate-upgrade
 */
export const immediateUpgradeSubscription = async (req, res) => {
  // Log incoming request for debugging
  console.log('🚀 Immediate Upgrade Request:', {
    body: req.body,
    userId: req.userid,
    timestamp: new Date().toISOString()
  });

  try {
    const { plan } = req.body;
    const userId = req.userid; // Auth middleware sets req.userid (lowercase)

    // Validate user authentication
    if (!userId) {
      console.error('❌ Unauthorized: User ID not found in request');
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User ID not found"
      });
    }

    // Validate request body data
    if (!req.body || typeof req.body !== 'object') {
      console.error('❌ Invalid request body:', req.body);
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Must be a JSON object."
      });
    }

    // Validate plan parameter
    if (!plan) {
      console.error('❌ Missing plan parameter:', { body: req.body });
      return res.status(400).json({ 
        success: false, 
        message: "Missing required parameter: plan" 
      });
    }

    if (typeof plan !== 'string') {
      console.error('❌ Invalid plan type:', { plan, type: typeof plan });
      return res.status(400).json({ 
        success: false, 
        message: "Invalid plan type. Must be a string." 
      });
    }

    const validPlans = ["BRONZE", "SILVER", "GOLD", "FREE"];
    if (!validPlans.includes(plan.toUpperCase())) {
      console.error('❌ Invalid plan value:', { plan, validPlans });
      return res.status(400).json({ 
        success: false, 
        message: `Invalid subscription plan. Must be one of: ${validPlans.join(', ')}` 
      });
    }

    // Normalize plan to uppercase
    const normalizedPlan = plan.toUpperCase();

    // Get user from database
    let user;
    try {
      user = await User.findById(userId);
    } catch (dbError) {
      console.error('❌ Database error finding user:', dbError);
      return res.status(500).json({
        success: false,
        message: "Database error while finding user"
      });
    }

    if (!user) {
      console.error('❌ User not found:', { userId });
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    console.log('✅ User validated for immediate upgrade:', { 
      userId: user._id, 
      email: user.email, 
      currentPlan: user.subscriptionPlan,
      requestedPlan: normalizedPlan,
      isSubscriptionActive: user.isSubscriptionActive(),
      subscriptionExpiry: user.subscriptionExpiry
    });

    // Check if user can upgrade (monthly restriction)
    if (user.isSubscriptionActive() && user.subscriptionPlan !== "FREE") {
      const upgradeDate = user.subscriptionExpiry;
      const upgradeDateFormatted = upgradeDate ? upgradeDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A';
      
      console.error('❌ Upgrade restricted - active subscription:', {
        currentPlan: user.subscriptionPlan,
        expiryDate: upgradeDate,
        requestedPlan: normalizedPlan
      });
      
      return res.status(400).json({
        success: false,
        message: `You cannot upgrade while your current plan is active. You can upgrade again on ${upgradeDateFormatted}.`,
        currentPlan: user.subscriptionPlan,
        upgradeDate: upgradeDate,
        canUpgradeOn: upgradeDate
      });
    }

    // Get plan details
    let planDetails;
    try {
      planDetails = SUBSCRIPTION_PLANS[normalizedPlan];
      if (!planDetails) {
        throw new Error(`Plan configuration not found for: ${normalizedPlan}`);
      }
    } catch (planError) {
      console.error('❌ Plan configuration error:', planError);
      return res.status(500).json({
        success: false,
        message: "Plan configuration error"
      });
    }

    // Validate plan details structure
    if (!planDetails.price || !planDetails.currency) {
      console.error('❌ Invalid plan configuration:', { plan: normalizedPlan, planDetails });
      return res.status(500).json({
        success: false,
        message: "Invalid plan configuration"
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const expiryDate = new Date(Date.now() + planDetails.duration * 24 * 60 * 60 * 1000);
    
    // Update user subscription immediately (no payment required)
    try {
      user.subscriptionPlan = normalizedPlan;
      user.subscriptionExpiry = expiryDate;
      user.dailyQuestionCount = 0; // Reset daily count
      user.lastQuestionDate = null; // Reset last question date
      await user.save();
      
      console.log('✅ User subscription updated immediately:', { 
        userId: user._id, 
        newPlan: user.subscriptionPlan,
        expiryDate: user.subscriptionExpiry 
      });
    } catch (userUpdateError) {
      console.error('❌ User subscription update failed:', userUpdateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update subscription"
      });
    }

    // Create subscription record for tracking (no mock order IDs)
    let subscription;
    try {
      subscription = new Subscription({
        userId,
        plan: normalizedPlan,
        amount: planDetails.price,
        currency: planDetails.currency,
        status: "COMPLETED",
        startDate: startDate,
        expiryDate: expiryDate,
        // No mock order IDs as requested
        invoiceId: `INV_${userId}_${Date.now()}`,
      });
      
      await subscription.save();
      console.log('✅ Subscription record created:', { 
        subscriptionId: subscription._id,
        invoiceId: subscription.invoiceId 
      });
    } catch (subscriptionError) {
      console.error('❌ Subscription record creation failed:', subscriptionError);
      return res.status(500).json({
        success: false,
        message: "Failed to create subscription record"
      });
    }

    // Send confirmation email using existing email logic
    try {
      console.log('📧 Sending immediate upgrade confirmation email...');
      await sendSubscriptionEmail(user.email, {
        plan: subscription.plan,
        invoiceId: subscription.invoiceId,
        amount: subscription.amount,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        userName: user.name,
      });
      console.log('✅ Immediate upgrade confirmation email sent successfully:', { 
        email: user.email, 
        plan: subscription.plan,
        invoiceId: subscription.invoiceId 
      });
    } catch (emailError) {
      console.error('❌ Email sending failed (non-critical):', {
        emailError: emailError.message,
        email: user.email,
        plan: subscription.plan,
        stack: emailError.stack
      });
      // Don't fail the request if email fails - continue with success response
    }

    // Success response as requested
    const responseData = {
      success: true,
      message: "Plan upgraded successfully",
      newPlan: normalizedPlan
    };

    console.log('✅ Immediate upgrade successful:', { 
      userId: user._id,
      oldPlan: user.subscriptionPlan,
      newPlan: normalizedPlan,
      startDate,
      expiryDate,
      invoiceId: subscription.invoiceId 
    });

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Unexpected error in immediateUpgradeSubscription:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.userid,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      success: false, 
      message: "Failed to upgrade plan" 
    });
  }
};

/**
 * Mock subscription activation for testing (no payment required)
 * POST /subscription/mock-activate
 */
export const mockActivateSubscription = async (req, res) => {
  // Log incoming request for debugging
  console.log('🚀 Mock Activation Request:', {
    body: req.body,
    userId: req.userid,
    timestamp: new Date().toISOString()
  });

  try {
    const { plan } = req.body;
    const userId = req.userid; // Auth middleware sets req.userid (lowercase)

    // Validate user authentication
    if (!userId) {
      console.error('❌ Unauthorized: User ID not found in request');
      return res.status(401).json({
        success: false,
        message: "Unauthorized - User ID not found"
      });
    }

    // Validate request body data
    if (!req.body || typeof req.body !== 'object') {
      console.error('❌ Invalid request body:', req.body);
      return res.status(400).json({
        success: false,
        message: "Invalid request body. Must be a JSON object."
      });
    }

    // Validate plan parameter
    if (!plan) {
      console.error('❌ Missing plan parameter:', { body: req.body });
      return res.status(400).json({ 
        success: false, 
        message: "Missing required parameter: plan" 
      });
    }

    if (typeof plan !== 'string') {
      console.error('❌ Invalid plan type:', { plan, type: typeof plan });
      return res.status(400).json({ 
        success: false, 
        message: "Invalid plan type. Must be a string." 
      });
    }

    const validPlans = ["BRONZE", "SILVER", "GOLD"];
    if (!validPlans.includes(plan)) {
      console.error('❌ Invalid plan value:', { plan, validPlans });
      return res.status(400).json({ 
        success: false, 
        message: `Invalid subscription plan. Must be one of: ${validPlans.join(', ')}` 
      });
    }

    // Get user from database
    let user;
    try {
      user = await User.findById(userId);
    } catch (dbError) {
      console.error('❌ Database error finding user:', dbError);
      return res.status(500).json({
        success: false,
        message: "Database error while finding user",
        error: dbError.message
      });
    }

    if (!user) {
      console.error('❌ User not found:', { userId });
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    console.log('✅ User validated for mock activation:', { 
      userId: user._id, 
      email: user.email, 
      currentPlan: user.subscriptionPlan,
      requestedPlan: plan,
      isSubscriptionActive: user.isSubscriptionActive(),
      subscriptionExpiry: user.subscriptionExpiry
    });

    // Check if user can upgrade (monthly restriction)
    if (user.isSubscriptionActive() && user.subscriptionPlan !== "FREE") {
      const upgradeDate = user.subscriptionExpiry;
      const upgradeDateFormatted = upgradeDate ? upgradeDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'N/A';
      
      console.error('❌ Mock activation restricted - active subscription:', {
        currentPlan: user.subscriptionPlan,
        expiryDate: upgradeDate,
        requestedPlan: plan
      });
      
      return res.status(400).json({
        success: false,
        message: `You cannot upgrade while your current plan is active. You can upgrade again on ${upgradeDateFormatted}.`,
        currentPlan: user.subscriptionPlan,
        upgradeDate: upgradeDate,
        canUpgradeOn: upgradeDate
      });
    }

    // Get plan details
    let planDetails;
    try {
      planDetails = SUBSCRIPTION_PLANS[plan];
      if (!planDetails) {
        throw new Error(`Plan configuration not found for: ${plan}`);
      }
    } catch (planError) {
      console.error('❌ Plan configuration error:', planError);
      return res.status(500).json({
        success: false,
        message: "Plan configuration error",
        error: planError.message
      });
    }

    // Create mock subscription record
    let subscription;
    try {
      subscription = new Subscription({
        userId,
        plan,
        amount: planDetails.price,
        currency: planDetails.currency,
        status: "COMPLETED",
        startDate: new Date(),
        expiryDate: new Date(Date.now() + planDetails.duration * 24 * 60 * 60 * 1000),
        invoiceId: `MOCK_${userId}_${Date.now()}`,
        isMock: true
      });
      await subscription.save();
      console.log('✅ Mock subscription record created:', { 
        subscriptionId: subscription._id,
        invoiceId: subscription.invoiceId 
      });
    } catch (subscriptionError) {
      console.error('❌ Mock subscription creation failed:', subscriptionError);
      return res.status(500).json({
        success: false,
        message: "Failed to create mock subscription",
        error: subscriptionError.message
      });
    }

    // Update user subscription
    try {
      user.subscriptionPlan = subscription.plan;
      user.subscriptionExpiry = subscription.expiryDate;
      user.dailyQuestionCount = 0; // Reset daily count
      user.lastQuestionDate = null; // Reset last question date
      await user.save();
      console.log('✅ User subscription updated (mock):', { 
        userId: user._id, 
        newPlan: user.subscriptionPlan,
        expiryDate: user.subscriptionExpiry 
      });
    } catch (userUpdateError) {
      console.error('❌ User subscription update failed (mock):', userUpdateError);
      return res.status(500).json({
        success: false,
        message: "Failed to update user subscription",
        error: userUpdateError.message
      });
    }

    // Send confirmation email (wrapped in try/catch to prevent 500 errors)
    try {
      console.log('📧 Sending mock confirmation email...');
      await sendSubscriptionEmail(user.email, {
        plan: subscription.plan,
        invoiceId: subscription.invoiceId,
        amount: subscription.amount,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        userName: user.name,
      });
      console.log('✅ Mock confirmation email sent successfully:', { 
        email: user.email, 
        plan: subscription.plan,
        invoiceId: subscription.invoiceId 
      });
    } catch (emailError) {
      console.error('❌ Mock email sending failed (non-critical):', {
        emailError: emailError.message,
        email: user.email,
        plan: subscription.plan,
        stack: emailError.stack
      });
      // Don't fail the request if email fails - continue with success response
    }

    // Success response
    const responseData = {
      success: true,
      message: "Subscription activated successfully (mock mode)",
      subscription: {
        plan: subscription.plan,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        invoiceId: subscription.invoiceId,
        isMock: true
      },
    };

    console.log('✅ Mock activation successful:', { 
      subscriptionId: subscription._id,
      plan: subscription.plan,
      userId,
      invoiceId: subscription.invoiceId 
    });

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Unexpected error in mockActivateSubscription:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.userid,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      success: false, 
      message: "Failed to activate subscription", 
      error: error.message 
    });
  }
};
