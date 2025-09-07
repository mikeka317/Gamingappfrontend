import { apiService } from './api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

export interface AIScoreboardAnalysis {
  winner: string;
  score: string;
  players: string[];
  gameType?: string;
  confidence: number;
  iWin: boolean;
  analyzedAt: string;
  challengeId?: string;
}

export interface AIChallengeVerification {
  winner: string;
  score: string;
  players: string[];
  gameType?: string;
  confidence: number;
  verificationResult: 'verified' | 'needs_review' | 'rejected';
  reasoning: string;
  evidenceQuality: 'high' | 'medium' | 'low';
  suggestions: string[];
  iWin: boolean;
  analyzedAt: string;
  challengeId: string;
  myTeam: string;
}

export interface AIVerificationRequest {
  myTeam: string;
  challengeId?: string;
  gameType?: string;
  proofDescription?: string;
}

class AIVerificationService {
  private baseUrl = '/ai-verification';

  /**
   * Analyze a scoreboard screenshot using AI
   */
  async analyzeScoreboard(
    screenshot: File,
    request: AIVerificationRequest
  ): Promise<AIScoreboardAnalysis> {
    const formData = new FormData();
    formData.append('screenshot', screenshot);
    formData.append('myTeam', request.myTeam);
    
    if (request.challengeId) {
      formData.append('challengeId', request.challengeId);
    }
    
    if (request.gameType) {
      formData.append('gameType', request.gameType);
    }

    const response = await apiService.post(`${this.baseUrl}/analyze-scoreboard`, formData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    console.log('🔍 AI Scoreboard Analysis Response:', response);
    console.log('🔍 Response data:', response.data);
    console.log('🔍 Response data.data:', response.data?.data);

    // Add comprehensive error checking
    if (!response.data) {
      throw new Error('No response data received from AI scoreboard analysis service');
    }

    if (!response.data.data) {
      console.warn('⚠️ No data field in response, using full response:', response.data);
      return response.data;
    }

    return response.data.data;
  }

  /**
   * Verify a challenge proof using AI
   */
  async verifyChallengeProof(
    screenshot: File,
    request: AIVerificationRequest & { challengeId: string; proofDescription: string }
  ): Promise<AIChallengeVerification> {
    const formData = new FormData();
    formData.append('screenshot', screenshot);
    formData.append('challengeId', request.challengeId);
    formData.append('myTeam', request.myTeam);
    formData.append('proofDescription', request.proofDescription);
    
    if (request.gameType) {
      formData.append('gameType', request.gameType);
    }

    const response = await apiService.post(`${this.baseUrl}/verify-challenge-proof`, formData, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    console.log('🔍 AI Verification Service Response:', response);
    console.log('🔍 Response data:', response.data);
    console.log('🔍 Response data.data:', response.data?.data);

    // Add comprehensive error checking
    if (!response.data) {
      throw new Error('No response data received from AI verification service');
    }

    if (!response.data.data) {
      console.warn('⚠️ No data field in response, using full response:', response.data);
      return response.data;
    }

    return response.data.data;
  }

  /**
   * Check if the AI verification service is healthy
   */
  async checkHealth(): Promise<{ success: boolean; message: string; openaiConfigured: boolean }> {
    const response = await apiService.get(`${this.baseUrl}/health`);
    return response.data;
  }

  /**
   * Get AI analysis for a specific challenge
   */
  async getChallengeAnalysis(
    challengeId: string,
    screenshot: File,
    myTeam: string,
    gameType?: string
  ): Promise<AIScoreboardAnalysis> {
    return this.analyzeScoreboard(screenshot, {
      challengeId,
      myTeam,
      gameType,
    });
  }

  /**
   * Submit proof for a challenge with AI verification
   */
  async submitProofWithAI(
    challengeId: string,
    screenshot: File,
    myTeam: string,
    proofDescription: string,
    gameType?: string
  ): Promise<AIChallengeVerification> {
    return this.verifyChallengeProof(screenshot, {
      challengeId,
      myTeam,
      proofDescription,
      gameType,
    });
  }
}

export const aiVerificationService = new AIVerificationService();
export default aiVerificationService;
