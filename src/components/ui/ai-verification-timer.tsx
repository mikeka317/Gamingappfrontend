import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface AiVerificationTimerProps {
  challengeId: string;
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

export function AiVerificationTimer({ challengeId, onTimerExpired }: AiVerificationTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasTimer, setHasTimer] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTimerStatus = async () => {
      try {
        // Check if user is authenticated
        if (!user) {
          console.log('🤖 No authenticated user found');
          return;
        }

        // Get backend JWT token from localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('🤖 No backend auth token found');
          return;
        }

        console.log('🤖 Backend token obtained:', token.substring(0, 20) + '...');
        console.log('🤖 User UID:', user.uid);
        console.log('🤖 Fetching AI timer status for challenge:', challengeId);
        const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/ai-timer-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🤖 AI Timer status response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🤖 AI Timer data:', data);
          console.log('🤖 hasTimer:', data.data.hasTimer);
          console.log('🤖 timeRemaining:', data.data.timeRemaining);
          console.log('🤖 timeRemaining minutes:', Math.floor(data.data.timeRemaining / 60000));
          console.log('🤖 timerExpired:', data.data.timerExpired);
          
          setHasTimer(data.data.hasTimer);
          setTimeRemaining(data.data.timeRemaining);
          setIsExpired(data.data.timerExpired);
          
          // Store timer data in localStorage for persistence
          if (data.data.hasTimer && data.data.timeRemaining > 0) {
            const endTime = Date.now() + data.data.timeRemaining;
            localStorage.setItem(`ai_timer_${challengeId}`, JSON.stringify({
              endTime: endTime,
              startTime: Date.now()
            }));
          }
          
          if (data.data.timerExpired && onTimerExpired) {
            onTimerExpired();
          }
        } else if (response.status === 403) {
          console.error('🤖 Authentication failed - token may be expired');
          // Try to get timer from localStorage as fallback
          const storedTimer = localStorage.getItem(`ai_timer_${challengeId}`);
          if (storedTimer) {
            const timerData = JSON.parse(storedTimer);
            const now = Date.now();
            const remaining = Math.max(0, timerData.endTime - now);
            if (remaining > 0) {
              setHasTimer(true);
              setTimeRemaining(remaining);
              setIsExpired(false);
              console.log('🤖 Using stored AI timer data:', remaining);
            }
          }
        } else {
          console.error('🤖 AI Timer status fetch failed:', response.status);
          const errorText = await response.text();
          console.error('🤖 Error response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching AI timer status:', error);
        // Try to get timer from localStorage as fallback
        const storedTimer = localStorage.getItem(`ai_timer_${challengeId}`);
        if (storedTimer) {
          const timerData = JSON.parse(storedTimer);
          const now = Date.now();
          const remaining = Math.max(0, timerData.endTime - now);
          if (remaining > 0) {
            setHasTimer(true);
            setTimeRemaining(remaining);
            setIsExpired(false);
            console.log('🤖 Using stored AI timer data (fallback):', remaining);
          }
        }
      }
    };

    fetchTimerStatus();
    
    // Start timer if we have time remaining
    if (timeRemaining > 0) {
      console.log('🤖 Starting AI timer countdown with timeRemaining:', timeRemaining);
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1000;
          console.log('🤖 AI Timer tick - prev:', prev, 'newTime:', newTime);
          if (newTime <= 0) {
            console.log('🤖 AI Timer expired!');
            setIsExpired(true);
            // Clear stored timer when expired
            localStorage.removeItem(`ai_timer_${challengeId}`);
            if (onTimerExpired) {
              onTimerExpired();
            }
            return 0;
          }
          // Update stored timer with remaining time
          const endTime = Date.now() + newTime;
          localStorage.setItem(`ai_timer_${challengeId}`, JSON.stringify({
            endTime: endTime,
            startTime: Date.now() - (timeRemaining - newTime)
          }));
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [challengeId, timeRemaining, onTimerExpired, user]);

  // Only show timer if backend has timer data
  if (!hasTimer) {
    console.log('🤖 No AI timer data available for challenge:', challengeId);
    return null;
  }

  if (isExpired) {
    return (
      <div className="flex items-center justify-center space-x-2 text-red-600">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">AI Verification Timer Expired</span>
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
            <div className="text-xs text-gray-500">AI Timer</div>
          </div>
        </div>
      </div>
    </div>
  );
}

