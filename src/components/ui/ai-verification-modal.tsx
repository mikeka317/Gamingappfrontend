import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Label } from './label';
import { Textarea } from './textarea';
import { Badge } from './badge';
import { Trophy, Upload, Loader2, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { aiVerificationService, AIChallengeVerification } from '../../services/aiVerificationService';
import { challengeService } from '../../services/challengeService';
import { useAuth } from '../../contexts/AuthContext';

interface Challenge {
  id: string;
  game: string;
  platform?: string;
  challenger?: {
    username: string;
    uid: string;
  };
  challengerPlatformUsernames?: Record<string, string>;
  opponents?: Array<{
    username: string;
    accepterPlatformUsernames?: Record<string, string>;
  }>;
  scorecards?: Array<{
    playerAScore: number;
    playerBScore: number;
    playerAPlatformUsername: string;
    playerBPlatformUsername: string;
    submittedBy: string;
    submittedAt: Date;
  }>;
}

interface AIVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  onVerificationComplete: (result: AIChallengeVerification) => void;
}

export const AIVerificationModal: React.FC<AIVerificationModalProps> = ({
  isOpen,
  onClose,
  challenge,
  onVerificationComplete
}) => {
  const { user } = useAuth();
  const [proofImages, setProofImages] = useState<File[]>([]);
  const [proofDescription, setProofDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<AIChallengeVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setProofImages([]);
    setProofDescription('');
    setVerificationResult(null);
    setError(null);
    onClose();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setProofImages(files);
    setError(null);
  };

  const handleRemoveImage = (index: number) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleVerification = async () => {
    if (!challenge || !proofImages.length || !proofDescription.trim()) {
      setError('Please upload proof images and provide a description');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Get the current user's platform username
      const currentUsername = user?.username || '';
      const challengePlatform = challenge.platform?.toLowerCase() || '';
      
      let myTeam = '';
      const isChallenger = challenge.challenger?.username === currentUsername;
      
      if (isChallenger) {
        myTeam = challenge.challengerPlatformUsernames?.[challengePlatform] || currentUsername;
      } else {
        const opponent = challenge.opponents?.find(opp => opp.username === currentUsername);
        myTeam = opponent?.accepterPlatformUsernames?.[challengePlatform] || currentUsername;
      }

      console.log('🤖 Starting AI verification for challenge:', challenge.id);
      console.log('🤖 My team:', myTeam);
      console.log('🤖 Game type:', challenge.game);

      // Use the new challenge service method that handles wallet transactions
      const result = await challengeService.submitAIVerification(challenge.id, {
        description: proofDescription,
        proofImages: proofImages
      });

      console.log('🤖 AI verification result:', result);
      setVerificationResult(result);
      
      // Call the completion handler
      onVerificationComplete(result);
      
    } catch (error: any) {
      console.error('❌ AI verification error:', error);
      setError(error.message || 'AI verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!challenge) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl">
            🤖 AI Verification - {challenge.game}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload proof images and let our AI determine the winner based on the evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Summary */}
          <Card className="bg-secondary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Challenge Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Game:</span> {challenge.game}
                </div>
                <div>
                  <span className="font-medium">Platform:</span> {challenge.platform || 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conflicting Scorecards */}
          {challenge.scorecards && challenge.scorecards.length >= 2 && (
            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-700 dark:text-orange-300">
                  Conflicting Scorecards
                </CardTitle>
                <CardDescription>
                  The scores submitted by both players don't match. AI will analyze the proof to determine the correct winner.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          )}

          {/* AI Verification Form */}
          {!verificationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upload Proof for AI Analysis</CardTitle>
                <CardDescription>
                  Upload clear screenshots or images that show the final game result. Our AI will analyze the evidence to determine the winner.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Proof Image Upload */}
                <div>
                  <Label htmlFor="proof-images" className="text-sm font-medium">
                    Upload Proof Images *
                  </Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="proof-images"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="mt-2 w-full p-3 border border-border rounded-md bg-background text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload clear screenshots showing the final game result. Multiple images are supported.
                  </p>
                </div>

                {/* Preview uploaded images */}
                {proofImages.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Uploaded Images</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {proofImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Proof ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Proof Description */}
                <div>
                  <Label htmlFor="proof-description" className="text-sm font-medium">
                    Proof Description *
                  </Label>
                  <Textarea
                    id="proof-description"
                    value={proofDescription}
                    onChange={(e) => setProofDescription(e.target.value)}
                    placeholder="Describe what the proof images show (e.g., final score, game result, etc.)"
                    className="mt-2 w-full p-3 border border-border rounded-md bg-background text-foreground resize-none"
                    rows={3}
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleVerification}
                  disabled={isSubmitting || proofImages.length === 0 || !proofDescription.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-orbitron font-bold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Trophy className="mr-2 h-4 w-4" />
                      Claim using AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* AI Verification Result */}
          {verificationResult && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-lg text-green-700 dark:text-green-300 flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5" />
                  AI Verification Complete
                </CardTitle>
                <CardDescription>
                  Our AI has analyzed the proof and determined the winner.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background p-4 rounded-lg border">
                    <div className="text-sm font-medium mb-2">Winner</div>
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      {verificationResult.winner || verificationResult.aiResult?.winner}
                    </div>
                  </div>
                  <div className="bg-background p-4 rounded-lg border">
                    <div className="text-sm font-medium mb-2">Score</div>
                    <div className="text-lg font-bold">
                      {verificationResult.aiResult?.score || verificationResult.score}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-sm font-medium mb-1">Confidence</div>
                    <div className="text-lg font-bold">
                      {Math.round((verificationResult.aiResult?.confidence || verificationResult.confidence || 0) * 100)}%
                    </div>
                  </div>
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-sm font-medium mb-1">Evidence Quality</div>
                    <Badge 
                      variant={(verificationResult.aiResult?.evidenceQuality || verificationResult.evidenceQuality) === 'high' ? 'default' : 
                              (verificationResult.aiResult?.evidenceQuality || verificationResult.evidenceQuality) === 'medium' ? 'secondary' : 'destructive'}
                    >
                      {verificationResult.aiResult?.evidenceQuality || verificationResult.evidenceQuality}
                    </Badge>
                  </div>
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-sm font-medium mb-1">Result</div>
                    <Badge 
                      variant={(verificationResult.aiResult?.verificationResult || verificationResult.verificationResult) === 'verified' ? 'default' : 
                              (verificationResult.aiResult?.verificationResult || verificationResult.verificationResult) === 'needs_review' ? 'secondary' : 'destructive'}
                    >
                      {verificationResult.aiResult?.verificationResult || verificationResult.verificationResult}
                    </Badge>
                  </div>
                </div>

                {(verificationResult.aiResult?.reasoning || verificationResult.reasoning) && (
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-sm font-medium mb-2">AI Reasoning</div>
                    <div className="text-sm text-muted-foreground">
                      {verificationResult.aiResult?.reasoning || verificationResult.reasoning}
                    </div>
                  </div>
                )}

                {(verificationResult.aiResult?.suggestions || verificationResult.suggestions) && 
                 (verificationResult.aiResult?.suggestions?.length > 0 || verificationResult.suggestions?.length > 0) && (
                  <div className="bg-background p-3 rounded-lg border">
                    <div className="text-sm font-medium mb-2">Suggestions</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {(verificationResult.aiResult?.suggestions || verificationResult.suggestions || []).map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={handleClose}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setVerificationResult(null);
                      setProofImages([]);
                      setProofDescription('');
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Verify Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
