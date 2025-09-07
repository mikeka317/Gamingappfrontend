import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Sword, Gamepad2, DollarSign, MessageSquare, Trophy } from 'lucide-react';

interface User {
  id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
  rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  winRate: number;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  favoriteGame: string;
  lastActive: string;
  isOnline: boolean;
}

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponent: User;
}

const availableGames = [
  'Valorant',
  'CS:GO',
  'League of Legends',
  'Dota 2',
  'Overwatch',
  'Rainbow Six Siege',
  'Apex Legends',
  'Fortnite',
  'PUBG',
  'Call of Duty: Warzone',
  'Rocket League',
  'FIFA 24',
  'Street Fighter 6',
  'Mortal Kombat 1',
  'Super Smash Bros. Ultimate'
];

export function ChallengeModal({ isOpen, onClose, opponent }: ChallengeModalProps) {
  const [selectedGame, setSelectedGame] = useState(opponent.favoriteGame);
  const [wagerAmount, setWagerAmount] = useState('');
  const [challengeMessage, setChallengeMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedGame || !wagerAmount) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('🎯 Challenge Submitted:', {
        opponent: opponent.username,
        game: selectedGame,
        wager: parseFloat(wagerAmount),
        message: challengeMessage
      });
      
      // Show success message
      alert(`Challenge sent to ${opponent.username}! They have 24 hours to accept.`);
      
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'bronze': return 'text-amber-600';
      case 'silver': return 'text-gray-400';
      case 'gold': return 'text-yellow-500';
      case 'platinum': return 'text-cyan-400';
      case 'diamond': return 'text-purple-500';
      default: return 'text-muted-foreground';
    }
  };

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      case 'diamond': return '👑';
      default: return '🎯';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'away': return 'bg-warning';
      case 'offline': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-orbitron font-bold bg-gradient-gaming bg-clip-text text-transparent">
              Challenge Player
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-secondary/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Opponent Info Card */}
          <Card className="bg-gradient-glow border-border/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-border/50">
                    <AvatarImage src={opponent.avatar} alt={opponent.username} />
                    <AvatarFallback className="bg-gradient-gaming text-primary-foreground font-bold text-xl">
                      {opponent.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-background ${getStatusColor(opponent.status)}`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-orbitron font-bold">{opponent.username}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {opponent.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <span className={`font-medium ${getRankColor(opponent.rank)}`}>
                        {getRankIcon(opponent.rank)} {opponent.rank.charAt(0).toUpperCase() + opponent.rank.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-success" />
                      <span className="font-medium text-success">{opponent.winRate}% Win Rate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gamepad2 className="h-4 w-4 text-primary" />
                      <span className="font-medium text-primary">{opponent.totalGames} Games</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Game Selection */}
            <div className="space-y-2">
              <Label htmlFor="game" className="text-sm font-medium">
                Select Game <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedGame} onValueChange={setSelectedGame}>
                <SelectTrigger className="bg-card/50 border-border/50">
                  <SelectValue placeholder="Choose a game" />
                </SelectTrigger>
                <SelectContent className="bg-card/95 border-border/50">
                  {availableGames.map((game) => (
                    <SelectItem key={game} value={game} className="hover:bg-secondary/50">
                      {game}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Wager Amount */}
            <div className="space-y-2">
              <Label htmlFor="wager" className="text-sm font-medium">
                Wager Amount ($) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="wager"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={wagerAmount}
                  onChange={(e) => setWagerAmount(e.target.value)}
                  className="pl-10 bg-card/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>
          </div>

          {/* Challenge Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">
              Challenge Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder={`Challenge ${opponent.username} to a ${selectedGame} match! Add a personal message...`}
              value={challengeMessage}
              onChange={(e) => setChallengeMessage(e.target.value)}
              className="bg-card/50 border-border/50 focus:border-primary/50 min-h-[100px]"
            />
          </div>

          {/* Challenge Preview */}
          <Card className="bg-secondary/20 border-border/30">
            <CardContent className="p-4">
              <h4 className="font-orbitron font-semibold mb-3 text-primary">Challenge Preview</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opponent:</span>
                  <span className="font-medium">{opponent.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Game:</span>
                  <span className="font-medium">{selectedGame}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wager:</span>
                  <span className="font-medium text-success">${wagerAmount || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potential Win:</span>
                  <span className="font-medium text-success">${wagerAmount ? (parseFloat(wagerAmount) * 1.8).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 hover:bg-secondary/80"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedGame || !wagerAmount}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold py-3 transition-all duration-300 hover:shadow-neon-orange disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending Challenge...
                </>
              ) : (
                <>
                  <Sword className="h-4 w-4 mr-2" />
                  Send Challenge
                </>
              )}
            </Button>
          </div>

          {/* Terms */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
            By sending this challenge, you agree to the platform's terms and conditions. 
            The opponent has 24 hours to accept or decline.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

