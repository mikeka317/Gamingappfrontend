import { useState } from 'react';
import { Crown, Trophy, Users, Clock, Target, CheckCircle, AlertCircle, FileText, Brain, Upload, X, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TournamentScorecardTimer } from '@/components/ui/tournament-scorecard-timer';
import { TournamentAiTimer } from '@/components/ui/tournament-ai-timer';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TournamentMatch {
  id: string;
  round: number;
  matchNumber: number;
  player1: {
    uid: string;
    username: string;
    avatar?: string;
    level?: number;
  };
  player2: {
    uid: string;
    username: string;
    avatar?: string;
    level?: number;
  };
  status: 'pending' | 'ready' | 'in_progress' | 'scorecard_waiting' | 'scorecard_submitted' | 'scorecard_conflict' | 'scorecard_timeout' | 'ai_verification_waiting' | 'ai_verification' | 'completed' | 'disputed';
  winner?: string;
  scorecard?: {
    player1Score: number;
    player2Score: number;
    submittedBy: string;
    submittedAt: string;
  };
  player1Scorecard?: {
    player1Score: number;
    player2Score: number;
    submittedBy: string;
    submittedAt: string;
  };
  player2Scorecard?: {
    player1Score: number;
    player2Score: number;
    submittedBy: string;
    submittedAt: string;
  };
  scorecardTimer?: {
    startTime: string;
    endTime: string;
    expired: boolean;
  };
  aiTimer?: {
    startTime: string;
    endTime: string;
    expired: boolean;
  };
  conflictDetails?: {
    player1Scorecard: any;
    player2Scorecard: any;
    conflictDetectedAt: string;
  };
  player1Proof?: {
    proofImages: string[];
    proofDescription: string;
    uploadedBy: string;
    uploadedAt: string;
  };
  player2Proof?: {
    proofImages: string[];
    proofDescription: string;
    uploadedBy: string;
    uploadedAt: string;
  };
  hasConflict?: boolean;
  aiResult?: {
    winner: string;
    confidence: number;
    reasoning: string;
    verifiedAt: string;
  };
  proof?: {
    player1Proof?: string;
    player2Proof?: string;
  };
}

interface TournamentBracketProps {
  tournamentId: string;
  tournamentName: string;
  currentPlayerId: string;
  matches: TournamentMatch[];
  onStartMatch: (matchId: string) => void;
  onReadyMatch: (matchId: string) => void;
  onSubmitScorecard: (matchId: string, scorecard: {player1Score: number, player2Score: number}) => void;
  onUploadProof: (matchId: string, proofImages: string[], proofDescription: string) => void;
  onAIClaim: (matchId: string) => void;
  onCheckMatchStatus: (matchId: string) => void;
}

