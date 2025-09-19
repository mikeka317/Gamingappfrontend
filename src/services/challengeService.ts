import { User } from '../types/user';
import { API_BASE_URL  } from '@/services/api';


export interface Challenge {
  id: string;
  challenger: {
    uid: string;
    username: string;
  };
  opponents: Array<{
    username: string;
    status: 'pending' | 'accepted' | 'declined';
    responseAt: Date | null;
    myTeam?: string;
    accepterPlatformUsernames?: { [platform: string]: string };
  }>;
  game: string;
  stake: number;
  platform: string;
  deadline: Date; // may be absent going forward
  description: string; // may be absent going forward
  label: string;
  isPublic: boolean;
  myTeam?: string; // legacy
  challengerPlatformUsernames?: { [platform: string]: string }; // legacy
  status: 'pending' | 'ready-pending' | 'active' | 'completed' | 'cancelled' | 'expired' | 'proof-submitted' | 'verifying' | 'ai-verified' | 'needs-proof' | 'scorecard-pending' | 'scorecard-conflict' | 'ai-verification-pending' | 'ai-conflict';
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  winner: string | null;
  loser: string | null;
  result?: 'won' | 'lost';
  proofRequired: boolean;
  proofSubmitted: boolean;
  proofImages: string[];
  proofDescription: string;
  proofSubmittedAt: Date | null;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'disputed';
  verificationNotes: string;
  type: 'outgoing' | 'incoming';
  // Optional fields added by client for disputes handling
  disputed?: boolean;
  disputeResolved?: boolean;
  // Scorecard related fields
  scorecards?: Array<{
    playerAScore: number;
    playerBScore: number;
    playerAPlatformUsername: string;
    playerBPlatformUsername: string;
    submittedBy: string;
    submittedAt: Date;
    timestamp: number;
  }>;
  scorecardTimerStarted?: Date;
  conflictDetectedAt?: Date;
}

export interface CreateChallengeRequest {
  opponents: string[];
  game: string;
  stake: number;
  platform: string;
  label: string;
  isPublic: boolean;
  challengerPlatformUsernames?: { [platform: string]: string };
}

export interface ChallengeResponse {
  success: boolean;
  message: string;
  data?: Challenge | Challenge[];
}

