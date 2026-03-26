import React, { useEffect } from 'react';
import { toast } from 'react-toastify';

interface RazorpayPaymentProps {
  orderId: string;
  amount: number;
  currency: string;
  planName: string;
  keyId: string;
  subscriptionId: string;
  onSuccess: (response: any) => void;
  onError: (error: any) => void;
  onClose: () => void;
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  orderId,
  amount,
  currency,
  planName,
  keyId,
  subscriptionId,
  onSuccess,
  onError,
  onClose
}) => {
  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = initializeRazorpay;
    script.onerror = () => {
      toast.error('Failed to load payment gateway');
      onError(new Error('Failed to load payment gateway'));
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeRazorpay = () => {
    if (!window.Razorpay) {
      toast.error('Payment gateway not available');
      onError(new Error('Payment gateway not available'));
      return;
    }

    const options = {
      key: keyId,
      amount: amount,
      currency: currency,
      name: 'Stack Overflow Clone',
      description: `Upgrade to ${planName}`,
      order_id: orderId,
      handler: function (response: any) {
        // Payment successful
        onSuccess({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          subscriptionId: subscriptionId
        });
      },
      modal: {
        ondismiss: function () {
          onClose();
        }
      },
      prefill: {
        name: '',
        email: '',
        contact: ''
      },
      theme: {
        color: '#3399cc'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return null;
};

export default RazorpayPayment;