export const TournamentBracket = ({
  tournamentId,
  tournamentName,
  currentPlayerId,
  matches,
  onStartMatch,
  onReadyMatch,
  onSubmitScorecard,
  onUploadProof,
  onAIClaim,
  onCheckMatchStatus
}: TournamentBracketProps) => {
  console.log('🎯 TournamentBracket received matches:', matches);
  console.log('🎯 TournamentBracket matches length:', matches?.length);
  console.log('🎯 TournamentBracket first match:', matches?.[0]);
  
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [scorecardData, setScorecardData] = useState<{[matchId: string]: {player1Score: number, player2Score: number}}>({});
  const [proofData, setProofData] = useState<{[matchId: string]: string}>({});
  const [disputeData, setDisputeData] = useState<{[matchId: string]: {reason: string, evidence: string}}>({});
  const [isSubmittingScorecard, setIsSubmittingScorecard] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState<string | null>(null);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState<string | null>(null);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([1])); // Start with round 1 expanded

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, TournamentMatch[]>);

  // Get the total number of rounds
  const totalRounds = Math.max(...matches.map(m => m.round));
  const isFinalRound = (round: number) => round === totalRounds;

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-muted-foreground';
      case 'ready': return 'text-warning';
      case 'in_progress': return 'text-primary';
      case 'scorecard_waiting': return 'text-blue-500';
      case 'scorecard_submitted': return 'text-blue-600';
      case 'scorecard_conflict': return 'text-red-500';
      case 'scorecard_timeout': return 'text-orange-500';
      case 'ai_verification_waiting': return 'text-purple-500';
      case 'ai_verification': return 'text-purple-600';
      case 'completed': return 'text-success';
      case 'disputed': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'ready': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Target className="h-4 w-4" />;
      case 'scorecard_waiting': return <Clock className="h-4 w-4" />;
      case 'scorecard_submitted': return <CheckCircle className="h-4 w-4" />;
      case 'scorecard_conflict': return <AlertCircle className="h-4 w-4" />;
      case 'scorecard_timeout': return <Clock className="h-4 w-4" />;
      case 'ai_verification_waiting': return <Brain className="h-4 w-4" />;
      case 'ai_verification': return <Brain className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'disputed': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleScorecardChange = (matchId: string, player: 'player1' | 'player2', value: string) => {
    const score = parseInt(value) || 0;
    setScorecardData(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [`${player}Score`]: score
      }
    }));
  };

  const handleScorecardSubmit = async (matchId: string) => {
    const scorecard = scorecardData[matchId];
    if (!scorecard || scorecard.player1Score === undefined || scorecard.player2Score === undefined) {
      alert('Please enter scores for both players');
      return;
    }

    setIsSubmittingScorecard(matchId);
    try {
      await onSubmitScorecard(matchId, scorecard);
      // Clear the scorecard data after successful submission
      setScorecardData(prev => {
        const newData = { ...prev };
        delete newData[matchId];
        return newData;
      });
    } catch (error) {
      console.error('Error submitting scorecard:', error);
    } finally {
      setIsSubmittingScorecard(null);
    }
  };

  const handleProofSubmit = async (matchId: string) => {
    const proof = proofData[matchId];
    if (!proof) {
      alert('Please upload a proof screenshot');
      return;
    }

    // Find the match to get its current status
    const match = matches.find(m => m.id === matchId);
    console.log('📸 Submitting proof for match:', matchId, 'Current match status:', match?.status, 'with proof:', proof);

    setIsSubmittingProof(matchId);
    try {
      await onUploadProof(matchId, [proof], 'Tournament match proof');
      // Clear the proof data after successful submission
      setProofData(prev => {
        const newData = { ...prev };
        delete newData[matchId];
        return newData;
      });
    } catch (error) {
      console.error('Error submitting proof:', error);
    } finally {
      setIsSubmittingProof(null);
    }
  };

  const handleAIClaimSubmit = async (matchId: string) => {
    setIsSubmittingProof(matchId);
    try {
      await onAIClaim(matchId);
    } catch (error) {
      console.error('Error submitting AI claim:', error);
    } finally {
      setIsSubmittingProof(null);
    }
  };

  const handleFileUpload = (matchId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProofData(prev => ({
        ...prev,
        [matchId]: result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDisputeChange = (matchId: string, field: 'reason' | 'evidence', value: string) => {
    setDisputeData(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: value
      }
    }));
  };

  const handleDisputeSubmit = async (matchId: string) => {
    setIsSubmittingDispute(matchId);
    try {
      const dispute = disputeData[matchId];
      if (!dispute?.reason) {
        throw new Error('Reason is required for dispute');
      }

      const response = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}/dispute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: dispute.reason,
          evidence: dispute.evidence || ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit dispute');
      }

      const result = await response.json();
      console.log('✅ Dispute submitted successfully:', result);
      
      // Clear the dispute data
      setDisputeData(prev => {
        const newData = { ...prev };
        delete newData[matchId];
        return newData;
      });

      // Refresh the page to get updated match status
      window.location.reload();
    } catch (error) {
      console.error('❌ Error submitting dispute:', error);
      alert(`Failed to submit dispute: ${error.message}`);
    } finally {
      setIsSubmittingDispute(null);
    }
  };

  const isPlayerInMatch = (match: TournamentMatch) => {
    // Only allow users to participate in their actual matches
    const isInMatch = match.player1.uid === currentPlayerId || match.player2.uid === currentPlayerId;
    console.log('🔍 Checking if player in match:', { 
      matchId: match.id, 
      round: match.round, 
      player1Id: match.player1.uid, 
      player1Username: match.player1.username,
      player2Id: match.player2.uid, 
      player2Username: match.player2.username,
      currentPlayerId, 
      isInMatch,
      player1Match: match.player1.uid === currentPlayerId,
      player2Match: match.player2.uid === currentPlayerId,
      matchStatus: match.status,
      fullMatchObject: match
    });
    return isInMatch;
  };

  const getCurrentPlayerMatch = () => {
    return matches.find(match => isPlayerInMatch(match) && match.status !== 'completed');
  };

  const currentMatch = getCurrentPlayerMatch();

  const toggleRoundExpansion = (round: number) => {
    setExpandedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(round)) {
        newSet.delete(round);
      } else {
        newSet.add(round);
      }
      return newSet;
    });
  };

  const getRoundTitle = (round: number) => {
    if (isFinalRound(round)) {
      return '🏆 Final Round';
    } else if (round === 1) {
      return '🥊 Round of 16';
    } else if (round === 2) {
      return '🥊 Quarter Finals';
    } else if (round === 3) {
      return '🥊 Semi Finals';
    } else {
      return `🥊 Round ${round}`;
    }
  };

  const getMatchGridCols = (round: number) => {
    const matchCount = matchesByRound[round]?.length || 0;
    if (matchCount <= 2) return 'grid-cols-1';
    if (matchCount <= 4) return 'grid-cols-2';
    if (matchCount <= 8) return 'grid-cols-3';
    if (matchCount <= 16) return 'grid-cols-4';
    return 'grid-cols-5';
  };

  const renderMatchCard = (match: TournamentMatch, isCompact: boolean = false) => {
    const isPlayerMatch = isPlayerInMatch(match);
    const isWinner = match.winner === currentPlayerId;
    
    return (
      <Card 
        key={match.id} 
        className={`bg-gradient-glow border-border/30 hover:shadow-neon-cyan transition-all duration-300 ${
          isPlayerMatch ? 'ring-2 ring-primary' : ''
        } ${isWinner ? 'ring-2 ring-success' : ''} ${
          isCompact ? 'p-3' : 'p-4'
        }`}
      >
        <CardContent className={isCompact ? 'p-2' : 'p-4'}>
          {/* Match Header */}
          <div className="text-center mb-3">
            <Badge 
              variant="outline" 
              className={`${getMatchStatusColor(match.status)} border-0 ${isCompact ? 'text-xs' : ''}`}
            >
              {getMatchStatusIcon(match.status)}
              <span className={`ml-1 capitalize ${isCompact ? 'text-xs' : ''}`}>
                {match.status.replace('_', ' ')}
              </span>
            </Badge>
            {!isCompact && (
              <div className="text-xs text-gray-400 text-center mt-1">
                Debug: Match {match.id} status = "{match.status}"
              </div>
            )}
          </div>
          
          {/* Players */}
          <div className={`space-y-3 ${isCompact ? 'space-y-2' : ''}`}>
            {/* Player 1 */}
            <div className={`flex items-center justify-between ${isCompact ? 'p-2' : 'p-3'} rounded-lg ${
              match.winner === match.player1.uid ? 'bg-success/20 border border-success/30' : 'bg-secondary/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} bg-primary/20 rounded-full flex items-center justify-center`}>
                  <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold text-primary`}>1</span>
                </div>
                <div>
                  <div className={`${isCompact ? 'text-sm' : 'font-semibold'}`}>{match.player1.username}</div>
                  <div className={`text-xs text-muted-foreground`}>
                    Level {match.player1.level || Math.floor(Math.random() * 50) + 20}
                  </div>
                </div>
              </div>
              {match.winner === match.player1.uid && (
                <Badge className={`bg-success text-success-foreground ${isCompact ? 'text-xs px-2 py-1' : ''}`}>
                  {isFinalRound(match.round) ? 'CHAMPION' : 'WON'}
                </Badge>
              )}
            </div>

            {/* VS Separator */}
            <div className="flex items-center justify-center">
              <div className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} bg-primary/20 rounded-full flex items-center justify-center`}>
                <span className={`${isCompact ? 'text-xs' : 'text-xs'} font-bold text-primary`}>VS</span>
              </div>
            </div>

            {/* Player 2 */}
            <div className={`flex items-center justify-between ${isCompact ? 'p-2' : 'p-3'} rounded-lg ${
              match.winner === match.player2.uid ? 'bg-success/20 border border-success/30' : 'bg-secondary/20'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} bg-primary/20 rounded-full flex items-center justify-center`}>
                  <span className={`${isCompact ? 'text-xs' : 'text-sm'} font-bold text-primary`}>2</span>
                </div>
                <div>
                  <div className={`${isCompact ? 'text-sm' : 'font-semibold'}`}>{match.player2.username}</div>
                  <div className={`text-xs text-muted-foreground`}>
                    Level {match.player2.level || Math.floor(Math.random() * 50) + 20}
                  </div>
                </div>
              </div>
              {match.winner === match.player2.uid && (
                <Badge className={`bg-success text-success-foreground ${isCompact ? 'text-xs px-2 py-1' : ''}`}>
                  {isFinalRound(match.round) ? 'CHAMPION' : 'WON'}
                </Badge>
              )}
            </div>
          </div>

          {/* Match Actions - Only show for player's matches */}
          {isPlayerMatch && match.status !== 'completed' && (
            <div className={`mt-4 space-y-2 ${isCompact ? 'mt-2' : ''}`}>
              {match.status === 'pending' && (
                <Button 
                  onClick={() => onStartMatch(match.id)}
                  className={`w-full bg-gradient-gaming hover:shadow-neon-orange ${isCompact ? 'text-sm py-2' : ''}`}
                  disabled={match.startedPlayers?.includes(currentPlayerId)}
                >
                  <Target className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
                  {match.startedPlayers?.includes(currentPlayerId) ? 'Waiting for Opponent' : 'Start Match'}
                </Button>
              )}
              
              {match.status === 'ready' && (
                <div className="space-y-2">
                  {/* Show opponent readiness status */}
                  {match.readyPlayers && match.readyPlayers.length > 0 && (
                    <div className={`text-muted-foreground text-center ${isCompact ? 'text-xs' : 'text-sm'}`}>
                      {match.readyPlayers.map(playerId => {
                        const isPlayer1 = playerId === match.player1.uid;
                        const playerLabel = isPlayer1 ? 'Player 1' : 'Player 2';
                        return (
                          <div key={playerId} className="flex items-center justify-center gap-2">
                            <CheckCircle className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} text-green-500`} />
                            <span>{playerLabel} is ready</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => onReadyMatch(match.id)}
                    className={`w-full bg-gradient-gaming hover:shadow-neon-orange ${isCompact ? 'text-sm py-2' : ''}`}
                    disabled={match.readyPlayers?.includes(currentPlayerId)}
                  >
                    <CheckCircle className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
                    {match.readyPlayers?.includes(currentPlayerId) ? 'Waiting for Opponent' : 'I\'m Ready'}
                  </Button>
                </div>
              )}

              {match.status === 'in_progress' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className={`w-full bg-gradient-gaming hover:shadow-neon-orange ${isCompact ? 'text-sm py-2' : ''}`}>
                      <FileText className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
                      Submit Scorecard
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Scorecard</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`${match.id}-player1`}>{match.player1.username}</Label>
                          <Input
                            id={`${match.id}-player1`}
                            type="number"
                            min="0"
                            value={scorecardData[match.id]?.player1Score || ''}
                            onChange={(e) => handleScorecardChange(match.id, 'player1', e.target.value)}
                            placeholder="Score"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${match.id}-player2`}>{match.player2.username}</Label>
                          <Input
                            id={`${match.id}-player2`}
                            type="number"
                            min="0"
                            value={scorecardData[match.id]?.player2Score || ''}
                            onChange={(e) => handleScorecardChange(match.id, 'player2', e.target.value)}
                            placeholder="Score"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => handleScorecardSubmit(match.id)}
                        disabled={isSubmittingScorecard === match.id}
                        className="w-full bg-gradient-gaming hover:shadow-neon-orange"
                      >
                        {isSubmittingScorecard === match.id ? 'Submitting...' : 'Submit Scorecard'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {match.status === 'scorecard_waiting' && (
                <div className="space-y-3">
                  <TournamentScorecardTimer 
                    tournamentId={tournamentId}
                    matchId={match.id}
                    onTimerExpired={() => {
                      console.log('Scorecard timer expired for match:', match.id);
                      window.location.reload();
                    }}
                  />
                  <div className={`text-center text-muted-foreground ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    Waiting for opponent to submit scorecard...
                  </div>
                </div>
              )}

              {match.status === 'scorecard_submitted' && (
                <div className="space-y-3">
                  <div className={`text-center text-blue-600 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    ✅ Scorecard Submitted
                  </div>
                  <div className="text-center text-muted-foreground text-xs">
                    Checking for conflicts or determining winner...
                  </div>
                  <Button 
                    onClick={() => onCheckMatchStatus(match.id)}
                    className={`w-full bg-gradient-gaming hover:shadow-neon-orange ${isCompact ? 'text-sm py-2' : ''}`}
                  >
                    🔍 Check Status
                  </Button>
                </div>
              )}

              {match.status === 'scorecard_conflict' && (
                <div className="space-y-3">
                  <div className={`text-center text-red-500 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    ⚠️ Scorecard Conflict Detected
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className={`w-full bg-gradient-gaming hover:shadow-neon-orange ${isCompact ? 'text-sm py-2' : ''}`}>
                        <Upload className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
                        Upload Proof
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Proof for AI Verification</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                          Upload a screenshot of your game result for AI verification
                        </div>
                        <div>
                          <Label htmlFor={`${match.id}-proof`}>Proof Screenshot</Label>
                          <Input
                            id={`${match.id}-proof`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(match.id, file);
                            }}
                          />
                          {proofData[match.id] && (
                            <div className="mt-2 text-sm text-green-600">
                              ✓ Proof uploaded successfully
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleProofSubmit(match.id)}
                          disabled={!proofData[match.id] || isSubmittingProof === match.id}
                          className="w-full bg-gradient-gaming hover:shadow-neon-orange"
                        >
                          {isSubmittingProof === match.id ? 'Submitting...' : 'Submit Proof'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {match.status === 'ai_verification_waiting' && (
                <div className="space-y-3">
                  <TournamentAiTimer 
                    tournamentId={tournamentId}
                    matchId={match.id}
                    onTimerExpired={() => {
                      console.log('AI timer expired for match:', match.id);
                      window.location.reload();
                    }}
                  />
                  <div className={`text-center text-muted-foreground ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    Waiting for opponent to upload proof...
                  </div>
                </div>
              )}

              {match.status === 'ai_verification' && (
                <div className="space-y-3">
                  <div className={`flex items-center justify-center gap-2 text-purple-300 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    <Brain className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                    <span>AI is analyzing proofs...</span>
                  </div>
                  <Button 
                    onClick={() => handleAIClaimSubmit(match.id)}
                    disabled={isSubmittingProof === match.id}
                    className={`w-full bg-gradient-gaming hover:shadow-neon-orange ${isCompact ? 'text-sm py-2' : ''}`}
                  >
                    {isSubmittingProof === match.id ? 'Processing...' : 'Complete AI Analysis'}
                  </Button>
                </div>
              )}

              {match.status === 'completed' && (
                <div className="space-y-3">
                  <div className={`text-center text-green-600 ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    ✅ Match Completed
                  </div>
                  {match.winner && (
                    <div className={`text-center text-muted-foreground ${isCompact ? 'text-xs' : 'text-xs'}`}>
                      Winner: {match.winner === match.player1.uid ? match.player1.username : match.player2.username}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card className="bg-gradient-glow border-border/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{tournamentName}</CardTitle>
              <CardDescription>Tournament Bracket - Follow your progress</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tournament Bracket Visualization */}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-lg"></div>
        
        {/* Bracket Container */}
        <div className="relative p-6">
          {/* Render each round */}
          {Array.from({ length: totalRounds }, (_, i) => i + 1).map(round => {
            const roundMatches = matchesByRound[round] || [];
            const isExpanded = expandedRounds.has(round);
            const isCurrentRound = round === 1; // Always show current round expanded
            
            return (
              <div key={round} className="mb-8">
                {/* Round Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{getRoundTitle(round)}</h3>
                    <Badge variant="outline" className="text-xs">
                      {roundMatches.length} match{roundMatches.length !== 1 ? 'es' : ''}
                    </Badge>
                  </div>
                  {!isCurrentRound && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRoundExpansion(round)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      {isExpanded ? 'Collapse' : 'Expand'}
                    </Button>
                  )}
                </div>

                {/* Round Matches */}
                {(isExpanded || isCurrentRound) && (
                  <div className={`grid ${getMatchGridCols(round)} gap-4`}>
                    {roundMatches.map((match) => renderMatchCard(match, !isCurrentRound))}
                  </div>
                )}

                {/* Round Summary (when collapsed) */}
                {!isExpanded && !isCurrentRound && (
                  <div className="bg-secondary/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {roundMatches.filter(m => m.status === 'completed').length} of {roundMatches.length} matches completed
                      </div>
                      <div className="flex gap-2">
                        {roundMatches.filter(m => m.status === 'completed').map(match => (
                          <div key={match.id} className="w-2 h-2 bg-success rounded-full" />
                        ))}
                        {roundMatches.filter(m => m.status !== 'completed').map(match => (
                          <div key={match.id} className="w-2 h-2 bg-muted rounded-full" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};