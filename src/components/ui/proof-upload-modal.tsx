import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Trophy, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Flag
} from 'lucide-react';
import { Challenge } from '@/services/challengeService';
import { walletService } from '@/services/walletService';
import { useAuth } from '@/contexts/AuthContext';
import { aiVerificationService } from '@/services/aiVerificationService';
import { API_BASE_URL } from '@/services/api';

interface ProofUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge;
  onProofSubmitted: (result: any) => void;
}

interface AIAnalysisResult {
  winner: string;
  confidence: number;
  reasoning: string;
  analysis: string;
  currentUserWon?: boolean;
  aiResult?: any; // Store the full AI result
}

export function ProofUploadModal({ isOpen, onClose, challenge, onProofSubmitted }: ProofUploadModalProps) {
  const { user } = useAuth();
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [proofDescription, setProofDescription] = useState('');
  const [myTeam, setMyTeam] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [showDispute, setShowDispute] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasActiveDispute, setHasActiveDispute] = useState(false);

  // Debug logging when modal opens
  useEffect(() => {
    if (isOpen && challenge) {
      console.log('🔍 ProofUploadModal: Challenge object:', challenge);
      console.log('🔍 ProofUploadModal: Challenge structure:', {
        id: challenge.id,
        stake: challenge.stake,
        platform: challenge.platform,
        challenger: challenge.challenger,
        status: challenge.status,
        hasStake: !!challenge.stake,
        stakeType: typeof challenge.stake,
        fullChallenge: JSON.stringify(challenge, null, 2)
      });
      // Check if a dispute already exists for this challenge and disable the action accordingly
      try {
        setHasActiveDispute(Boolean((challenge as any)?.disputed));
        walletService.hasActiveDispute(challenge.id)
          .then((exists) => setHasActiveDispute(Boolean(exists)))
          .catch(() => {});
      } catch {}
    } else if (isOpen && !challenge) {
      console.error('❌ ProofUploadModal: Modal opened but no challenge provided');
    }
  }, [isOpen, challenge]);

  // Safety check - don't render if challenge is invalid
  if (!challenge || !challenge.id) {
    console.error('❌ ProofUploadModal: Invalid challenge object:', challenge);
    return null;
  }

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

  const markChallengeAsCompleted = async (challengeId: string, aiResult: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          aiResult: aiResult,
          completedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to mark challenge as completed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Challenge completion result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error marking challenge as completed:', error);
      throw error;
    }
  };

  const handleAIVerification = async () => {
    if (!proofImages.length || !proofDescription.trim()) {
      alert('Please upload proof images and provide a description first');
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Use the first image for AI verification
      const screenshot = proofImages[0];
      
      // Get the current user's platform username for this challenge
      const currentUsername = user?.username || '';
      const challengePlatform = challenge.platform?.toLowerCase() || '';
      
      // Find the user's platform username for this challenge
      let platformUsername = '';
      if (challenge.challenger?.username === currentUsername) {
        // User is the challenger - use challengerPlatformUsernames
        platformUsername = challenge.challengerPlatformUsernames?.[challengePlatform] || currentUsername;
      } else {
        // User is an opponent - find their platform username in opponents
        const opponent = challenge.opponents?.find(opp => opp.username === currentUsername);
        platformUsername = opponent?.accepterPlatformUsernames?.[challengePlatform] || currentUsername;
      }
      
      console.log('🔍 AI Verification - User info:', {
        currentUsername: currentUsername,
        platformUsername: platformUsername,
        challengePlatform: challengePlatform,
        challengerPlatformUsernames: challenge.challengerPlatformUsernames,
        opponents: challenge.opponents
      });
      
      // Perform AI verification using the dedicated endpoint
      const aiResult = await aiVerificationService.verifyChallengeProof(
        screenshot,
        {
          challengeId: challenge.id,
          myTeam: platformUsername, // Use platform username for accurate AI comparison
          proofDescription: proofDescription.trim(),
          gameType: challenge.game
        }
      );

      console.log('🤖 AI Verification Result:', aiResult);
      console.log('🤖 AI Result type:', typeof aiResult);
      console.log('🤖 AI Result keys:', aiResult ? Object.keys(aiResult) : 'No result');
      
      // Validate AI result structure
      if (!aiResult) {
        throw new Error('AI verification returned no result');
      }

      if (typeof aiResult !== 'object') {
        throw new Error(`AI verification returned invalid result type: ${typeof aiResult}`);
      }

      // Check if aiResult has the expected structure
      if (!aiResult.winner) {
        console.warn('⚠️ AI result missing winner field:', aiResult);
      }

      if (!aiResult.confidence) {
        console.warn('⚠️ AI result missing confidence field:', aiResult);
      }

      if (!aiResult.reasoning) {
        console.warn('⚠️ AI result missing reasoning field:', aiResult);
      }

      // Determine if the current user won
      const aiWinner = aiResult.winner || 'Unknown';
      
      // Check if current user is the winner using platform username
      const aiWinnerLower = aiWinner.toLowerCase();
      const platformUsernameLower = platformUsername.toLowerCase();
      
      const currentUserWon = aiResult.iWin || 
                             aiWinnerLower.includes(platformUsernameLower) ||
                             platformUsernameLower.includes(aiWinnerLower);
      
      console.log('🔍 Frontend winner determination:', {
        currentUsername: currentUsername,
        platformUsername: platformUsername,
        platformUsernameLower: platformUsernameLower,
        aiWinner: aiWinner,
        aiWinnerLower: aiWinnerLower,
        aiResultIWin: aiResult.iWin,
        includesCheck1: aiWinnerLower.includes(platformUsernameLower),
        includesCheck2: platformUsernameLower.includes(aiWinnerLower),
        currentUserWon: currentUserWon
      });

      // Update the analysis result with AI data
      const analysisData = {
        winner: aiWinner,
        confidence: aiResult.confidence || 0,
        reasoning: aiResult.reasoning || 'No reasoning provided',
        analysis: aiResult.reasoning || 'No analysis provided',
        aiResult: { ...aiResult, myTeam: platformUsername }, // Store full AI result with platform username
        currentUserWon: currentUserWon // Add this flag
      };
      
      console.log('📊 Setting analysis result:', analysisData);
      console.log('🎮 Game type info:', {
        expected: (aiResult as any).expectedGameType,
        detected: (aiResult as any).detectedGameType,
        mismatch: (aiResult as any).gameTypeMismatch
      });
      console.log('📊 Score validation:', (aiResult as any).scoreValidation);
      setAnalysisResult(analysisData);

      // Mark challenge as completed in the backend
      try {
        // Persist proof image URL to challenge if backend returned it
        const resultWithProof = { ...aiResult } as any;
        await markChallengeAsCompleted(challenge.id, resultWithProof);
        console.log('✅ Challenge marked as completed');
      } catch (error) {
        console.error('❌ Failed to mark challenge as completed:', error);
        // Don't throw error here - user can still see the result
      }

    } catch (error: any) {
      console.error('❌ AI Verification failed:', error);
      alert(`AI verification failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDispute = async () => {
    if (hasActiveDispute || (challenge as any)?.disputed) {
      alert('You already have an active dispute for this challenge. Please wait for admin review.');
      setShowDispute(false);
      return;
    }
    if (!disputeReason.trim()) {
      alert('Please provide a reason for the dispute');
      return;
    }

    try {
      setIsDisputing(true);
      
      // Determine opponent information
      const isChallenger = challenge.challenger?.uid === user?.uid;
      const opponentUsername = isChallenger 
        ? challenge.opponents?.[0]?.username 
        : challenge.challenger?.username;

      if (!opponentUsername) {
        throw new Error('Unable to determine opponent information');
      }

      // Create dispute
      await walletService.createDispute(
        challenge.id,
        opponentUsername, // Use username instead of uid
        opponentUsername,
        disputeReason,
        proofImages.map(img => img.name) // Use image names as evidence
      );

      alert('Dispute submitted successfully. An admin will review it.');
      setHasActiveDispute(true);
      setShowDispute(false);
      setDisputeReason('');
      onClose();
    } catch (error) {
      console.error('Error creating dispute:', error);
      alert('Failed to submit dispute. Please try again.');
    } finally {
      setIsDisputing(false);
    }
  };







  const resetModal = () => {
    setProofImages([]);
    setProofDescription('');
    setAnalysisResult(null);
    setShowDispute(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl">
            {!analysisResult ? (
              `🏆 Claim Reward - ${challenge.game}`
            ) : analysisResult?.currentUserWon ? (
              `🎉 Victory! - ${challenge.game}`
            ) : (
              `😔 Result - ${challenge.game}`
            )}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {!analysisResult ? (
              'Upload proof of your victory to claim the reward. Our AI will analyze the evidence immediately and determine the winner.'
            ) : analysisResult?.currentUserWon ? (
              'Congratulations! The AI has determined you are the winner of this challenge.'
            ) : (
              'The AI has analyzed your proof and determined the result. You can dispute if you believe there was an error.'
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
                  <span className="text-muted-foreground">Challenger:</span>
                  <span className="ml-2 font-semibold">{challenge?.challenger?.username || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary" className="ml-2">{challenge?.status || 'Unknown'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proof Upload Section - Always show initially */}
          {!analysisResult && (
            <div className="space-y-4">
              {/* Team Selection - Only show for team-based games */}
              {['valorant', 'cs2', 'lol', 'dota2', 'FC 25', 'NBA 2k25', 'Street Fighter 6','overwatch'].includes(challenge.game) && (
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
                    Optional: Specify which team you're playing for (helps with AI verification)
                  </p>
                </div>
              )}

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
                                  <Textarea
                    id="proof-description"
                    placeholder="Describe how you won the challenge, include any relevant details..."
                    value={proofDescription}
                    onChange={(e) => setProofDescription(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAIVerification}
                  disabled={isAnalyzing || proofImages.length === 0 || !proofDescription.trim()}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Claim Reward
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* AI Processing State */}
          {isAnalyzing && !analysisResult && (
            <div className="text-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-primary">🤖 AI is Analyzing Your Proof</h3>
                <p className="text-muted-foreground">
                  Our AI is carefully examining your evidence to determine the winner...
                </p>
                <div className="text-sm text-muted-foreground">
                  This usually takes a few seconds
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Results - Show when available */}
          {analysisResult && (
            <>
              {/* AI Analysis Results */}
              <Card className={`${analysisResult?.currentUserWon 
                ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' 
                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`text-lg font-orbitron flex items-center gap-2 ${
                    analysisResult?.currentUserWon 
                      ? 'text-green-800' 
                      : 'text-red-800'
                  }`}>
                    {analysisResult?.currentUserWon ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    {analysisResult?.currentUserWon ? '🎉 You Won!' : '😔 You Lost'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className={`text-2xl font-bold mb-1 ${
                        analysisResult?.currentUserWon ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {analysisResult?.winner || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground">Winner</div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {Math.round((analysisResult?.confidence || 0) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">AI Confidence</div>
                    </div>
                  </div>

                  {/* Debug Information */}
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg mb-4">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div><strong>Debug Info:</strong></div>
                      <div>Current User: {user?.username}</div>
                      <div>Platform Username: {analysisResult?.aiResult?.myTeam || 'Not set'}</div>
                      <div>AI Winner: {analysisResult?.winner}</div>
                      <div>Current User Won: {analysisResult?.currentUserWon ? 'Yes' : 'No'}</div>
                      <div>AI iWin Flag: {(analysisResult as any)?.aiResult?.iWin ? 'Yes' : 'No'}</div>
                      {(analysisResult as any)?.aiResult?.contradictionDetected && (
                        <>
                          <div className="text-orange-600 font-medium">⚠️ AI Contradiction Detected!</div>
                          <div>Original Winner: {(analysisResult as any)?.aiResult?.originalWinner}</div>
                          <div>Corrected Winner: {(analysisResult as any)?.aiResult?.correctedWinner}</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Game Type Mismatch Warning */}
                  {(analysisResult as any)?.aiResult?.gameTypeMismatch && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
                      <div className="flex items-center mb-2">
                        <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium text-yellow-800">Game Type Mismatch</span>
                      </div>
                      <div className="text-xs text-yellow-700">
                        <span className="font-medium">Expected:</span> {(analysisResult as any).aiResult.expectedGameType} | 
                        <span className="font-medium"> Detected:</span> {(analysisResult as any).aiResult.detectedGameType}
                      </div>
                      <div className="text-xs text-yellow-700 mt-1">
                        The proof image shows a different game than specified in the challenge.
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className={`text-sm font-medium ${
                      analysisResult?.currentUserWon ? 'text-green-800' : 'text-red-800'
                    }`}>AI Analysis</Label>
                    <p className={`text-sm bg-white p-3 rounded border ${
                      analysisResult?.currentUserWon ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {analysisResult?.reasoning || 'No reasoning provided'}
                    </p>
                  </div>

                  {/* Show different actions based on win/loss */}
                  {analysisResult?.currentUserWon ? (
                    // Winner - show celebration and close button
                    <div className="text-center space-y-3">
                      <div className="text-lg font-semibold text-green-700">
                        🎉 Congratulations! You've earned ${(challenge.stake * 1.9).toFixed(2)}!
                      </div>
                      
                      {/* Reward Breakdown */}
                      <div className="bg-white p-3 rounded-lg border text-sm">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-muted-foreground">Total Pot</div>
                            <div className="font-semibold text-primary">${(challenge.stake * 2).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Admin Fee (5%)</div>
                            <div className="font-semibold text-orange-600">${(challenge.stake * 0.1).toFixed(2)}</div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t text-center">
                          <div className="text-muted-foreground">Your Reward (95%)</div>
                          <div className="font-bold text-green-600 text-lg">${(challenge.stake * 1.9).toFixed(2)}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleClose}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Close
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Loser - show dispute option prominently
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-red-700 mb-2">
                          😔 You didn't win this challenge
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Your stake of ${challenge.stake} remains deducted. You can dispute this result if you believe there was an error.
                        </div>
                      </div>
                      
                      {/* Prominent Dispute Button */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-center space-y-3">
                          <div className="text-sm text-red-700">
                            <strong>Think the AI made a mistake?</strong>
                          </div>
                          <Button
                            onClick={() => setShowDispute(true)}
                            variant="destructive"
                            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            size="lg"
                            disabled={hasActiveDispute}
                          >
                            <Flag className="h-5 w-5 mr-2" />
                            {hasActiveDispute ? 'Dispute Submitted' : 'Apply for Dispute'}
                          </Button>
                          <div className="text-xs text-red-600">
                            {hasActiveDispute ? 'Awaiting admin review' : 'An admin will manually review your case'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          onClick={handleClose}
                          variant="outline"
                          className="flex-1"
                        >
                          Accept Result
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Dispute Modal */}
          {showDispute && !hasActiveDispute && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Apply for Dispute
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please provide a reason for disputing this AI result. Your case will be reviewed by an admin for manual review.
                </p>
                
                <div className="mb-4">
                  <Label htmlFor="disputeReason" className="text-sm font-medium">Dispute Reason</Label>
                  <Textarea
                    id="disputeReason"
                    placeholder="Explain why you're disputing this result..."
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDispute(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDispute}
                    disabled={isDisputing || !disputeReason.trim()}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isDisputing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Dispute'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
