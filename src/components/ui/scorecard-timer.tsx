import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { API_BASE_URL } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface ScorecardTimerProps {
  challengeId: string;
  onTimerExpired?: () => void;
}

// Test timer component that runs in real time
function TestTimer() {
  const [testTimeRemaining, setTestTimeRemaining] = useState(5 * 60 * 1000); // 5 minutes
  const [isTestExpired, setIsTestExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTestTimeRemaining(prev => {
        if (prev <= 1000) {
          setIsTestExpired(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return ((totalTime - testTimeRemaining) / totalTime) * 100;
  };

  const getTimerColor = () => {
    if (isTestExpired) return 'text-red-500';
    if (testTimeRemaining < 60000) return 'text-red-500'; // Less than 1 minute
    if (testTimeRemaining < 120000) return 'text-yellow-500'; // Less than 2 minutes
    return 'text-green-500';
  };

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
            className={isTestExpired ? 'text-red-500' : 'text-purple-500'}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${getProgressPercentage()}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isTestExpired ? (
            <div className="text-red-500 text-xs font-bold">EXP</div>
          ) : (
            <div className={`text-xs font-bold font-mono ${getTimerColor()}`}>
              {formatTime(testTimeRemaining)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ScorecardTimer({ challengeId, onTimerExpired }: ScorecardTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasTimer, setHasTimer] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTimerStatus = async () => {
      try {
        // Check if user is authenticated
        if (!user) {
          console.log('🕐 No authenticated user found');
          return;
        }

        // Get backend JWT token from localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('🕐 No backend auth token found');
          return;
        }

        console.log('🕐 Backend token obtained:', token.substring(0, 20) + '...');
        console.log('🕐 User UID:', user.uid);
        console.log('🕐 Fetching timer status for challenge:', challengeId);
        const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/timer-status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('🕐 Timer status response:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🕐 Timer data:', data);
          console.log('🕐 hasTimer:', data.data.hasTimer);
          console.log('🕐 timeRemaining:', data.data.timeRemaining);
          console.log('🕐 timeRemaining minutes:', Math.floor(data.data.timeRemaining / 60000));
          console.log('🕐 timerExpired:', data.data.timerExpired);
          
          setHasTimer(data.data.hasTimer);
          setTimeRemaining(data.data.timeRemaining);
          setIsExpired(data.data.timerExpired);
          
          // Store timer data in localStorage for persistence
          if (data.data.hasTimer && data.data.timeRemaining > 0) {
            const endTime = Date.now() + data.data.timeRemaining;
            localStorage.setItem(`timer_${challengeId}`, JSON.stringify({
              endTime: endTime,
              startTime: Date.now()
            }));
          }
          
          if (data.data.timerExpired && onTimerExpired) {
            onTimerExpired();
          }
        } else if (response.status === 403) {
          console.error('🕐 Authentication failed - token may be expired');
          // Try to get timer from localStorage as fallback
          const storedTimer = localStorage.getItem(`timer_${challengeId}`);
          if (storedTimer) {
            const timerData = JSON.parse(storedTimer);
            const now = Date.now();
            const remaining = Math.max(0, timerData.endTime - now);
            if (remaining > 0) {
              setHasTimer(true);
              setTimeRemaining(remaining);
              setIsExpired(false);
              console.log('🕐 Using stored timer data:', remaining);
            }
          }
        } else {
          console.error('🕐 Timer status fetch failed:', response.status);
          const errorText = await response.text();
          console.error('🕐 Error response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching timer status:', error);
        // Try to get timer from localStorage as fallback
        const storedTimer = localStorage.getItem(`timer_${challengeId}`);
        if (storedTimer) {
          const timerData = JSON.parse(storedTimer);
          const now = Date.now();
          const remaining = Math.max(0, timerData.endTime - now);
          if (remaining > 0) {
            setHasTimer(true);
            setTimeRemaining(remaining);
            setIsExpired(false);
            console.log('🕐 Using stored timer data (fallback):', remaining);
          }
        }
      }
    };

    fetchTimerStatus();
    
    // Start timer if we have time remaining
    if (timeRemaining > 0) {
      console.log('🕐 Starting timer countdown with timeRemaining:', timeRemaining);
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1000;
          console.log('🕐 Timer tick - prev:', prev, 'newTime:', newTime);
          if (newTime <= 0) {
            console.log('🕐 Timer expired!');
            setIsExpired(true);
            // Clear stored timer when expired
            localStorage.removeItem(`timer_${challengeId}`);
            if (onTimerExpired) {
              onTimerExpired();
            }
            return 0;
          }
          // Update stored timer with remaining time
          const endTime = Date.now() + newTime;
          localStorage.setItem(`timer_${challengeId}`, JSON.stringify({
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
    console.log('🕐 No timer data available for challenge:', challengeId);
    return null;
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  const getTimerColor = () => {
    if (isExpired) return 'text-red-500';
    if (timeRemaining < 60000) return 'text-red-500'; // Less than 1 minute
    if (timeRemaining < 120000) return 'text-yellow-500'; // Less than 2 minutes
    return 'text-green-500';
  };

  return (
    <div className="flex items-center justify-center">
      <div className="relative w-16 h-16">
        {/* Circular progress background */}
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
            className={isExpired ? 'text-red-500' : 'text-purple-500'}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${getProgressPercentage()}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        
        {/* Timer text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isExpired ? (
            <div className="text-red-500 text-xs font-bold">EXP</div>
          ) : (
            <div className={`text-xs font-bold font-mono ${getTimerColor()}`}>
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}