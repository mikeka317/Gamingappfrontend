import { User } from '../types/user';

const API_BASE_URL = 'http://localhost:5072/api';

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
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired' | 'proof-submitted' | 'verifying' | 'ai-verified' | 'needs-proof';
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
}

export const challengeService = new ChallengeService();
