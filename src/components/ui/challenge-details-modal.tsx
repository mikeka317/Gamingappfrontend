import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  X, 
  Clock, 
  Calendar, 
  Gamepad2, 
  DollarSign, 
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Upload,
  Bot,
  Trophy
} from 'lucide-react';
import { Challenge } from '@/services/challengeService';

interface ChallengeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
}

export function ChallengeDetailsModal({ isOpen, onClose, challenge }: ChallengeDetailsModalProps) {
  if (!isOpen || !challenge) return null;

  // Debug logging
  console.log('🔍 ChallengeDetailsModal: Challenge object:', challenge);
  console.log('🔍 ChallengeDetailsModal: myTeam field:', challenge.myTeam);
  console.log('🔍 ChallengeDetailsModal: Challenge structure:', {
    id: challenge.id,
    game: challenge.game,
    myTeam: challenge.myTeam,
    hasMyTeam: 'myTeam' in challenge,
    challengeKeys: Object.keys(challenge)
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
            <Trophy className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'needs-proof':
        return (
          <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/30">
            <Upload className="h-3 w-3 mr-1" />
            Needs Proof
          </Badge>
        );
      case 'proof-submitted':
        return (
          <Badge variant="secondary" className="bg-info/20 text-info border-info/30">
            <Upload className="h-3 w-3 mr-1" />
            Proof Submitted
          </Badge>
        );
      case 'verifying':
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
            <Clock className="h-3 w-3 mr-1" />
            Verifying
          </Badge>
        );
      case 'ai-verified':
        return (
          <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
            <Bot className="h-3 w-3 mr-1" />
            AI Verified
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-muted/20 text-muted-foreground border-muted/30">
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (date: Date | string) => {
    if (date instanceof Date) {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  };

  const getOpponentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-warning border-warning/30">Pending</Badge>;
      case 'accept':
        return <Badge variant="outline" className="text-success border-success/30">Accepted</Badge>;
      case 'decline':
        return <Badge variant="outline" className="text-destructive border-destructive/30">Declined</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] bg-card/95 backdrop-blur-xl border-border/50 shadow-glass overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0">
          <div className="space-y-1">
            <CardTitle className="font-orbitron text-lg sm:text-xl">Challenge Details</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {challenge.label || `${challenge.game} Challenge`}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-secondary/80"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2 space-y-6">
          {/* Challenge Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-gaming rounded-lg flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-orbitron font-semibold text-lg">
                  {challenge.label || `${challenge.game} Challenge`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Created by {challenge.challenger.username}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-orbitron font-bold text-2xl text-success">
                ${challenge.stake}
              </div>
              <p className="text-xs text-muted-foreground">Stake Amount</p>
            </div>
          </div>

          {/* Status and Type */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Status:</span>
              <div className="mt-1">{getStatusBadge(challenge.status)}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Type:</span>
              <div className="mt-1">
                <Badge variant={challenge.type === 'outgoing' ? 'default' : 'secondary'}>
                  {challenge.type === 'outgoing' ? 'Outgoing' : 'Incoming'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Game Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Game:</span>
                <span className="font-medium">{challenge.game}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Platform:</span>
                <span className="font-medium capitalize">{challenge.platform}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Created:</span>
                <span className="font-medium">{formatDate(challenge.createdAt)}</span>
              </div>
              
            </div>
          </div>

          

          {/* Platform Usernames */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Platform Usernames:</span>
            
            {/* Challenger's Platform Usernames */}
            {challenge.challengerPlatformUsernames && Object.keys(challenge.challengerPlatformUsernames).length > 0 && (
              <div className="p-3 bg-secondary/20 rounded-lg">
                <span className="text-xs text-muted-foreground">Challenger's Usernames:</span>
                <div className="mt-2 space-y-1">
                  {Object.entries(challenge.challengerPlatformUsernames)
                    .filter(([_, username]) => username.trim())
                    .map(([platform, username]) => (
                      <div key={platform} className="flex items-center gap-2 text-sm">
                        <Gamepad2 className="h-3 w-3 text-primary" />
                        <span className="font-medium capitalize">{platform}:</span>
                        <span>{username}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Opponents' Platform Usernames */}
            {challenge.opponents.some(opp => opp.accepterPlatformUsernames && Object.keys(opp.accepterPlatformUsernames).length > 0) && (
              <div className="p-3 bg-secondary/20 rounded-lg">
                <span className="text-xs text-muted-foreground">Opponents' Usernames:</span>
                <div className="mt-2 space-y-2">
                  {challenge.opponents
                    .filter(opp => opp.accepterPlatformUsernames && Object.keys(opp.accepterPlatformUsernames).length > 0)
                    .map((opponent, index) => (
                      <div key={index} className="border-l-2 border-primary/30 pl-3">
                        <span className="text-xs text-muted-foreground">{opponent.username}:</span>
                        <div className="mt-1 space-y-1">
                          {Object.entries(opponent.accepterPlatformUsernames)
                            .filter(([_, username]) => username.trim())
                            .map(([platform, username]) => (
                              <div key={platform} className="flex items-center gap-2 text-sm">
                                <Gamepad2 className="h-3 w-3 text-primary" />
                                <span className="font-medium capitalize">{platform}:</span>
                                <span>{username}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* No platform usernames */}
            {(!challenge.challengerPlatformUsernames || Object.keys(challenge.challengerPlatformUsernames).length === 0) &&
             !challenge.opponents.some(opp => opp.accepterPlatformUsernames && Object.keys(opp.accepterPlatformUsernames).length > 0) && (
              <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg border border-dashed border-muted-foreground/30">
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-xs text-muted-foreground">Platform Usernames:</span>
                  <div className="text-sm text-muted-foreground italic">No platform usernames specified</div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {challenge.description && (
            <div>
              <span className="text-sm text-muted-foreground">Description:</span>
              <p className="mt-2 p-3 bg-secondary/20 rounded-lg text-sm">
                {challenge.description}
              </p>
            </div>
          )}

          {/* Opponents */}
          <div>
            <span className="text-sm text-muted-foreground">Opponents:</span>
            <div className="mt-2 space-y-2">
              {challenge.opponents.map((opponent, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-gaming text-primary-foreground font-orbitron text-xs">
                        {opponent.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{opponent.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getOpponentStatusBadge(opponent.status)}
                    {opponent.responseAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(opponent.responseAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          {(challenge.startedAt || challenge.completedAt || challenge.winner || challenge.loser) && (
            <div>
              <span className="text-sm text-muted-foreground">Game Details:</span>
              <div className="mt-2 space-y-2">
                {challenge.startedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Started: {formatDate(challenge.startedAt)}</span>
                  </div>
                )}
                {challenge.completedAt && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Completed: {formatDate(challenge.completedAt)}</span>
                  </div>
                )}
                {challenge.winner && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">Winner: {challenge.winner}</span>
                  </div>
                )}
                {challenge.loser && (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">Loser: {challenge.loser}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proof Information */}
          {challenge.proofRequired && (
            <div>
              <span className="text-sm text-muted-foreground">Proof Status:</span>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Required: {challenge.proofRequired ? 'Yes' : 'No'}</span>
                </div>
                {challenge.proofSubmitted && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">Submitted: {formatDate(challenge.proofSubmittedAt!)}</span>
                  </div>
                )}
                {challenge.verificationStatus && (
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Verification: {challenge.verificationStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
