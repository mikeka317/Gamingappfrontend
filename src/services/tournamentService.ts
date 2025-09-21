import { API_BASE_URL } from './api';

export interface TournamentParticipant {
  uid: string;
  username: string;
  joinedAt: string;
  level?: number;
}

export interface TournamentMatch {
  id: string;
  round: number;
  matchNumber: number;
  player1: TournamentParticipant;
  player2: TournamentParticipant;
  status: 'pending' | 'ready' | 'in_progress' | 'scorecard_submitted' | 'ai_verification' | 'completed';
  winner?: string;
  scorecard?: {
    player1Score: number;
    player2Score: number;
    submittedBy: string;
    submittedAt: string;
  };
  aiResult?: {
    winner: string;
    confidence: number;
    reasoning: string;
    verifiedAt: string;
  };
  proof?: Record<string, any>;
}

export interface Tournament {
  id: string;
  type: 'clash' | 'battle' | 'rumble' | 'warzone';
  name: string;
  players: number;
  entryFee: number;
  winnerReward: number;
  adminReward: number;
  status: 'waiting' | 'starting' | 'in_progress' | 'completed';
  participants: TournamentParticipant[];
  bracket?: TournamentMatch[];
  currentRound: number;
  winner?: TournamentParticipant;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ActiveTournaments {
  clash?: Tournament;
  battle?: Tournament;
  rumble?: Tournament;
  warzone?: Tournament;
}

class TournamentService {
  private baseUrl = `${API_BASE_URL}/tournaments`;

  // Get all active tournaments
  async getActiveTournaments(): Promise<ActiveTournaments> {
    try {
      const response = await fetch(`${this.baseUrl}/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.tournaments;
    } catch (error) {
      console.error('Error fetching active tournaments:', error);
      throw error;
    }
  }

  // Join a tournament
  async joinTournament(tournamentId: string, tournamentType: string): Promise<Tournament> {
    try {
      const response = await fetch(`${this.baseUrl}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          tournamentId,
          tournamentType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.tournament;
    } catch (error) {
      console.error('Error joining tournament:', error);
      throw error;
    }
  }

  // Leave a tournament
  async leaveTournament(tournamentId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          tournamentId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error leaving tournament:', error);
      throw error;
    }
  }

  // Get tournament details
  async getTournamentDetails(tournamentId: string): Promise<{ tournament: Tournament; isParticipant: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching tournament details:', error);
      throw error;
    }
  }

  // Start a match
  async startMatch(tournamentId: string, matchId: string): Promise<{ startedPlayers: string[], bothPlayersStarted: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/matches/${matchId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error starting match:', error);
      throw error;
    }
  }

  // Ready match
  async readyMatch(tournamentId: string, matchId: string): Promise<{ readyPlayers: string[], bothPlayersReady: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/matches/${matchId}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error readying match:', error);
      throw error;
    }
  }

  // Submit scorecard
  async submitScorecard(tournamentId: string, matchId: string, player1Score: number, player2Score: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/matches/${matchId}/scorecard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          player1Score,
          player2Score
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting scorecard:', error);
      throw error;
    }
  }

  // AI claim for match
  async uploadProof(tournamentId: string, matchId: string, proofImages: string[], proofDescription: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/matches/${matchId}/upload-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          proofImages,
          proofDescription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading proof:', error);
      throw error;
    }
  }

  async checkMatchStatus(tournamentId: string, matchId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/matches/${matchId}/status-check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking match status:', error);
      throw error;
    }
  }

  async aiClaim(tournamentId: string, matchId: string): Promise<{ aiResult: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/matches/${matchId}/ai-claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing AI claim:', error);
      throw error;
    }
  }

  // Start tournament
  async startTournament(tournamentId: string): Promise<Tournament> {
    try {
      const response = await fetch(`${this.baseUrl}/${tournamentId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.tournament;
    } catch (error) {
      console.error('Error starting tournament:', error);
      throw error;
    }
  }
}

export const tournamentService = new TournamentService();
