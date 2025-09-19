import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users,
  Gamepad2,
  DollarSign,
  Eye,
  Trophy,
  Upload,
  Flag,
  X,
  Play,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { challengeService } from '../services/challengeService';
import { walletService } from '../services/walletService';
import { useToast } from '@/hooks/use-toast';
import { ChallengeDetailsModal } from '@/components/ui/challenge-details-modal';
import { ScorecardModal } from '@/components/ui/scorecard-modal';
import { AIVerificationModal } from '@/components/ui/ai-verification-modal';
import { ChallengeAcceptanceModal } from '@/components/ui/challenge-acceptance-modal';
import { ScorecardTimer } from '@/components/ui/scorecard-timer';
import { AiVerificationTimer } from '@/components/ui/ai-verification-timer';
import { Challenge } from '@/services/challengeService';
import { API_BASE_URL } from '@/services/api';

export default function ChallengesForMe() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Challenge details modal state
  const [isChallengeDetailsModalOpen, setIsChallengeDetailsModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Challenge acceptance modal state
  const [isChallengeAcceptanceModalOpen, setIsChallengeAcceptanceModalOpen] = useState(false);
  const [selectedAcceptanceChallenge, setSelectedAcceptanceChallenge] = useState<Challenge | null>(null);

  // Scorecard modal state
  const [isScorecardModalOpen, setIsScorecardModalOpen] = useState(false);
  const [selectedScorecardChallenge, setSelectedScorecardChallenge] = useState<Challenge | null>(null);

  // AI verification modal state
  const [isAIVerificationModalOpen, setIsAIVerificationModalOpen] = useState(false);
  const [selectedAIVerificationChallenge, setSelectedAIVerificationChallenge] = useState<Challenge | null>(null);

  // Dispute modal state
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeChallenge, setSelectedDisputeChallenge] = useState<Challenge | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeProofImages, setDisputeProofImages] = useState<File[]>([]);
  const disputeFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch challenges for the current user
  // Fetch challenges function
  const fetchChallenges = async () => {
    try {
      setLoading(true);
      console.log('🔍 ChallengesForMe: Fetching challenges for user:', user?.username);
      console.log('🔍 ChallengesForMe: User UID:', user?.uid);
      
      const fetchedChallenges = await challengeService.getChallengesForMe();
      console.log('✅ ChallengesForMe: Challenges fetched:', fetchedChallenges);
      console.log('✅ ChallengesForMe: Number of challenges:', fetchedChallenges.length);
      
      // Debug: Log challenge statuses
      fetchedChallenges.forEach((challenge, index) => {
        console.log(`🔍 Challenge ${index + 1}: ID=${challenge.id}, Status=${challenge.status}`);
        console.log(`🔍 Challenge ${index + 1} Winner:`, challenge.winner);
        console.log(`🔍 Challenge ${index + 1} Winner Check:`, didCurrentUserWin(challenge));
        if (challenge.status === 'scorecard-pending') {
          console.log('⏰ Found scorecard-pending challenge:', challenge.id);
        }
      });
      
      // Check for existing disputes for each challenge
      const challengesWithDisputes = await Promise.all(
        fetchedChallenges.map(async (challenge) => {
          try {
            // Check if user already has a dispute for this challenge
            const existingDispute = await walletService.hasActiveDispute(challenge.id);
            return {
              ...challenge,
              disputed: existingDispute
            };
          } catch (error) {
            console.error('Error checking dispute status for challenge:', challenge.id, error);
            return { ...challenge, disputed: false };
          }
        })
      );
      
      setChallenges(challengesWithDisputes);
    } catch (error) {
      console.error('❌ ChallengesForMe: Error fetching challenges:', error);
      // Keep empty array for now
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load real wallet balance
    (async () => {
      try {
        const balance = await walletService.getWalletBalance();
        setWalletBalance(balance);
      } catch (e) {
        console.error('Error loading wallet balance:', e);
      }
    })();

    fetchChallenges();
    const interval = setInterval(fetchChallenges, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleAcceptChallenge = async (challengeId: string, myTeam?: string, accepterPlatformUsernames?: { [platform: string]: string }) => {
    try {
      await challengeService.respondToChallenge(challengeId, 'accept', myTeam, accepterPlatformUsernames);
      
      // Show success toast
      toast({
        title: "Challenge Accepted! 🎉",
        description: "You've successfully accepted the challenge. Good luck!",
        variant: "default",
      });
      
      // Update local state to reflect that this user has accepted
      setChallenges(prev => prev.map(challenge => 
        challenge.id === challengeId 
          ? {
              ...challenge,
              opponents: challenge.opponents.map(opp => 
                opp.username === user?.username 
                  ? { ...opp, status: 'accepted', myTeam, accepterPlatformUsernames }
                  : opp
              )
            }
          : challenge
      ));
    } catch (error: any) {
      console.error('Error accepting challenge:', error);
      
      // Check if it's an insufficient funds error
      if (error.message && error.message.includes('Insufficient funds')) {
        toast({
          title: "Insufficient Funds 💸",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Generic error toast
        toast({
          title: "Error Accepting Challenge ❌",
          description: error.message || "Failed to accept challenge. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      await challengeService.respondToChallenge(challengeId, 'decline');
      
      // Show success toast
      toast({
        title: "Challenge Declined ❌",
        description: "You've declined the challenge.",
        variant: "default",
      });
      
      // Update local state
      setChallenges(prev => prev.map(c => 
        c.id === challengeId ? { ...c, status: 'cancelled' } : c
      ));
    } catch (error: any) {
      console.error('Error declining challenge:', error);
      
      // Generic error toast
      toast({
        title: "Error Declining Challenge ❌",
        description: error.message || "Failed to decline challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMarkReady = async (challengeId: string) => {
    try {
      await challengeService.markReady(challengeId);
      
      // Show success toast
      toast({
        title: "Ready!",
        description: "You have marked yourself as ready. Waiting for other players...",
        variant: "default",
      });
      
      // Refresh challenges
      fetchChallenges();
    } catch (error: any) {
      console.error('Error marking ready:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark ready",
        variant: "destructive",
      });
    }
  };

  // Challenge details modal handlers
  const openChallengeDetailsModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsChallengeDetailsModalOpen(true);
  };

  const closeChallengeDetailsModal = () => {
    setIsChallengeDetailsModalOpen(false);
    setSelectedChallenge(null);
  };

  // Challenge acceptance modal handlers
  const openChallengeAcceptanceModal = (challenge: Challenge) => {
    setSelectedAcceptanceChallenge(challenge);
    setIsChallengeAcceptanceModalOpen(true);
  };

  const closeChallengeAcceptanceModal = () => {
    setIsChallengeAcceptanceModalOpen(false);
    setSelectedAcceptanceChallenge(null);
  };

  // Scorecard modal handlers
  const openScorecardModal = (challenge: Challenge) => {
    setSelectedScorecardChallenge(challenge);
    setIsScorecardModalOpen(true);
  };

  const closeScorecardModal = () => {
    setIsScorecardModalOpen(false);
    setSelectedScorecardChallenge(null);
  };

  // Dispute modal functions
  const openDisputeModal = (challenge: Challenge) => {
    // Prevent opening if challenge is already disputed or resolved by admin
    if (challenge.disputed || (challenge as any).disputeResolved) {
      alert('A dispute has already been submitted for this challenge.');
      return;
    }
    
    setSelectedDisputeChallenge(challenge);
    setIsDisputeModalOpen(true);
    setDisputeReason('');
    setDisputeProofImages([]);
  };

  const showExistingDisputeInfo = (challenge: Challenge) => {
    alert(`You already have an active dispute for this challenge.\n\nStatus: Submitted\nNext Step: Awaiting admin review\n\nPlease wait for the admin to review your case. You will be notified of the outcome.`);
  };

  const closeDisputeModal = () => {
    setIsDisputeModalOpen(false);
    setSelectedDisputeChallenge(null);
    setDisputeReason('');
    setDisputeProofImages([]);
  };

  const handleDisputeImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setDisputeProofImages(prev => [...prev, ...imageFiles]);
    }
  };

  const removeDisputeImage = (index: number) => {
    setDisputeProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDisputeImages = async (
    images: File[],
    challengeId: string,
    opponentId: string,
    opponentUsername: string,
    reason: string
  ): Promise<string[]> => {
    if (!images.length) return [];
    const formData = new FormData();
    images.forEach(image => formData.append('evidenceFiles', image));
    formData.append('challengeId', challengeId);
    formData.append('opponentId', opponentId);
    formData.append('opponentUsername', opponentUsername);
    formData.append('disputeReason', reason);
    const token = localStorage.getItem('authToken') || '';
    const res = await fetch(`${API_BASE_URL}/wallet/dispute`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload dispute images');
    const json = await res.json();
    const urls = (json?.data?.evidence || []) as string[];
    return urls;
  };

  const handleSubmitDispute = async () => {
    if (!selectedDisputeChallenge || !disputeReason.trim()) {
      alert('Please provide a reason for the dispute');
      return;
    }

    try {
      setIsSubmittingDispute(true);
      
      // Determine opponent information
      const isChallenger = selectedDisputeChallenge.challenger?.uid === user?.uid;
      // Opponents do not have uid in the type; let backend infer when you're the challenger
      const opponentId = isChallenger
        ? undefined
        : selectedDisputeChallenge.challenger?.uid;
      const opponentUsername = isChallenger 
        ? selectedDisputeChallenge.opponents?.[0]?.username 
        : selectedDisputeChallenge.challenger?.username;

      if (!opponentId || !opponentUsername) {
        throw new Error('Unable to determine opponent information');
      }

      // Upload dispute images to backend (which persists to Firebase Storage)
      const proofImageUrls = await uploadDisputeImages(
        disputeProofImages,
        selectedDisputeChallenge.id,
        opponentId || '',
        opponentUsername,
        disputeReason
      );
      
      // If backend already created the dispute and returned URLs, we are done.
      // Otherwise, create dispute via service with returned URLs (idempotent safeguard)
      if (!proofImageUrls || !proofImageUrls.length) {
        await walletService.createDispute(
          selectedDisputeChallenge.id,
          opponentId || '',
          opponentUsername,
          disputeReason,
          []
        );
      }

      // Mark the challenge as disputed in local state
      setChallenges(prev => prev.map(challenge => 
        challenge.id === selectedDisputeChallenge.id 
          ? { ...challenge, disputed: true }
          : challenge
      ));

      alert('Dispute submitted successfully! An admin will review your case. If resolved in your favor, you will receive 95% of the total challenge amount.');
      closeDisputeModal();
      
    } catch (error: any) {
      console.error('Error submitting dispute:', error);
      
      // Handle specific error cases
      if (error.message && error.message.includes('already have an active dispute')) {
        alert('You already have an active dispute for this challenge. Please wait for admin review.');
        closeDisputeModal();
        
        // Mark the challenge as disputed in local state since it already exists
        setChallenges(prev => prev.map(challenge => 
          challenge.id === selectedDisputeChallenge.id 
            ? { ...challenge, disputed: true }
            : challenge
        ));
      } else {
        alert('Failed to submit dispute. Please try again.');
      }
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleScorecardSubmitted = (result: any) => {
    console.log('Scorecard submitted successfully:', result);
    // Refresh challenges to show updated status
    fetchChallenges();
    closeScorecardModal();
  };

  // AI verification modal handlers
  const openAIVerificationModal = (challenge: Challenge) => {
    setSelectedAIVerificationChallenge(challenge);
    setIsAIVerificationModalOpen(true);
  };

  const closeAIVerificationModal = () => {
    setIsAIVerificationModalOpen(false);
    setSelectedAIVerificationChallenge(null);
  };

  const handleAIVerificationComplete = (result: any) => {
    console.log('AI verification completed result:', result);
    // Refresh challenges to show updated status
    fetchChallenges();
    closeAIVerificationModal();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
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
            <CheckCircle className="h-3 w-3 mr-1" />
            AI Verified
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
            <Trophy className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/30">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="secondary" className="bg-red-20 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="secondary" className="bg-orange-20 text-orange-600 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50">
            <Clock className="h-3 w-3 mr-1" />
            Expired
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

  const formatTimeRemaining = (deadline: any) => {
    try {
      // Convert to Date object if it's not already
      let deadlineObj: Date;
      
      if (deadline instanceof Date) {
        deadlineObj = deadline;
      } else if (deadline && typeof deadline === 'object' && deadline.toDate) {
        // Handle Firestore Timestamp
        deadlineObj = deadline.toDate();
      } else if (deadline && typeof deadline === 'string') {
        // Handle string dates
        deadlineObj = new Date(deadline);
      } else if (deadline && typeof deadline === 'number') {
        // Handle timestamp numbers
        deadlineObj = new Date(deadline);
      } else {
        console.warn('Invalid deadline format:', deadline);
        return 'Invalid deadline';
      }
      
      // Check if date is valid
      if (isNaN(deadlineObj.getTime())) {
        console.warn('Invalid deadline value:', deadline);
        return 'Invalid deadline';
      }
      
      const now = new Date();
      const diff = deadlineObj.getTime() - now.getTime();
      
      if (diff <= 0) {
        return 'Expired';
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error('Error formatting deadline:', error, 'Deadline value:', deadline);
      return 'Invalid deadline';
    }
  };

  const formatTimeAgo = (date: any) => {
    try {
      // Convert to Date object if it's not already
      let dateObj: Date;
      
      if (date instanceof Date) {
        dateObj = date;
      } else if (date && typeof date === 'object' && date.toDate) {
        // Handle Firestore Timestamp
        dateObj = date.toDate();
      } else if (date && typeof date === 'string') {
        // Handle string dates
        dateObj = new Date(date);
      } else if (date && typeof date === 'number') {
        // Handle timestamp numbers
        dateObj = new Date(date);
      } else {
        console.warn('Invalid date format:', date);
        return 'Invalid date';
      }
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date value:', date);
        return 'Invalid date';
      }
      
      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (minutes < 60) {
        return `${minutes}m ago`;
      } else if (hours < 24) {
        return `${hours}h ago`;
      } else {
        return `${days}d ago`;
      }
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date);
      return 'Invalid date';
    }
  };

  // Enhanced winner detection using login username and platform usernames
  const didCurrentUserWin = (challenge: any): boolean => {
    try {
      if (!challenge || challenge.status !== 'completed') return false;
      const currentUsername = (user?.username || '').toLowerCase().trim();
      if (!currentUsername) return false;

      const winner = challenge?.winner || '';
      const winnerLower = winner.toLowerCase().trim();
      
      console.log('🔍 Winner check:', {
        currentUsername,
        winnerLower,
        challengeWinner: challenge?.winner,
        challengePlatform: challenge?.platform,
        challengeStatus: challenge?.status,
        fullChallenge: challenge
      });

      // 1. Direct match with login username
      if (winnerLower === currentUsername) {
        console.log('  - Direct login username match');
        return true;
      }

      // 2. Check if winner is a platform username that matches current user's platform usernames
      const currentUserPlatforms = (user as any)?.platforms || [];
      const challengePlatform = challenge?.platform?.toLowerCase();
      
      // Get current user's platform username for this challenge's platform
      const currentUserPlatformUsername = currentUserPlatforms.find((p: any) => 
        p.platform?.toLowerCase() === challengePlatform
      )?.onlineUserId?.toLowerCase().trim();
      
      if (currentUserPlatformUsername && winnerLower === currentUserPlatformUsername) {
        console.log('  - Platform username match:', currentUserPlatformUsername);
        return true;
      }

      // 3. Check challenger platform usernames
      if (challenge?.challenger?.username === currentUsername) {
        const challengerPlatformUsernames = challenge?.challengerPlatformUsernames || {};
        const challengerPlatformUsername = challengerPlatformUsernames[challengePlatform]?.toLowerCase().trim();
        
        if (challengerPlatformUsername && winnerLower === challengerPlatformUsername) {
          console.log('  - Challenger platform username match:', challengerPlatformUsername);
          return true;
        }
      }

      // 4. Check opponent platform usernames
      const currentUserOpponent = challenge?.opponents?.find((opp: any) => 
        opp.username === currentUsername
      );
      
      if (currentUserOpponent) {
        const opponentPlatformUsernames = currentUserOpponent?.accepterPlatformUsernames || {};
        const opponentPlatformUsername = opponentPlatformUsernames[challengePlatform]?.toLowerCase().trim();
        
        if (opponentPlatformUsername && winnerLower === opponentPlatformUsername) {
          console.log('  - Opponent platform username match:', opponentPlatformUsername);
          return true;
        }
      }

      console.log('  - No match found');
      return false;
    } catch (error) {
      console.error('Error in didCurrentUserWin:', error);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1">
          <Navbar 
            onMenuClick={() => setSidebarOpen(true)} 
            walletBalance={walletBalance}
            onWalletUpdate={setWalletBalance}
          />
          
          <main className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header Section */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-bold bg-gradient-gaming bg-clip-text text-transparent">
                Challenges For Me
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-inter">
                Review and respond to challenges from other players
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-neon-orange transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-inter font-medium text-muted-foreground">
                    Pending Challenges
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-warning/10">
                    <AlertCircle className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-warning" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold mb-1">
                    {challenges.filter(c => c.status === 'pending').length}
                  </div>
                  <p className="text-xs sm:text-sm text-warning font-inter">
                    Awaiting response
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-neon-cyan transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-inter font-medium text-muted-foreground">
                    Total Wager Value
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-success/10">
                    <DollarSign className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-success" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold mb-1">
                    ${challenges.reduce((sum, c) => sum + c.stake, 0).toFixed(2)}
                  </div>
                  <p className="text-xs sm:text-sm text-success font-inter">
                    Potential earnings
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-neon-green transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-inter font-medium text-muted-foreground">
                    Games Challenged
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                    <Gamepad2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold mb-1">
                    {new Set(challenges.map(c => c.game)).size}
                  </div>
                  <p className="text-xs sm:text-sm text-primary font-inter">
                    Different games
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-neon-purple transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-inter font-medium text-muted-foreground">
                    Active Players
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-accent/10">
                    <Users className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-accent" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold mb-1">
                    {new Set(challenges.map(c => c.challenger.uid)).size}
                  </div>
                  <p className="text-xs sm:text-sm text-accent font-inter">
                    Unique challengers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Challenges Table */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="font-orbitron text-base sm:text-lg">Received Challenges</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Review and respond to challenges from other players
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                        <TableHead className="font-orbitron font-semibold text-xs">Challenger</TableHead>
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Game</TableHead>
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Wager</TableHead>
                        
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Status</TableHead>
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Result</TableHead>
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-muted-foreground text-sm">Loading challenges...</p>
                          </TableCell>
                        </TableRow>
                      ) : challenges.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground text-sm">No challenges received yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Other players can challenge you from the Lobby</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        challenges.map((challenge) => (
                          <TableRow key={challenge.id} className="hover:bg-secondary/10 transition-colors duration-200">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={challenge.challenger.profilePicture} alt={challenge.challenger.username} />
                                  <AvatarFallback className="bg-gradient-gaming text-primary-foreground font-orbitron text-xs">
                                    {challenge.challenger.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-orbitron font-semibold text-xs text-foreground">
                                    {challenge.challenger.username}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatTimeAgo(challenge.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="space-y-1">
                                <Badge variant="secondary" className="text-xs">
                                  {challenge.game}
                                </Badge>
                                {challenge.label && (
                                  <div className="text-xs text-muted-foreground">
                                    {challenge.label}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-orbitron font-bold text-xs text-success">
                                ${challenge.stake.toFixed(2)}
                              </span>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              {getStatusBadge(challenge.status)}
                            </TableCell>
                            <TableCell className="text-center">
                              {/* Result column */}
                              {challenge.status === 'completed' ? (
                                didCurrentUserWin(challenge) ? (
                                  <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                                    Win
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive border-destructive/30">
                                    Lost
                                  </Badge>
                                )
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-muted/20 text-muted-foreground border-muted/30">
                                  -
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                {/* Claim Dispute shown first to avoid being hidden in overflow */}
                                {challenge.status === 'completed' && !didCurrentUserWin(challenge) && !(challenge as any).disputeResolved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDisputeModal(challenge)}
                                    disabled={Boolean(challenge.disputed)}
                                    className={`font-orbitron font-bold text-xs ${challenge.disputed ? 'border-gray-300 text-gray-500 cursor-not-allowed opacity-50' : 'border-orange-300 text-orange-700 hover:bg-orange-50'}`}
                                    title={challenge.disputed ? 'Dispute already submitted - awaiting admin review' : 'Submit a dispute for admin review'}
                                  >
                                    <Flag className="h-3 w-3 mr-1" />
                                    Claim Dispute
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => openChallengeDetailsModal(challenge)}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-orange"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                
                                {/* Show Accept/Decline only for pending challenges */}
                                {challenge.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => openChallengeAcceptanceModal(challenge)}
                                      className="bg-success hover:bg-success/90 text-success-foreground font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-green"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeclineChallenge(challenge.id)}
                                      className="font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-red"
                                    >
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Decline
                                    </Button>
                                  </>
                                )}
                                
                                {/* Show Submit Scorecard for challenges where YOU have accepted AND challenge is active or scorecard-pending */}
                                {/* Only show for: active, scorecard-pending statuses */}
                                {/* Hide for: completed, ai-verified, verifying, proof-submitted, scorecard-conflict statuses */}
                                {challenge.opponents && 
                                 challenge.opponents.some(opp => opp.username === user?.username && opp.status === 'accepted') &&
                                 ['active', 'scorecard-pending'].includes(challenge.status) && (
                                  <Button
                                    size="sm"
                                    onClick={() => openScorecardModal(challenge)}
                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-orange"
                                  >
                                    <Trophy className="h-3 w-3 mr-1" />
                                    Submit Scorecard
                                  </Button>
                                )}
                                
                                {/* Show status info for accepted challenges that are not yet active */}
                                {challenge.status === 'accepted' && (
                                  <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                                    Challenge Accepted
                                  </Badge>
                                )}

                                {/* Show Ready button for ready-pending challenges */}
                                {challenge.status === 'ready-pending' && (
                                  <div className="space-y-2">
                                    <Badge variant="secondary" className="text-xs bg-warning/20 text-warning border-warning/30">
                                      Mark Ready to Start
                                    </Badge>
                                    <Button
                                      size="sm"
                                      onClick={() => handleMarkReady(challenge.id)}
                                      className="font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-green"
                                    >
                                      <Play className="h-3 w-3 mr-1" />
                                      Mark Ready
                                    </Button>
                                  </div>
                                )}

                                {/* Show status info for active challenges where you haven't accepted yet */}
                                {challenge.status === 'active' && challenge.opponents && 
                                 !challenge.opponents.some(opp => opp.username === user?.username && opp.status === 'accepted') && (
                                  <Badge variant="secondary" className="text-xs bg-warning/20 text-warning border-warning/30">
                                    Accept Challenge to Claim Reward
                                  </Badge>
                                )}

                                {/* Show status info for scorecard-pending challenges */}
                                {challenge.status === 'scorecard-pending' && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-center space-x-2">
                                      <Badge variant="secondary" className="text-xs bg-warning/20 text-warning border-warning/30">
                                        Waiting for Scorecard
                                      </Badge>
                                    </div>
                                    <div className="flex justify-center">
                                      <ScorecardTimer 
                                        challengeId={challenge.id}
                                        onTimerExpired={() => fetchChallenges()}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Show status info for scorecard-conflict challenges */}
                                {challenge.status === 'scorecard-conflict' && (
                                  <div className="space-y-2">
                                    <Badge variant="secondary" className="text-xs bg-orange-20 text-orange-600 border-orange-300">
                                      Scorecard Conflict
                                    </Badge>
                                    <Button
                                      size="sm"
                                      onClick={() => openAIVerificationModal(challenge)}
                                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-orbitron font-bold text-xs transition-all duration-300"
                                    >
                                      <Trophy className="h-3 w-3 mr-1" />
                                      Claim using AI
                                    </Button>
                                  </div>
                                )}

                                {/* Show status info for ai-verification-pending challenges */}
                                {challenge.status === 'ai-verification-pending' && (
                                  <div className="space-y-2">
                                    <Badge variant="secondary" className="text-xs bg-purple-20 text-purple-600 border-purple-300">
                                      Waiting for AI Verification
                                    </Badge>
                                    <div className="flex justify-center">
                                      <AiVerificationTimer 
                                        challengeId={challenge.id}
                                        onTimerExpired={() => fetchChallenges()}
                                      />
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => openAIVerificationModal(challenge)}
                                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-orbitron font-bold text-xs transition-all duration-300"
                                    >
                                      <Trophy className="h-3 w-3 mr-1" />
                                      Upload AI Proof
                                    </Button>
                                  </div>
                                )}

                                {/* Show status info for AI conflict challenges */}
                                {challenge.status === 'ai-conflict' && (
                                  <div className="space-y-2">
                                    <Badge variant="secondary" className="text-xs bg-red-20 text-red-600 border-red-300">
                                      AI Conflict - Admin Review
                                    </Badge>
                                    <div className="text-xs text-muted-foreground text-center">
                                      Credits held until admin resolution
                                    </div>
                                  </div>
                                )}

                                {/* Show status info for proof-submitted challenges */}
                                {challenge.status === 'proof-submitted' && (
                                  <Badge variant="secondary" className="text-xs bg-info/20 text-info border-info/30">
                                    Proof Submitted
                                  </Badge>
                                )}

                                {/* Show status info for other completed statuses */}
                                {['verifying', 'ai-verified', 'completed'].includes(challenge.status) && (
                                  <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                                    {challenge.status === 'verifying' ? 'Verifying' : 
                                     challenge.status === 'ai-verified' ? 'AI Verified' : 'Completed'}
                                  </Badge>
                                )}

                                {/* Show dispute status if challenge has been disputed */}
                                {challenge.disputed && (
                                  <div className="text-center space-y-1">
                                    <Badge variant="secondary" className="text-xs bg-orange-20 text-orange-600 border-orange-300">
                                      Dispute Submitted
                                    </Badge>
                                    <div className="text-xs text-orange-600">
                                      Awaiting admin review
                                    </div>
                                    <div className="text-xs text-blue-600 cursor-pointer hover:underline" 
                                         onClick={() => showExistingDisputeInfo(challenge)}>
                                      View details
                                    </div>
                                  </div>
                                )}

                                {/* Show winner info for completed challenges */}
                                {challenge.status === 'completed' && challenge.winner && (
                                  <div className="text-xs text-center">
                                    <div className="font-semibold text-primary mb-1">Winner</div>
                                    <div className="text-success font-bold">{challenge.winner}</div>
                                  </div>
                                )}

                                
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
      
      {/* Challenge Details Modal */}
      {selectedChallenge && (
        <ChallengeDetailsModal
          isOpen={isChallengeDetailsModalOpen}
          onClose={closeChallengeDetailsModal}
          challenge={selectedChallenge}
        />
      )}

      {/* Challenge Acceptance Modal */}
      {selectedAcceptanceChallenge && (
        <ChallengeAcceptanceModal
          isOpen={isChallengeAcceptanceModalOpen}
          onClose={closeChallengeAcceptanceModal}
          challenge={selectedAcceptanceChallenge}
          onAccept={handleAcceptChallenge}
          onDecline={handleDeclineChallenge}
        />
      )}

      {/* Scorecard Modal */}
      {selectedScorecardChallenge && (
        <ScorecardModal
          isOpen={isScorecardModalOpen}
          onClose={closeScorecardModal}
          challenge={selectedScorecardChallenge}
          onScorecardSubmitted={handleScorecardSubmitted}
        />
      )}

      {/* AI Verification Modal */}
      {selectedAIVerificationChallenge && (
        <AIVerificationModal
          isOpen={isAIVerificationModalOpen}
          onClose={closeAIVerificationModal}
          challenge={selectedAIVerificationChallenge}
          onVerificationComplete={handleAIVerificationComplete}
        />
      )}

      {/* Dispute Modal */}
      {isDisputeModalOpen && selectedDisputeChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4 border border-border">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                  <Flag className="h-5 w-5 text-orange-500" />
                  Call for Dispute
                </h3>
                <p className="text-sm text-muted-foreground">
                  You're disputing the result of: <strong>{selectedDisputeChallenge.game}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  If your dispute is resolved in your favor, you will receive <strong>95% of the total challenge amount</strong> (${(selectedDisputeChallenge.stake * 1.9).toFixed(2)}).
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                  <p className="text-xs text-orange-700">
                    <strong>Note:</strong> Disputes are reviewed by admins. The process may take 24-48 hours. 
                    If resolved in your favor, the full reward will be transferred to your wallet.
                    <br /><br />
                    <strong>Important:</strong> You can only submit one dispute per challenge.
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Dispute Reason *</label>
                <textarea
                  placeholder="Explain why you believe the AI result was incorrect..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="mt-1 w-full p-3 border border-border rounded-md bg-background text-foreground resize-none"
                  rows={4}
                  disabled={isSubmittingDispute}
                />
              </div>

              {/* Proof Images Upload */}
              <div>
                <label className="text-sm font-medium">Proof Images (Optional)</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Upload images that support your dispute claim
                </p>
                
                {/* Display uploaded images */}
                {disputeProofImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {disputeProofImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Proof ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-5 w-5 p-0"
                          onClick={() => removeDisputeImage(index)}
                          disabled={isSubmittingDispute}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload button */}
                <Button
                  variant="outline"
                  onClick={() => disputeFileInputRef.current?.click()}
                  className="w-full"
                  disabled={isSubmittingDispute}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {disputeProofImages.length === 0 ? 'Upload Proof Images' : 'Add More Images'}
                </Button>
                
                <input
                  ref={disputeFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleDisputeImageUpload}
                  className="hidden"
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeDisputeModal}
                  className="flex-1"
                  disabled={isSubmittingDispute}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitDispute}
                  disabled={isSubmittingDispute || !disputeReason.trim()}
                  variant="destructive"
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isSubmittingDispute ? (
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
        </div>
      )}
    </div>
  );
}
