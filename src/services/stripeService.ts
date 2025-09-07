import { apiService } from './api';

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export class StripeService {
  // Create a checkout session for deposit
  async createCheckoutSession(amount: number, description?: string): Promise<StripeCheckoutSession> {
    try {
      console.log('🔍 StripeService: Creating checkout session:', {
        amount,
        description,
        endpoint: '/stripe/create-checkout-session'
      });

      const response = await apiService.post('/stripe/create-checkout-session', {
        amount,
        description: description || 'Wallet deposit'
      });

      console.log('🔍 StripeService: API response received:', {
        success: response.success,
        message: response.message,
        hasData: !!response.data
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create checkout session');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ StripeService: Error creating checkout session:', error);
      console.error('❌ StripeService: Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to create checkout session');
    }
  }

  // Redirect to Stripe checkout
  async redirectToCheckout(sessionUrl: string): Promise<void> {
    try {
      // Open Stripe checkout in the same tab
      window.location.href = sessionUrl;
    } catch (error) {
      console.error('Error redirecting to Stripe checkout:', error);
      throw error;
    }
  }

  // Handle successful payment (called after redirect back from Stripe)
  async handlePaymentSuccess(sessionId: string): Promise<void> {
    try {
      // You can implement additional verification here if needed
      console.log('Payment successful for session:', sessionId);
      
      // The backend webhook should have already processed the payment
      // You can optionally verify the payment status here
    } catch (error) {
      console.error('Error handling payment success:', error);
      throw error;
    }
  }

  // Handle payment cancellation
  async handlePaymentCancellation(): Promise<void> {
    try {
      console.log('Payment was cancelled by user');
      // You can implement cleanup logic here if needed
    } catch (error) {
      console.error('Error handling payment cancellation:', error);
      throw error;
    }
  }

  // Get payment methods for a user (future use)
  async getPaymentMethods(): Promise<any[]> {
    try {
      const response = await apiService.get('/stripe/payment-methods');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get payment methods');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error getting payment methods:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get payment methods');
    }
  }

  // Get payment history from Stripe (future use)
  async getPaymentHistory(): Promise<any[]> {
    try {
      const response = await apiService.get('/stripe/payment-history');
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to get payment history');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error getting payment history:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get payment history');
    }
  }

  // Manually verify a Stripe payment (for testing/debugging)
  async verifyPayment(sessionId: string): Promise<any> {
    try {
      console.log('🔍 StripeService: Verifying payment manually:', { sessionId });
      
      const response = await apiService.post('/stripe/verify-payment', { sessionId });
      
      console.log('🔍 StripeService: Verification response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to verify payment');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ StripeService: Error verifying payment:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to verify payment');
    }
  }
}

export const stripeService = new StripeService();
