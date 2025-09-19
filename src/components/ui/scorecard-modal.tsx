import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  X,
  Image as ImageIcon,
  Flag,
  Timer
} from 'lucide-react';
import { Challenge, challengeService } from '@/services/challengeService';
import { useAuth } from '@/contexts/AuthContext';

interface ScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  onScorecardSubmitted: (result: any) => void;
}

interface ScorecardData {
  playerAScore: string;
  playerBScore: string;
  playerAPlatformUsername: string;
  playerBPlatformUsername: string;
}

interface ConflictData {
  hasConflict: boolean;
  playerAScorecard?: ScorecardData;
  playerBScorecard?: ScorecardData;
  requiresProof: boolean;
}

export function ScorecardModal({ isOpen, onClose, challenge, onScorecardSubmitted }: ScorecardModalProps) {
  const { user } = useAuth();
  const [scorecardData, setScorecardData] = useState<ScorecardData>({
    playerAScore: '',
    playerBScore: '',
    playerAPlatformUsername: '',
    playerBPlatformUsername: ''
  });
  
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictData, setConflictData] = useState<ConflictData | null>(null);
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [proofDescription, setProofDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize platform usernames when modal opens
  useEffect(() => {
    if (isOpen && challenge) {
      const currentUsername = user?.username || '';
      const challengePlatform = challenge.platform?.toLowerCase() || '';
      
      let playerAPlatformUsername = '';
      let playerBPlatformUsername = '';
      
      // Determine which player is A and which is B
      const isChallenger = challenge.challenger?.username === currentUsername;
      
      if (isChallenger) {
        // Current user is challenger (Player A)
        playerAPlatformUsername = challenge.challengerPlatformUsernames?.[challengePlatform] || currentUsername;
        playerBPlatformUsername = challenge.opponents?.[0]?.accepterPlatformUsernames?.[challengePlatform] || 
                                 challenge.opponents?.[0]?.username || 'Opponent';
      } else {
        // Current user is opponent (Player B)
        playerBPlatformUsername = challenge.opponents?.find(opp => opp.username === currentUsername)?.accepterPlatformUsernames?.[challengePlatform] || 
                                 currentUsername;
        playerAPlatformUsername = challenge.challengerPlatformUsernames?.[challengePlatform] || 
                                 challenge.challenger?.username || 'Challenger';
      }
      
      console.log('🎯 Setting platform usernames:');
      console.log('  - playerAPlatformUsername:', playerAPlatformUsername);
      console.log('  - playerBPlatformUsername:', playerBPlatformUsername);
      console.log('  - challengePlatform:', challengePlatform);
      console.log('  - isChallenger:', isChallenger);
      console.log('  - challengerPlatformUsernames:', challenge.challengerPlatformUsernames);
      console.log('  - opponentPlatformUsernames:', challenge.opponents?.[0]?.accepterPlatformUsernames);

      setScorecardData({
        playerAScore: '',
        playerBScore: '',
        playerAPlatformUsername,
        playerBPlatformUsername
      });
      
      // Check if there's already a scorecard submitted or if there's a conflict
      checkExistingScorecard();
      
      // If challenge is in scorecard-pending state, start the timer
      if (challenge.status === 'scorecard-pending' && challenge.scorecardTimerStarted) {
        const timerStart = new Date(challenge.scorecardTimerStarted);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timerStart.getTime()) / 1000);
        const remaining = Math.max(0, 300 - elapsed); // 5 minutes = 300 seconds
        
        if (remaining > 0) {
          setTimeRemaining(remaining);
        } else {
          // Timer has expired, trigger auto-forfeit
          handleAutoForfeit();
        }
      }
    }
  }, [isOpen, challenge, user]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => prev ? prev - 1 : 0);
      }, 1000);
    } else if (timeRemaining === 0) {
      // Time's up - auto forfeit
      handleAutoForfeit();
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining]);

  const checkExistingScorecard = async () => {
    try {
      console.log('🔍 Checking scorecard status for challenge:', challenge.id);
      const data = await challengeService.getScorecardStatus(challenge.id);
      console.log('🔍 Scorecard status data:', data);
      
      if (data.hasExistingScorecard) {
        // Current user has already submitted a scorecard
        console.log('⚠️ User has already submitted scorecard');
        alert('You have already submitted a scorecard for this challenge.');
        onClose();
        return;
      }
      if (data.hasConflict) {
        console.log('⚠️ Conflict detected, showing proof upload');
        setConflictData(data);
        setShowProofUpload(true);
      }
    } catch (error) {
      console.error('Error checking existing scorecard:', error);
    }
  };

  // Check if challenge is in conflict state when modal opens
  useEffect(() => {
    if (isOpen && challenge && challenge.status === 'scorecard-conflict') {
      setShowProofUpload(true);
      // Load existing scorecard data for conflict display
      checkExistingScorecard();
    }
  }, [isOpen, challenge]);

  const handleScorecardSubmit = async () => {
    if (!scorecardData.playerAScore || !scorecardData.playerBScore) {
      alert('Please enter both scores');
      return;
    }

    console.log('🎯 Submitting scorecard with data:');
    console.log('  - playerAScore:', scorecardData.playerAScore, 'type:', typeof scorecardData.playerAScore);
    console.log('  - playerBScore:', scorecardData.playerBScore, 'type:', typeof scorecardData.playerBScore);
    console.log('  - playerAPlatformUsername:', scorecardData.playerAPlatformUsername, 'type:', typeof scorecardData.playerAPlatformUsername);
    console.log('  - playerBPlatformUsername:', scorecardData.playerBPlatformUsername, 'type:', typeof scorecardData.playerBPlatformUsername);

    try {
      setIsSubmitting(true);
      
      const result = await challengeService.submitScorecard(challenge.id, {
        playerAScore: parseInt(scorecardData.playerAScore),
        playerBScore: parseInt(scorecardData.playerBScore),
        playerAPlatformUsername: scorecardData.playerAPlatformUsername,
        playerBPlatformUsername: scorecardData.playerBPlatformUsername
      });
      
      if (result.hasConflict) {
        // There's a conflict - show proof upload
        setConflictData(result);
        setShowProofUpload(true);
        // Start 5-minute timer for the other player
        setTimeRemaining(300); // 5 minutes in seconds
      } else {
        // No conflict - challenge completed
        onScorecardSubmitted(result);
        onClose();
      }
      
    } catch (error: any) {
      console.error('Error submitting scorecard:', error);
      alert(`Failed to submit scorecard: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProofUpload = async () => {
    if (!proofImages.length || !proofDescription.trim()) {
      alert('Please upload proof images and provide a description');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const result = await challengeService.submitProofForConflict(challenge.id, {
        description: proofDescription,
        proofImages: proofImages
      });
      
      onScorecardSubmitted(result);
      onClose();
      
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      alert(`Failed to submit proof: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoForfeit = async () => {
    try {
      const result = await challengeService.processAutoForfeit(challenge.id);
      alert('The other player did not submit their scorecard in time and has been automatically forfeited.');
      onScorecardSubmitted({ winner: user?.username, autoForfeit: true });
      onClose();
    } catch (error) {
      console.error('Error processing auto-forfeit:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setProofImages(prev => [...prev, ...imageFiles]);
    }
  };

  const removeImage = (index: number) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const resetModal = () => {
    setScorecardData({
      playerAScore: '',
      playerBScore: '',
      playerAPlatformUsername: '',
      playerBPlatformUsername: ''
    });
    setTimeRemaining(null);
    setConflictData(null);
    setShowProofUpload(false);
    setProofImages([]);
    setProofDescription('');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!challenge || !challenge.id) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl">
            {!showProofUpload ? (
              `🏆 Submit Scorecard - ${challenge.game}`
            ) : (
              `🤖 AI Verification - ${challenge.game}`
            )}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {!showProofUpload ? (
              'Enter the final scores for both players. The first player to submit starts a 5-minute timer for the other player.'
            ) : (
              'There is a conflict between the scorecards. Please upload proof images for AI verification to determine the winner.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Summary */}
          <Card className="bg-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-orbitron">Challenge Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Stake per User:</span>
                  <span className="ml-2 font-semibold text-success">
                    ${challenge?.stake ? challenge.stake.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Pot:</span>
                  <span className="ml-2 font-semibold text-primary">
                    ${challenge?.stake ? (challenge.stake * 2).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="ml-2 font-semibold">{challenge?.platform || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Game:</span>
                  <span className="ml-2 font-semibold">{challenge?.game || 'Unknown'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timer Display */}
          {timeRemaining !== null && timeRemaining > 0 && (
            <Card className="bg-warning/10 border-warning/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-center space-x-2">
                  <Timer className="h-5 w-5 text-warning" />
                  <span className="text-lg font-semibold text-warning">
                    Time Remaining: {formatTime(timeRemaining)}
                  </span>
                </div>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  The other player has {formatTime(timeRemaining)} to submit their scorecard or they will be automatically forfeited.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Scorecard Entry Section */}
          {!showProofUpload && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-orbitron">Enter Final Scores</CardTitle>
                  <CardDescription>
                    Enter the final scores for both players. Make sure the scores are accurate as they will be compared with the other player's submission.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Player A Score */}
                  <div className="space-y-2">
                    <Label htmlFor="playerA-score" className="text-sm font-medium">
                      {scorecardData.playerAPlatformUsername} Score
                    </Label>
                    <Input
                      id="playerA-score"
                      type="number"
                      placeholder="Enter score"
                      value={scorecardData.playerAScore}
                      onChange={(e) => setScorecardData(prev => ({ ...prev, playerAScore: e.target.value }))}
                      className="bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300"
                    />
                  </div>

                  {/* Player B Score */}
                  <div className="space-y-2">
                    <Label htmlFor="playerB-score" className="text-sm font-medium">
                      {scorecardData.playerBPlatformUsername} Score
                    </Label>
                    <Input
                      id="playerB-score"
                      type="number"
                      placeholder="Enter score"
                      value={scorecardData.playerBScore}
                      onChange={(e) => setScorecardData(prev => ({ ...prev, playerBScore: e.target.value }))}
                      className="bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300"
                    />
                  </div>

                  {/* Winner Display */}
                  {scorecardData.playerAScore && scorecardData.playerBScore && (
                    <div className="bg-secondary/20 p-4 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">Winner:</div>
                        <div className="text-lg font-semibold text-primary">
                          {parseInt(scorecardData.playerAScore) > parseInt(scorecardData.playerBScore) 
                            ? scorecardData.playerAPlatformUsername 
                            : scorecardData.playerBPlatformUsername}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {scorecardData.playerAPlatformUsername}: {scorecardData.playerAScore} - 
                          {scorecardData.playerBPlatformUsername}: {scorecardData.playerBScore}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleScorecardSubmit}
                    disabled={isSubmitting || !scorecardData.playerAScore || !scorecardData.playerBScore}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Trophy className="h-4 w-4 mr-2" />
                        Proceed to Claim
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Proof Upload Section */}
          {showProofUpload && (
            <div className="space-y-6">
              <Card className="bg-warning/10 border-warning/30">
                <CardHeader>
                  <CardTitle className="text-lg font-orbitron text-warning flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Scorecard Conflict Detected
                  </CardTitle>
                  <CardDescription>
                    The scores submitted by both players don't match. Please upload proof images to resolve this dispute.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Show conflicting scorecards */}
                  {conflictData && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background p-3 rounded-lg border">
                        <div className="text-sm font-medium mb-2">Your Scorecard</div>
                        <div className="text-xs text-muted-foreground">
                          {conflictData.playerAScorecard?.playerAPlatformUsername}: {conflictData.playerAScorecard?.playerAScore} - 
                          {conflictData.playerAScorecard?.playerBPlatformUsername}: {conflictData.playerAScorecard?.playerBScore}
                        </div>
                      </div>
                      <div className="bg-background p-3 rounded-lg border">
                        <div className="text-sm font-medium mb-2">Opponent's Scorecard</div>
                        <div className="text-xs text-muted-foreground">
                          {conflictData.playerBScorecard?.playerAPlatformUsername}: {conflictData.playerBScorecard?.playerAScore} - 
                          {conflictData.playerBScorecard?.playerBPlatformUsername}: {conflictData.playerBScorecard?.playerBScore}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show scorecards from challenge data if conflictData is not available */}
                  {!conflictData && challenge.scorecards && challenge.scorecards.length >= 2 && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-background p-3 rounded-lg border">
                        <div className="text-sm font-medium mb-2">Scorecard 1</div>
                        <div className="text-xs text-muted-foreground">
                          {challenge.scorecards[0].playerAPlatformUsername}: {challenge.scorecards[0].playerAScore} - 
                          {challenge.scorecards[0].playerBPlatformUsername}: {challenge.scorecards[0].playerBScore}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Submitted by: {challenge.scorecards[0].submittedBy}
                        </div>
                      </div>
                      <div className="bg-background p-3 rounded-lg border">
                        <div className="text-sm font-medium mb-2">Scorecard 2</div>
                        <div className="text-xs text-muted-foreground">
                          {challenge.scorecards[1].playerAPlatformUsername}: {challenge.scorecards[1].playerAScore} - 
                          {challenge.scorecards[1].playerBPlatformUsername}: {challenge.scorecards[1].playerBScore}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Submitted by: {challenge.scorecards[1].submittedBy}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Proof Image Upload */}
                  <div>
                    <Label htmlFor="proof-images" className="text-sm font-medium">
                      Upload Proof Images *
                    </Label>
                    <div className="mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        {proofImages.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Proof ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-2 right-2 h-6 w-6 p-0"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-4 w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {proofImages.length === 0 ? 'Upload Images' : 'Add More Images'}
                      </Button>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="proof-description" className="text-sm font-medium">
                      Proof Description
                    </Label>
                    <textarea
                      id="proof-description"
                      placeholder="Describe the proof and how it shows the correct scores..."
                      value={proofDescription}
                      onChange={(e) => setProofDescription(e.target.value)}
                      className="mt-2 w-full p-3 border border-border rounded-md bg-background text-foreground resize-none"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleProofUpload}
                    disabled={isSubmitting || proofImages.length === 0 || !proofDescription.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-orbitron font-bold"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying with AI...
                      </>
                    ) : (
                      <>
                        <Trophy className="h-4 w-4 mr-2" />
                        Verify using AI
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
