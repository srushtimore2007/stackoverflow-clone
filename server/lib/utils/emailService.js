import sendEmail from '../../utils/sendEmail.js';
import { SUBSCRIPTION_PLANS } from '../../config/plans.js';

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

export const sendSubscriptionEmail = async (userEmail, subscriptionData) => {
  const { plan, invoiceId, amount, startDate, expiryDate, userName } = subscriptionData;

  const planDetails = SUBSCRIPTION_PLANS[plan];
  const amountInRupees = (amount / 100).toFixed(2);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 5px; margin-top: 20px; }
        .details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Subscription Activated!</h1>
        </div>
        
        <div class="content">
          <p>Hello ${userName || 'User'},</p>
          <p>Your subscription has been successfully activated. Thank you for upgrading!</p>
          
          <div class="details">
            <h2 style="color: #4CAF50; margin-top: 0;">Subscription Details</h2>
            
            <div class="detail-row">
              <span class="detail-label">Invoice ID:</span>
              <span class="detail-value">${invoiceId}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Plan Name:</span>
              <span class="detail-value">${planDetails.name}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Amount Paid:</span>
              <span class="detail-value">₹${amountInRupees}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Start Date:</span>
              <span class="detail-value">${formatDate(startDate)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Expiry Date:</span>
              <span class="detail-value">${formatDate(expiryDate)}</span>
            </div>
            
            <div class="detail-row">
              <span class="detail-label">Daily Question Limit:</span>
              <span class="detail-value">${planDetails.questionLimit === Infinity ? 'Unlimited' : planDetails.questionLimit}</span>
            </div>
          </div>
          
          <p>You can now enjoy all the benefits of the <strong>${planDetails.name}</strong>!</p>
        </div>
        
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const success = await sendEmail(
      userEmail,
      `Subscription Activated – ${planDetails.name}`,
      htmlContent
    );
    
    if (!success) {
      throw new Error('Failed to send subscription email');
    }
    
    console.log('Subscription email sent successfully to:', userEmail);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send subscription email');
  }
};