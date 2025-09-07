import { apiService } from './api';

export interface Wallet {
  id: string;
  userId: string;
  username: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  username: string;
  type: 'deposit' | 'withdrawal' | 'challenge_deduction' | 'challenge_reward' | 'admin_fee' | 'refund';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  challengeId: string;
  challengerId: string;
  challengerUsername: string;
  opponentId: string;
  opponentUsername: string;
  disputeReason: string;
  evidence: string[];
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolution?: 'challenger_wins' | 'opponent_wins' | 'split' | 'refund';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class WalletService {
  // Get user wallet
  async getUserWallet(): Promise<Wallet> {
    try {
      const response = await apiService.get('/wallet');
      console.log('🔍 Get user wallet response:', response);
      
      if (!response.data) {
        throw new Error('Invalid response structure: missing data');
      }
      
      if (response.data.data) {
        return response.data.data;
      }
      
      if (response.data.id) {
        return response.data;
      }
      
      console.warn('⚠️ Unexpected user wallet response structure:', response);
      throw new Error('Invalid wallet data structure');
    } catch (error) {
      console.error('Error getting user wallet:', error);
      throw error;
    }
  }

  // Get wallet balance
  async getWalletBalance(): Promise<number> {
    try {
      const response = await apiService.get('/wallet/balance');
      console.log('🔍 Wallet balance response:', response);
      
      if (!response.data) {
        throw new Error('Invalid response structure: missing data');
      }
      
      if (response.data.data && typeof response.data.data.balance === 'number') {
        return response.data.data.balance;
      }
      
      if (typeof response.data.balance === 'number') {
        return response.data.balance;
      }
      
      console.warn('⚠️ Unexpected wallet balance response structure:', response);
      return 0; // Return 0 as fallback
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0; // Return 0 as fallback instead of throwing
    }
  }

  // Add funds to wallet
  async addFunds(amount: number, description?: string): Promise<Transaction> {
    try {
      const response = await apiService.post('/wallet/deposit', {
        amount,
        description: description || 'Manual deposit'
      });
      console.log('🔍 Add funds response:', response);
      
      if (!response.data) {
        throw new Error('Invalid response structure: missing data');
      }
      
      if (response.data.data) {
        return response.data.data;
      }
      
      if (response.data.id) {
        return response.data;
      }
      
      console.warn('⚠️ Unexpected add funds response structure:', response);
      throw new Error('Invalid transaction data structure');
    } catch (error) {
      console.error('Error adding funds:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactions(limit: number = 50): Promise<Transaction[]> {
    try {
      const response = await apiService.get(`/wallet/transactions?limit=${limit}`);
      console.log('🔍 Get transactions response:', response);
      
      if (!response.data) {
        throw new Error('Invalid response structure: missing data');
      }
      
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      console.warn('⚠️ Unexpected transactions response structure:', response);
      return []; // Return empty array as fallback
    } catch (error) {
      console.error('Error getting transactions:', error);
      return []; // Return empty array as fallback instead of throwing
    }
  }

  // Create dispute
  async createDispute(
    challengeId: string,
    opponentId: string,
    opponentUsername: string,
    disputeReason: string,
    evidence?: string[]
  ): Promise<Dispute> {
    try {
      const response = await apiService.post('/wallet/dispute', {
        challengeId,
        opponentId,
        opponentUsername,
        disputeReason,
        evidence: evidence || []
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating dispute:', error);
      throw error;
    }
  }

  // Check if user has an active dispute for a specific challenge
  async hasActiveDispute(challengeId: string): Promise<boolean> {
    try {
      const response = await apiService.get(`/wallet/disputes`);
      const disputes: Dispute[] = response.data.data || [];
      return disputes.some(d => d.challengeId === challengeId && (d.status === 'pending' || d.status === 'under_review'));
    } catch (error) {
      console.error('Error checking active dispute:', error);
      return false;
    }
  }

  // Get user disputes
  async getUserDisputes(): Promise<Dispute[]> {
    try {
      const response = await apiService.get('/wallet/disputes');
      return response.data.data;
    } catch (error) {
      console.error('Error getting user disputes:', error);
      throw error;
    }
  }

  // Get dispute by ID
  async getDisputeById(disputeId: string): Promise<Dispute> {
    try {
      const response = await apiService.get(`/wallet/disputes/${disputeId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting dispute:', error);
      throw error;
    }
  }

  // Future: Stripe payment integration
  async createStripePaymentIntent(amount: number): Promise<{ clientSecret: string; amount: number }> {
    try {
      const response = await apiService.post('/wallet/stripe/payment-intent', { amount });
      return response.data.data;
    } catch (error) {
      console.error('Error creating Stripe payment intent:', error);
      throw error;
    }
  }

  // Future: PayPal payment integration
  async createPayPalOrder(amount: number): Promise<{ orderId: string; amount: number }> {
    try {
      const response = await apiService.post('/wallet/paypal/create-order', { amount });
      return response.data.data;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw error;
    }
  }
}

export const walletService = new WalletService();
