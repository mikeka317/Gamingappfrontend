import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiService, User, LoginRequest, RegisterRequest } from '@/services/api';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebaseClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const isAuthenticated = !!user;

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          await refreshUserProfile();
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Global listener for session expiration
  useEffect(() => {
    const onExpired = () => {
      setSessionExpired(true);
      setUser(null);
    };
    window.addEventListener('session-expired', onExpired as EventListener);
    return () => window.removeEventListener('session-expired', onExpired as EventListener);
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      // Sign in via Firebase client so new password is honored
      const cred = await signInWithEmailAndPassword(firebaseAuth, credentials.email, credentials.password);
      const idToken = await cred.user.getIdToken(/* forceRefresh */ true);

      // Exchange idToken with backend for app JWT + profile
      const response = await apiService.post('/auth/login', { idToken });
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data as any;
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user as User);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(userData);
      
      if (response.success && response.data) {
        const { user, token, refreshToken } = response.data;
        
        // Store tokens
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Set user state
        setUser(user);
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call backend logout endpoint to update lastActive timestamp
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        await fetch('http://localhost:5072/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        console.log('✅ Backend logout called successfully');
      }
    } catch (error) {
      console.warn('⚠️ Could not call backend logout:', error);
      // Don't fail logout if backend call fails
    } finally {
      // Clear tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // Clear user state
      setUser(null);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      const response = await apiService.updateProfile(updates);
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile,
    refreshUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {sessionExpired && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-card rounded-lg border border-border/50 max-w-sm w-full p-5 text-center">
            <h3 className="text-lg font-semibold mb-2">Session Expired</h3>
            <p className="text-sm text-muted-foreground mb-4">Your session has expired. Please log in again.</p>
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                setSessionExpired(false);
                window.location.href = '/admin-login';
              }}
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
