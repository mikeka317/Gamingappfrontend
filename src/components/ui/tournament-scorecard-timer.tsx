import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface TournamentScorecardTimerProps {
  tournamentId: string;
  matchId: string;
  onTimerExpired?: () => void;
}

const formatTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getTimerColor = (timeRemaining: number): string => {
  const totalTime = 5 * 60 * 1000; // 5 minutes
  const percentage = (timeRemaining / totalTime) * 100;
  
  if (percentage > 50) return '#10b981'; // green
  if (percentage > 25) return '#f59e0b'; // yellow
  return '#ef4444'; // red
};

export function TournamentScorecardTimer({ tournamentId, matchId, onTimerExpired }: TournamentScorecardTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasTimer, setHasTimer] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTimerStatus = async () => {
      try {
        // Check if user is authenticated
        if (!user) {
          console.log('🕐 Tournament Timer: No authenticated user found');
          return;
        }

        // Get backend JWT token from localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('🕐 Tournament Timer: No backend auth token found');
          return;
        }

        console.log('🕐 Tournament Timer: Fetching timer status for match:', matchId);
        const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/matches/${matchId}/scorecard-timer`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🕐 Tournament Timer: Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🕐 Tournament Timer: Timer data:', data);
          
          setHasTimer(data.data.hasTimer);
          setTimeRemaining(data.data.timeRemaining);
          setIsExpired(data.data.timerExpired);
          
          // Store timer data in localStorage for persistence
          if (data.data.hasTimer && data.data.timeRemaining > 0) {
            const endTime = Date.now() + data.data.timeRemaining;
            localStorage.setItem(`tournament_timer_${matchId}`, JSON.stringify({
              endTime: endTime,
              startTime: Date.now()
            }));
          }
          
          if (data.data.timerExpired && onTimerExpired) {
            onTimerExpired();
          }
        } else if (response.status === 403) {
          console.error('🕐 Tournament Timer: Authentication failed - token may be expired');
          // Try to get timer from localStorage as fallback
          const storedTimer = localStorage.getItem(`tournament_timer_${matchId}`);
          if (storedTimer) {
            const timerData = JSON.parse(storedTimer);
            const now = Date.now();
            const remaining = Math.max(0, timerData.endTime - now);
            if (remaining > 0) {
              setHasTimer(true);
              setTimeRemaining(remaining);
              setIsExpired(false);
              console.log('🕐 Tournament Timer: Using stored timer data:', remaining);
            }
          }
        } else {
          console.error('🕐 Tournament Timer: Timer status fetch failed:', response.status);
          const errorText = await response.text();
          console.error('🕐 Tournament Timer: Error response:', errorText);
        }
      } catch (error) {
        console.error('🕐 Tournament Timer: Error fetching timer status:', error);
        // Try to get timer from localStorage as fallback
        const storedTimer = localStorage.getItem(`tournament_timer_${matchId}`);
        if (storedTimer) {
          const timerData = JSON.parse(storedTimer);
          const now = Date.now();
          const remaining = Math.max(0, timerData.endTime - now);
          if (remaining > 0) {
            setHasTimer(true);
            setTimeRemaining(remaining);
            setIsExpired(false);
            console.log('🕐 Tournament Timer: Using stored timer data (fallback):', remaining);
          }
        }
      }
    };

    fetchTimerStatus();
    
    // Start timer if we have time remaining
    if (timeRemaining > 0) {
      console.log('🕐 Tournament Timer: Starting countdown with timeRemaining:', timeRemaining);
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1000;
          console.log('🕐 Tournament Timer: Timer tick - prev:', prev, 'newTime:', newTime);
          if (newTime <= 0) {
            console.log('🕐 Tournament Timer: Timer expired!');
            setIsExpired(true);
            // Clear stored timer when expired
            localStorage.removeItem(`tournament_timer_${matchId}`);
            if (onTimerExpired) {
              onTimerExpired();
            }
            return 0;
          }
          // Update stored timer with remaining time
          const endTime = Date.now() + newTime;
          localStorage.setItem(`tournament_timer_${matchId}`, JSON.stringify({
            endTime: endTime,
            startTime: Date.now() - (timeRemaining - newTime)
          }));
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [tournamentId, matchId, timeRemaining, onTimerExpired, user]);

  // Only show timer if backend has timer data
  if (!hasTimer) {
    console.log('🕐 Tournament Timer: No timer data available for match:', matchId);
    return null;
  }

  if (isExpired) {
    return (
      <div className="flex items-center justify-center space-x-2 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">Scorecard Timer Expired</span>
      </div>
    );
  }

  const progress = ((5 * 60 * 1000 - timeRemaining) / (5 * 60 * 1000)) * 100;
  const color = getTimerColor(timeRemaining);

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-gray-200"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="transition-all duration-1000 ease-linear"
            stroke={color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${progress}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs font-mono font-bold" style={{ color }}>
              {formatTime(timeRemaining)}
            </div>
            <div className="text-xs text-gray-500">Scorecard</div>
          </div>
        </div>
      </div>
    </div>
  );
}
