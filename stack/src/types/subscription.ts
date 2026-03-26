// types/subscription.ts

export type PlanType = 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD';

export interface Plan {
  id: PlanType;
  name: string;
  price: number;
  limit: string;
  features: string[];
}

export interface SubscriptionStatus {
  currentPlan: PlanType;
  planName: string;
  isActive: boolean;
  expiryDate: string | null;
  dailyQuestionLimit: number | 'Unlimited';
  questionsPostedToday: number;
  questionsRemaining: number | 'Unlimited';
  canPostQuestion: boolean;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order: RazorpayOrder;
  subscriptionId: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  subscriptionId: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  subscription: {
    plan: PlanType;
    startDate: string;
    expiryDate: string;
    invoiceId: string;
  };
  newPlan?: PlanType;
  canUpgradeOn?: string;
  currentPlan?: PlanType;
  upgradeDate?: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  subscription: SubscriptionStatus;
}

export interface QuestionResponse {
  success: boolean;
  message: string;
  question: {
    id: string;
    title: string;
    body: string;
    tags: string[];
    createdAt: string;
  };
  subscription: {
    currentPlan: PlanType;
    questionsPostedToday: number;
    questionsRemaining: number | 'Unlimited';
  };
}

export interface ApiError {
  success: false;
  message: string;
  currentPlan?: PlanType;
  dailyLimit?: number;
  questionsPostedToday?: number;
  upgradeRequired?: boolean;
}

// Razorpay types
export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}