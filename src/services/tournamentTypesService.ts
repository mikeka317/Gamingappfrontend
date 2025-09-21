import { API_BASE_URL } from './api';

export interface TournamentType {
  id: string;
  name: string;
  key: string;
  players: number;
  entryFee: number;
  winnerReward: number;
  adminReward: number;
  description: string;
  icon: string;
  color: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

class TournamentTypesService {
  private baseUrl = `${API_BASE_URL}/tournament-types`;

  // Get all tournament types (admin only)
  async getTournamentTypes(): Promise<TournamentType[]> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.tournamentTypes;
    } catch (error) {
      console.error('Error fetching tournament types:', error);
      throw error;
    }
  }

  // Get active tournament types (public)
  async getActiveTournamentTypes(): Promise<TournamentType[]> {
    try {
      const response = await fetch(`${this.baseUrl}/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.tournamentTypes;
    } catch (error) {
      console.error('Error fetching active tournament types:', error);
      throw error;
    }
  }

  // Create new tournament type (admin only)
  async createTournamentType(tournamentType: Omit<TournamentType, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<TournamentType> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(tournamentType)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.tournamentType;
    } catch (error) {
      console.error('Error creating tournament type:', error);
      throw error;
    }
  }

  // Update tournament type (admin only)
  async updateTournamentType(id: string, updates: Partial<TournamentType>): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating tournament type:', error);
      throw error;
    }
  }

  // Toggle tournament type active status (admin only)
  async toggleTournamentType(id: string): Promise<{ isActive: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}/toggle`, {
        method: 'PATCH',
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
      return { isActive: data.isActive };
    } catch (error) {
      console.error('Error toggling tournament type:', error);
      throw error;
    }
  }

  // Delete tournament type (admin only)
  async deleteTournamentType(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting tournament type:', error);
      throw error;
    }
  }

  // Get tournament type by ID (admin only)
  async getTournamentType(id: string): Promise<TournamentType> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
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
      return data.tournamentType;
    } catch (error) {
      console.error('Error fetching tournament type:', error);
      throw error;
    }
  }
}

export const tournamentTypesService = new TournamentTypesService();
