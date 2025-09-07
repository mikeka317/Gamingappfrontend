import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Target, Users, Gamepad2, DollarSign } from 'lucide-react';
import { Challenge } from '@/services/challengeService';
import { useAuth } from '@/contexts/AuthContext';

interface ChallengeAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  onAccept: (challengeId: string, myTeam?: string, accepterPlatformUsernames?: { [platform: string]: string }) => void;
  onDecline: (challengeId: string) => void;
}

export function ChallengeAcceptanceModal({ 
  isOpen, 
  onClose, 
  challenge, 
  onAccept, 
  onDecline 
}: ChallengeAcceptanceModalProps) {
  const { user } = useAuth();
  const [myTeam, setMyTeam] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auto-populate platform usernames from user profile
  const [autoPlatformUsernames, setAutoPlatformUsernames] = useState<{ [platform: string]: string }>({});
  
  // Auto-populate platform usernames when modal opens or user changes
  useEffect(() => {
    if (user?.platforms && challenge?.platform) {
      const usernames = {};
      
      // Normalize platform names to handle potential mismatches
      const normalizedChallengePlatform = challenge.platform.toLowerCase().trim();
      
      user.platforms.forEach(platformData => {
        if (platformData.onlineUserId && platformData.onlineUserId.trim()) {
          const normalizedPlatform = platformData.platform.toLowerCase().trim();
          usernames[normalizedPlatform] = platformData.onlineUserId.trim();
          
          // Also store with original platform name for exact matching
          usernames[platformData.platform] = platformData.onlineUserId.trim();
        }
      });
      
      setAutoPlatformUsernames(usernames);
      
      console.log('🔍 Auto-populated platform usernames:', {
        userPlatforms: user.platforms,
        challengePlatform: challenge.platform,
        normalizedChallengePlatform,
        autoUsernames: usernames,
        hasMatchingPlatform: usernames[challenge.platform],
        hasNormalizedMatching: usernames[normalizedChallengePlatform],
        allPlatformKeys: Object.keys(usernames)
      });
    }
  }, [user, challenge]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('📱 ChallengeAcceptanceModal state changed:', {
      myTeam,
      autoPlatformUsernames,
      hasPlatformUsernames: Object.keys(autoPlatformUsernames).length > 0,
      challengePlatform: challenge?.platform,
      hasMatchingPlatform: challenge?.platform ? autoPlatformUsernames[challenge.platform] : false
    });
  }, [myTeam, autoPlatformUsernames, challenge?.platform]);

  if (!isOpen || !challenge) return null;

  const isTeamBasedGame = ['valorant', 'cs2', 'lol', 'dota2','FIFA 24','FC 25','NBA 2k25','Street Fighter 6','overwatch'].includes(challenge.game);

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      // Use auto-populated platform usernames from profile
      const platformUsernamesToSend = Object.keys(autoPlatformUsernames).length > 0 ? autoPlatformUsernames : undefined;
      
      // Validate that we have the required platform username for the challenge
      const hasRequiredPlatform = challenge.platform && autoPlatformUsernames[challenge.platform];
      const hasNormalizedPlatform = challenge.platform && autoPlatformUsernames[challenge.platform.toLowerCase().trim()];
      
      console.log('📱 Sending auto-populated platform usernames:', {
        autoUsernames: autoPlatformUsernames,
        hasValues: Object.keys(autoPlatformUsernames).length > 0,
        toSend: platformUsernamesToSend,
        challengePlatform: challenge.platform,
        hasMatchingPlatform: hasRequiredPlatform,
        hasNormalizedMatching: hasNormalizedPlatform,
        requiredPlatformUsername: hasRequiredPlatform || hasNormalizedPlatform,
        allAvailablePlatforms: Object.keys(autoPlatformUsernames)
      });
      
      // Ensure we have the platform username for the challenge platform
      if (!hasRequiredPlatform && !hasNormalizedPlatform) {
        console.warn('⚠️ No platform username found for challenge platform:', challenge.platform);
        console.warn('Available platforms:', Object.keys(autoPlatformUsernames));
      }
      
      await onAccept(challenge.id, myTeam.trim() || undefined, platformUsernamesToSend);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    try {
      await onDecline(challenge.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-md bg-card/95 backdrop-blur-xl border-border/50 shadow-glass"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="font-orbitron text-lg">Challenge Details</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Review and respond to the challenge
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-secondary/80"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Challenge Summary */}
          <div className="p-4 bg-gradient-glow border border-border/30 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Game:</span>
              <span className="font-medium capitalize">{challenge.game}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Stake:</span>
              <span className="font-medium text-success">${challenge.stake}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Challenger:</span>
              <span className="font-medium">{challenge.challenger.username}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Deadline:</span>
              <span className="font-medium">{formatDate(challenge.deadline)}</span>
            </div>
            
            {challenge.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="mt-1 text-sm font-medium">{challenge.description}</p>
              </div>
            )}

            {/* Team Information */}
            {challenge.myTeam && (
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Team Information:</span>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Challenger's Team:</span>
                  <span className="font-medium">{challenge.myTeam}</span>
                </div>
              </div>
            )}
          </div>

          {/* Team Selection - Only show for team-based games */}
          {isTeamBasedGame && (
            <div className="space-y-2">
              <Label htmlFor="myTeam" className="text-sm font-medium">
                Your Team (Optional)
              </Label>
              <Input
                id="myTeam"
                type="text"
                placeholder="e.g., Team Liquid, Fnatic, or your team name"
                value={myTeam}
                onChange={(e) => setMyTeam(e.target.value)}
                className="bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Specify which team you'll be playing for (helps with AI verification)
              </p>
            </div>
          )}

          {/* Platform Usernames - Auto-fetched from Profile */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Your Platform Usernames (Auto-fetched from Profile)
              </Label>
              
            </div>
            <div className="p-4 bg-secondary/20 rounded-lg border border-border/30 space-y-3">
              
              
              {/* Display platform usernames from profile */}
              <div className="space-y-3">
                {/* Main platform username */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    {challenge.platform === 'pc' ? 'PC' : 
                     challenge.platform === 'playstation' || challenge.platform === 'ps' ? 'PlayStation' : 
                     challenge.platform === 'xbox' ? 'Xbox' : 
                     challenge.platform === 'nintendo' ? 'Nintendo Switch' : 
                     challenge.platform === 'mobile' ? 'Mobile' : 
                     challenge.platform} Username
                  </Label>
                  <div className="flex items-center gap-2 p-2 bg-input/30 rounded border border-border/30">
                    <Gamepad2 className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {autoPlatformUsernames[challenge.platform] || 'Not set in profile'}
                    </span>
                    {!autoPlatformUsernames[challenge.platform] && (
                      <span className="text-xs text-muted-foreground">
                        (Set this in your profile)
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Other connected platforms */}
                {user?.platforms && user.platforms.length > 0 && (
                  <>
                    {user.platforms
                      .filter(p => p.platform !== challenge.platform)
                      .map((platformData) => (
                        <div key={platformData.platform} className="space-y-2">
                          <Label className="text-xs font-medium">
                            {platformData.platform === 'pc' ? 'PC' : 
                             platformData.platform === 'playstation' || platformData.platform === 'ps' ? 'PlayStation' : 
                             platformData.platform === 'xbox' ? 'Xbox' : 
                             platformData.platform === 'nintendo' ? 'Nintendo Switch' : 
                             platformData.platform === 'mobile' ? 'Mobile' : 
                             platformData.platform} Username (Optional)
                          </Label>
                          <div className="flex items-center gap-2 p-2 bg-input/30 rounded border border-border/30">
                            <Gamepad2 className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">
                              {platformData.onlineUserId || 'Not set in profile'}
                            </span>
                          </div>
                        </div>
                      ))}
                  </>
                )}
                
                {/* Show message if no platforms connected */}
                
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAccept}
              disabled={isSubmitting}
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
            >
              {isSubmitting ? 'Accepting...' : 'Accept Challenge'}
            </Button>
            
            <Button
              onClick={handleDecline}
              disabled={isSubmitting}
              variant="outline"
              className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              {isSubmitting ? 'Declining...' : 'Decline'}
            </Button>
          </div>

          {/* Summary of what will be sent */}
          

          {/* Info Note */}
          <div className="text-xs text-muted-foreground text-center p-3 bg-secondary/20 rounded-lg">
            <p>By accepting, you agree to the challenge terms and stake amount.</p>
            {isTeamBasedGame && (
              <p className="mt-1">Team information helps AI verify your results more accurately.</p>
            )}
            <p className="mt-1">Your platform usernames from your profile will be automatically included.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
