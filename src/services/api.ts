// API service for backend communication
import { User } from '../types/user';

// const API_BASE_URL = 'http://localhost:5072/api';
export const API_BASE_URL = 'https://gamingappbackend.onrender.com/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  platforms: string[];
  firstName?: string;
  lastName?: string;
  country?: string;
  bio?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch (_) {
        // ignore
      }

      if (response.status === 401) {
        try {
          // Clear tokens and notify globally
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          window.dispatchEvent(new CustomEvent('session-expired'));
        } catch (_) {}
      }

      const message = (errorBody && (errorBody.message || errorBody.error)) || `HTTP ${response.status}`;
      throw new Error(message);
    }
    return response.json();
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials),
    });

    return this.handleResponse<AuthResponse>(response);
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });

    return this.handleResponse<AuthResponse>(response);
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ refreshToken }),
    });

    return this.handleResponse<AuthResponse>(response);
  }

  // User profile endpoints
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<ApiResponse<User>>(response);
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    return this.handleResponse<ApiResponse<User>>(response);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    return this.handleResponse<ApiResponse>(response);
  }

  // Get all users from backend
  async getUsers(): Promise<User[]> {
    try {
      const authToken = localStorage.getItem('authToken');
      
      if (!authToken) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return data.users;
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Generic HTTP methods for other services
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<T>>(response);
  }

  async getPublic<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return this.handleResponse<ApiResponse<T>>(response);
  }

  async post<T = any>(endpoint: string, data?: any, options?: { headers?: Record<string, string> }): Promise<ApiResponse<T>> {
    const headers = options?.headers || this.getAuthHeaders();
    
    // Don't stringify if it's FormData
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body,
    });
    return this.handleResponse<ApiResponse<T>>(response);
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<ApiResponse<T>>(response);
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<ApiResponse<T>>(response);
  }
}

export const apiService = new ApiService();
