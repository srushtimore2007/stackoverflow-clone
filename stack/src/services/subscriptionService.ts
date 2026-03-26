// services/subscriptionService.ts

import axiosInstance from '../lib/axiosinstance';
import {
  PlanType,
  CreateOrderResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  SubscriptionStatusResponse,
  ApiError
} from '../types/subscription';

/**
 * Get current subscription status
 */
export const getSubscriptionStatus = async (): Promise<SubscriptionStatusResponse> => {
  try {
    const response = await axiosInstance.get<SubscriptionStatusResponse>('/api/subscription/status');
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch subscription status';
    throw new Error(errorMessage);
  }
};

/**
 * Create Razorpay order for subscription
 */
export const createSubscriptionOrder = async (plan: PlanType): Promise<CreateOrderResponse> => {
  try {
    const response = await axiosInstance.post<CreateOrderResponse>('/api/subscription/create-order', {
      plan,
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create order';
    throw new Error(errorMessage);
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyPayment = async (
  paymentData: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> => {
  try {
    const response = await axiosInstance.post<VerifyPaymentResponse>(
      '/api/subscription/verify-payment',
      paymentData
    );
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Payment verification failed';
    throw new Error(errorMessage);
  }
};

/**
 * Mock subscription activation for testing (no payment required)
 */
export const mockActivateSubscription = async (plan: PlanType): Promise<VerifyPaymentResponse> => {
  try {
    const response = await axiosInstance.post<VerifyPaymentResponse>('/api/subscription/mock-activate', {
      plan,
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to activate subscription';
    throw new Error(errorMessage);
  }
};

/**
 * Immediate subscription upgrade (no payment required)
 */
export const immediateUpgradeSubscription = async (plan: PlanType): Promise<VerifyPaymentResponse> => {
  try {
    const response = await axiosInstance.post<VerifyPaymentResponse>('/api/subscription/immediate-upgrade', {
      plan,
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to upgrade subscription';
    throw new Error(errorMessage);
  }
};

export default {
  getSubscriptionStatus,
  createSubscriptionOrder,
  verifyPayment,
  mockActivateSubscription,
  immediateUpgradeSubscription,
};