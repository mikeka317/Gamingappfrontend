import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  XCircle, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Gamepad2,
  Star,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResultVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: 'won' | 'lost';
  challenge: {
    id: number;
    opponent: string;
    game: string;
    wager: number;
    proofImages: string[];
    description: string;
  };
  onViewDetails?: () => void;
}

export function ResultVerificationModal({ 
  isOpen, 
  onClose, 
  result, 
  challenge, 
  onViewDetails 
}: ResultVerificationModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    if (result === 'won' && isOpen) {
      setShowConfetti(true);
      // Calculate earnings (wager amount)
      setEarnings(challenge.wager);
      
      // Hide confetti after 3 seconds
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [result, isOpen, challenge.wager]);

  const getResultIcon = () => {
    switch (result) {
      case 'won':
        return <Trophy className="h-16 w-16 text-success" />;
      case 'lost':
        return <XCircle className="h-16 w-16 text-destructive" />;
      default:
        return <AlertTriangle className="h-16 w-16 text-muted-foreground" />;
    }
  };

  const getResultTitle = () => {
    switch (result) {
      case 'won':
        return 'Victory Confirmed! 🎉';
      case 'lost':
        return 'Challenge Lost';
      default:
        return 'Result Pending';
    }
  };

  const getResultDescription = () => {
    switch (result) {
      case 'won':
        return `Congratulations! Your proof has been verified by AI. You've defeated ${challenge.opponent} in ${challenge.game}!`;
      case 'lost':
        return `Unfortunately, AI analysis determined your proof was not sufficient. ${challenge.opponent} has won this challenge.`;
      default:
        return 'Processing your submission...';
    }
  };

  const getResultColor = () => {
    switch (result) {
      case 'won':
        return 'text-success';
      case 'lost':
        return 'text-destructive';
      case 'disputed':
        return 'text-warning';
      default:
        return 'text-muted-foreground';
    }
  };

  const getResultBadge = () => {
    switch (result) {
      case 'won':
        return <Badge className="bg-success/20 text-success border-success/30">Victory</Badge>;
      case 'lost':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Defeat</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getResultIcon()}
          </div>
          <DialogTitle className={cn("font-orbitron text-2xl", getResultColor())}>
            {getResultTitle()}
          </DialogTitle>
          <DialogDescription className="font-inter text-muted-foreground text-base">
            {getResultDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Confetti Effect for Victory */}
          {showConfetti && result === 'won' && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                >
                  <Star className="h-4 w-4 text-yellow-400" />
                </div>
              ))}
            </div>
          )}

          {/* Challenge Summary */}
          <Card className="bg-gradient-glow border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-orbitron font-semibold">vs {challenge.opponent}</p>
                    <p className="text-sm text-muted-foreground">{challenge.game}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    {getResultBadge()}
                  </div>
                  <p className="font-orbitron font-bold text-lg text-primary">
                    ${challenge.wager.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">Wager Amount</p>
                </div>
              </div>
              
              {/* Winner/Loser Display */}
              <div className="mt-4 p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="text-center">
                  <p className="text-sm font-semibold text-success mb-1">AI Verification Result</p>
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground">Winner</span>
                      <p className="font-orbitron font-bold text-success text-lg">
                        {result === 'won' ? 'You' : challenge.opponent}
                      </p>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground">Loser</span>
                      <p className="font-inter font-medium text-muted-foreground text-lg">
                        {result === 'won' ? challenge.opponent : 'You'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Result Details */}
          {result === 'won' && (
            <Card className="bg-success/10 border-success/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-orbitron font-semibold text-success">Earnings</p>
                      <p className="text-sm text-success/70">Your winnings have been added to your wallet</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-orbitron font-bold text-2xl text-success">
                      +${earnings.toFixed(2)}
                    </p>
                    <p className="text-xs text-success/70">Added to wallet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {result === 'lost' && (
            <Card className="bg-destructive/10 border-destructive/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-destructive/20 rounded-lg">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-orbitron font-semibold text-destructive">Loss</p>
                      <p className="text-sm text-destructive/70">AI analysis determined defeat</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-orbitron font-bold text-2xl text-destructive">
                      -${challenge.wager.toFixed(2)}
                    </p>
                    <p className="text-xs text-destructive/70">Deducted from wallet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proof Summary */}
          <Card className="bg-secondary/20 border-border/30">
            <CardContent className="p-4">
              <h4 className="font-inter font-semibold mb-3">Proof Submitted</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">
                    {challenge.proofImages.length} image{challenge.proofImages.length !== 1 ? 's' : ''} uploaded
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">
                    Description: {challenge.description.length} characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">
                    Submitted at {new Date().toLocaleTimeString()}
                  </span>
                </div>
                
                {/* AI Verification Status */}
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-success/20 rounded">
                    <Bot className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-sm text-success font-medium">
                    AI Verification Complete
                  </span>
                </div>
                
                {/* AI Verification Details */}
                <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-success" />
                    <span className="text-sm font-semibold text-success">AI Analysis Results</span>
                  </div>
                  <div className="text-xs text-success/80 space-y-1">
                    <p>• Proof quality: {result === 'won' ? 'High' : 'Medium'}</p>
                    <p>• Evidence strength: {result === 'won' ? 'Strong' : 'Moderate'}</p>
                    <p>• Verification confidence: {result === 'won' ? '95%' : '75%'}</p>
                    <p>• Decision: {result === 'won' ? 'Victory confirmed' : 'Loss confirmed'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {result === 'won' && (
              <Button 
                onClick={onViewDetails}
                className="bg-gradient-gaming hover:shadow-neon-orange transition-all duration-300 font-inter font-semibold"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Stats
              </Button>
            )}
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="hover:bg-secondary/80"
            >
              Close
            </Button>
          </div>

          {/* Additional Info */}
          {result === 'won' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-inter">
                Your win rate has increased! Keep challenging opponents to climb the leaderboard.
              </p>
            </div>
          )}

          {result === 'lost' && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-inter">
                Don't give up! Practice more and challenge again. Every defeat is a learning opportunity.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