class ChallengeService {
  private getAuthHeaders(): HeadersInit {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('No authentication token found');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };
  }

  private getAuthHeadersForFormData(): HeadersInit {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('No authentication token found');
    }
    
    return {
      'Authorization': `Bearer ${authToken}`
      // Don't set Content-Type for FormData - let browser set it with boundary
    };
  }

  // Create a new challenge
  async createChallenge(challengeData: CreateChallengeRequest): Promise<Challenge> {
    try {
      console.log('🚀 ChallengeService: Sending challenge data to API:', challengeData);
      console.log('🚀 ChallengeService: Data type:', typeof challengeData);
      console.log('🚀 ChallengeService: Has challengerPlatformUsernames:', 'challengerPlatformUsernames' in challengeData);
      console.log('🚀 ChallengeService: challengerPlatformUsernames value:', challengeData.challengerPlatformUsernames);
      
      const response = await fetch(`${API_BASE_URL}/challenges`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(challengeData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ChallengeResponse = await response.json();
      
      if (data.success && data.data) {
        return data.data as Challenge;
      } else {
        throw new Error(data.message || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  // Get all challenges for the authenticated user
  async getMyChallenges(): Promise<Challenge[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/my-challenges`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ChallengeResponse = await response.json();
      
      if (data.success && data.data) {
        return data.data as Challenge[];
      } else {
        throw new Error(data.message || 'Failed to fetch challenges');
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      throw error;
    }
  }

  // Get challenges for the authenticated user (where they are the opponent)
  async getChallengesForMe(): Promise<Challenge[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/for-me`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ChallengeResponse = await response.json();
      
      if (data.success && data.data) {
        return data.data as Challenge[];
      } else {
        throw new Error(data.message || 'Failed to fetch challenges for me');
      }
    } catch (error) {
      console.error('Error fetching challenges for me:', error);
      throw error;
    }
  }

  // Get public challenges
  async getPublicChallenges(): Promise<Challenge[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/public`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ChallengeResponse = await response.json();
      
      if (data.success && data.data) {
        return data.data as Challenge[];
      } else {
        throw new Error(data.message || 'Failed to fetch public challenges');
      }
    } catch (error) {
      console.error('Error fetching public challenges:', error);
      throw error;
    }
  }

  // Get challenge by ID
  async getChallenge(id: string): Promise<Challenge> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ChallengeResponse = await response.json();
      
      if (data.success && data.data) {
        return data.data as Challenge;
      } else {
        throw new Error(data.message || 'Failed to fetch challenge');
      }
    } catch (error) {
      console.error('Error fetching challenge:', error);
      throw error;
    }
  }

  // Accept or decline a challenge
  async respondToChallenge(challengeId: string, response: 'accept' | 'decline', myTeam?: string, accepterPlatformUsernames?: { [platform: string]: string }): Promise<Challenge> {
    try {
      const responseData = await fetch(`${API_BASE_URL}/challenges/${challengeId}/respond`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ response, myTeam, accepterPlatformUsernames })
      });

      if (!responseData.ok) {
        const errorData = await responseData.json();
        throw new Error(errorData.message || `HTTP error! status: ${responseData.status}`);
      }

      const data: ChallengeResponse = await responseData.json();
      
      if (data.success && data.data) {
        return data.data as Challenge;
      } else {
        throw new Error(data.message || 'Failed to respond to challenge');
      }
    } catch (error) {
      console.error('Error responding to challenge:', error);
      throw error;
    }
  }

  // Cancel a challenge
  async cancelChallenge(challengeId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/cancel`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel challenge');
      }

      const data: ChallengeResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to cancel challenge');
      }
    } catch (error) {
      console.error('Error cancelling challenge:', error);
      throw error;
    }
  }

  // Delete a challenge
  async deleteChallenge(challengeId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete challenge');
      }

      const data: ChallengeResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete challenge');
      }
    } catch (error) {
      console.error('Error cancelling challenge:', error);
      throw error;
    }
  }

  // Join a public challenge
  async joinChallenge(challengeId: string): Promise<Challenge> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ChallengeResponse = await response.json();
      
      if (data.success && data.data) {
        return data.data as Challenge;
      } else {
        throw new Error(data.message || 'Failed to join challenge');
      }
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  // Submit scorecard for challenge
  async submitScorecard(challengeId: string, scorecardData: {
    playerAScore: number;
    playerBScore: number;
    playerAPlatformUsername: string;
    playerBPlatformUsername: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/submit-scorecard`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(scorecardData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting scorecard:', error);
      throw error;
    }
  }

  // Check scorecard status
  async getScorecardStatus(challengeId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/scorecard-status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking scorecard status:', error);
      throw error;
    }
  }

  // Submit proof for scorecard conflict
  async submitProofForConflict(challengeId: string, proofData: {
    description: string;
    proofImages?: File[];
  }): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('description', proofData.description);
      
      if (proofData.proofImages) {
        proofData.proofImages.forEach(image => {
          formData.append('proofImages', image);
        });
      }

      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/submit-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting proof for conflict:', error);
      throw error;
    }
  }

  // Process auto-forfeit
  async processAutoForfeit(challengeId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/auto-forfeit`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing auto-forfeit:', error);
      throw error;
    }
  }

  // Submit AI verification for scorecard conflict
  async submitAIVerification(challengeId: string, proofData: {
    description: string;
    proofImages: File[];
  }): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('description', proofData.description);
      
      // Add all proof images
      proofData.proofImages.forEach((image, index) => {
        formData.append(`proofImages`, image);
      });

      console.log('🤖 Submitting AI verification with FormData:', {
        challengeId,
        description: proofData.description,
        imageCount: proofData.proofImages.length
      });

      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/ai-verification`, {
        method: 'POST',
        headers: this.getAuthHeadersForFormData(),
        body: formData
      });

      console.log('🤖 AI verification response status:', response.status);
      console.log('🤖 AI verification response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('❌ Failed to parse error response as JSON:', e);
          const errorText = await response.text();
          console.error('❌ Error response text:', errorText);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('🤖 AI verification response data:', data);
      return data;
    } catch (error) {
      console.error('Error submitting AI verification:', error);
      throw error;
    }
  }

  // Mark ready for challenge
  async markReady(challengeId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/ready`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark ready');
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking ready:', error);
      throw error;
    }
  }

  // Get timer status for scorecard submission
  async getTimerStatus(challengeId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/timer-status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get timer status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting timer status:', error);
      throw error;
    }
  }

  // Get AI verification timer status
  async getAiTimerStatus(challengeId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/ai-timer-status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get AI timer status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting AI timer status:', error);
      throw error;
    }
  }

  // Resolve AI conflict (admin only)
  async resolveAiConflict(challengeId: string, winner: string, adminReason?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/resolve-ai-conflict`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ winner, adminReason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resolve AI conflict');
      }

      return await response.json();
    } catch (error) {
      console.error('Error resolving AI conflict:', error);
      throw error;
    }
  }
}

export const challengeService = new ChallengeService();
