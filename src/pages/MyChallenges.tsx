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
  X,
  AlertCircle,
  Users,
  Gamepad2,
  DollarSign,
  Eye,
  Upload,
  Calendar,
  Trophy,
  Flag
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { challengeService } from '../services/challengeService';
import { walletService } from '../services/walletService';
import { ChallengeDetailsModal } from '@/components/ui/challenge-details-modal';
import { NewChallengeModal } from '@/components/ui/new-challenge-modal';
import { Challenge } from '@/services/challengeService';
import { useToast } from '@/hooks/use-toast';
import { ProofUploadModal } from '@/components/ui/proof-upload-modal';

export default function MyChallenges() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  // Challenge details modal state
  const [isChallengeDetailsModalOpen, setIsChallengeDetailsModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  
  // New challenge modal state
  const [isNewChallengeModalOpen, setIsNewChallengeModalOpen] = useState(false);
  
  // Proof upload modal state
  const [isProofUploadModalOpen, setIsProofUploadModalOpen] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Dispute modal state (match ChallengesForMe)
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeChallenge, setSelectedDisputeChallenge] = useState<Challenge | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [disputeProofImages, setDisputeProofImages] = useState<File[]>([]);
  const disputeFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch challenges from API
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

    const fetchChallenges = async () => {
      try {
        setIsLoading(true);
        const fetchedChallenges = await challengeService.getMyChallenges();
        // Augment with dispute status
        const challengesWithDisputes = await Promise.all(
          fetchedChallenges.map(async (challenge) => {
            try {
              const existingDispute = await walletService.hasActiveDispute(challenge.id);
              return { ...challenge, disputed: existingDispute } as any;
            } catch (e) {
              return { ...challenge, disputed: false } as any;
            }
          })
        );
        setChallenges(challengesWithDisputes);
        setFilteredChallenges(challengesWithDisputes);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        toast({
          title: "Error",
          description: "Failed to fetch challenges. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, [toast]);

  // Filter challenges based on selected filter and search term
  useEffect(() => {
    let filtered = challenges;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(challenge => challenge.status === selectedFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(challenge => 
        challenge.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.opponents.some(opp => opp.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        challenge.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredChallenges(filtered);
  }, [challenges, selectedFilter, searchTerm]);

  const openChallengeDetailsModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsChallengeDetailsModalOpen(true);
  };

  const closeChallengeDetailsModal = () => {
    setIsChallengeDetailsModalOpen(false);
    setSelectedChallenge(null);
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(challengeId);
      await challengeService.deleteChallenge(challengeId);
      
      // Remove from local state
      setChallenges(prev => prev.filter(c => c.id !== challengeId));
      setFilteredChallenges(prev => prev.filter(c => c.id !== challengeId));
      
      toast({
        title: "Success",
        description: "Challenge deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast({
        title: "Error",
        description: "Failed to delete challenge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleCreateChallenge = async (challengeData: any) => {
    try {
      setIsLoading(true);
      const newChallenge = await challengeService.createChallenge(challengeData);
      setChallenges(prev => [newChallenge, ...prev]);
      setIsNewChallengeModalOpen(false);
      toast({
        title: "Success",
        description: "Challenge created successfully!",
        variant: "default"
      });
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Dispute handlers (same UX as ChallengesForMe)
  const openDisputeModal = (challenge: Challenge) => {
    if ((challenge as any).disputed || (challenge as any).disputeResolved) {
      toast({ title: 'Dispute Already Submitted', description: 'This challenge already has an active dispute under review.' });
      return;
    }
    setSelectedDisputeChallenge(challenge);
    setIsDisputeModalOpen(true);
    setDisputeReason('');
    setDisputeProofImages([]);
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
    if (imageFiles.length > 0) setDisputeProofImages(prev => [...prev, ...imageFiles]);
  };

  const removeDisputeImage = (index: number) => {
    setDisputeProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDisputeImages = async (
    images: File[],
    challengeId: string,
    opponentUsername: string,
    reason: string
  ): Promise<string[]> => {
    if (!images.length) return [];
    const formData = new FormData();
    images.forEach(image => formData.append('evidenceFiles', image));
    formData.append('challengeId', challengeId);
    formData.append('opponentUsername', opponentUsername);
    formData.append('disputeReason', reason);
    const token = localStorage.getItem('authToken') || '';
    const res = await fetch('http://localhost:5072/api/wallet/dispute', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    if (!res.ok) throw new Error('Failed to upload dispute images');
    const json = await res.json();
    const urls = (json?.data?.evidence || []) as string[];
    return urls;
  };

  // Challenge response handlers
  const handleAcceptChallenge = async (challengeId: string, myTeam?: string, accepterPlatformUsernames?: { [platform: string]: string }) => {
    try {
      await challengeService.respondToChallenge(challengeId, 'accept', myTeam, accepterPlatformUsernames);
      // Refresh challenges to show updated status
      const fetchedChallenges = await challengeService.getMyChallenges();
      setChallenges(fetchedChallenges);
      toast({
        title: "Challenge Accepted! 🎉",
        description: "You've successfully accepted the challenge. Good luck!",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error accepting challenge:', error);
      
      // Check if it's an insufficient funds error
      if (error.message && error.message.includes('Insufficient funds')) {
        toast({
          title: "Insufficient Funds 💸",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Generic error toast
        toast({
          title: "Error Accepting Challenge ❌",
          description: error.message || "Failed to accept challenge. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      await challengeService.respondToChallenge(challengeId, 'decline');
      // Refresh challenges to show updated status
      const fetchedChallenges = await challengeService.getMyChallenges();
      setChallenges(fetchedChallenges);
      toast({
        title: "Challenge Declined ❌",
        description: "You've declined the challenge.",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error declining challenge:', error);
      toast({
        title: "Error Declining Challenge ❌",
        description: error.message || "Failed to decline challenge. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Claim dispute for completed-lost challenges
  const handleClaimDispute = (challenge: any) => {
    openDisputeModal(challenge);
  };

  const handleSubmitDispute = async () => {
    if (!selectedDisputeChallenge || !disputeReason.trim()) {
      alert('Please provide a reason for the dispute');
      return;
    }
    try {
      setIsSubmittingDispute(true);
      // As challenger, pick an opponent username (prefer accepted)
      const accepted = selectedDisputeChallenge.opponents?.find(o => o.status === 'accepted');
      const opponentUsername = accepted?.username || selectedDisputeChallenge.opponents?.[0]?.username || '';
      // Upload images via backend (persists to Firebase Storage)
      await uploadDisputeImages(
        disputeProofImages,
        selectedDisputeChallenge.id,
        opponentUsername,
        disputeReason
      );
      // Mark locally as disputed
      setChallenges(prev => prev.map(c => c.id === selectedDisputeChallenge.id ? { ...c, disputed: true } as any : c));
      setFilteredChallenges(prev => prev.map(c => c.id === selectedDisputeChallenge.id ? { ...c, disputed: true } as any : c));
      toast({ title: 'Dispute Submitted', description: 'Your dispute has been submitted for review.' });
      closeDisputeModal();
    } catch (error: any) {
      toast({ title: 'Failed to Submit Dispute', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // Proof upload modal handlers
  const openProofUploadModal = (challenge: Challenge) => {
    console.log('🔍 MyChallenges: Opening proof upload modal with challenge:', challenge);
    setSelectedChallenge(challenge);
    setIsProofUploadModalOpen(true);
  };

  const closeProofUploadModal = () => {
    setIsProofUploadModalOpen(false);
    setSelectedChallenge(null);
  };

  const handleProofSubmitted = (result: any) => {
    console.log('Proof submitted successfully:', result);
    closeProofUploadModal();
    // Refresh challenges to show updated status
    const fetchChallenges = async () => {
      try {
        const fetchedChallenges = await challengeService.getMyChallenges();
        setChallenges(fetchedChallenges);
      } catch (error) {
        console.error('Error refreshing challenges:', error);
      }
    };
    fetchChallenges();
  };

  // Robust winner detection using platform usernames and AI result
  const didCurrentUserWin = (challenge: any): boolean => {
    try {
      if (!challenge || challenge.status !== 'completed') return false;
      const currentUsername = (user?.username || '').toLowerCase().trim();
      if (!currentUsername) return false;

      // 1) Direct winner match against login username
      const winnerLower = (challenge?.winner || '').toLowerCase().trim();
      if (winnerLower && winnerLower === currentUsername) return true;

      // 2) Do NOT trust stored aiResult.iWin (it is relative to whoever submitted proof)

      // 3) Compare AI/challenge winner against ALL of the user's platform usernames
      const aiWinnerLower = (challenge?.aiResult?.winner || challenge?.winner || '').toLowerCase().trim();
      if (!aiWinnerLower) return false;

      const candidateUsernames: string[] = [];

      // a) From challenge payload (challenger or opponent stored usernames)
      if (challenge?.challenger?.username === user?.username) {
        const map = challenge?.challengerPlatformUsernames || {};
        Object.values(map).forEach((val: any) => {
          if (val && typeof val === 'string') candidateUsernames.push(val.toLowerCase().trim());
        });
      } else {
        const meOpp = Array.isArray(challenge?.opponents)
          ? challenge.opponents.find((o: any) => o?.username === user?.username)
          : null;
        const maps = [meOpp?.accepterPlatformUsernames, meOpp?.platformUsernames];
        maps.forEach((m: any) => {
          if (m && typeof m === 'object') {
            Object.values(m).forEach((val: any) => {
              if (val && typeof val === 'string') candidateUsernames.push(val.toLowerCase().trim());
            });
          }
        });
      }

      // b) From logged-in profile as fallback (if not present on challenge doc yet)
      const profilePlatforms = (user as any)?.platforms || [];
      if (Array.isArray(profilePlatforms)) {
        profilePlatforms.forEach((p: any) => {
          const idVal = (p?.onlineUserId || '').toString().toLowerCase().trim();
          if (idVal) candidateUsernames.push(idVal);
        });
      }

      const uniqueCandidates = Array.from(new Set(candidateUsernames.filter(Boolean)));
      if (uniqueCandidates.length === 0) return false;

      // 4) Fuzzy comparison ONLY between AI/challenge winner and user's platform IDs
      const isMatch = uniqueCandidates.some((u) => aiWinnerLower.includes(u) || u.includes(aiWinnerLower));
      return isMatch;
    } catch {
      return false;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string } } = {
      'pending': { label: 'Pending', variant: 'outline', className: 'border-warning/50 text-warning' },
      'in-progress': { label: 'In Progress', variant: 'secondary', className: 'bg-accent/20 text-accent' },
      'awaiting-proof': { label: 'Awaiting Proof', variant: 'secondary', className: 'bg-warning/20 text-warning' },
      'needs-proof': { label: 'Needs Proof', variant: 'destructive', className: 'bg-destructive/20 text-destructive' },
      'proof-submitted': { label: 'Proof Submitted', variant: 'secondary', className: 'bg-info/20 text-info' },
      'verifying': { label: 'Verifying', variant: 'secondary', className: 'bg-warning/20 text-warning' },
      'ai-verified': { label: 'AI Verified', variant: 'default', className: 'bg-success/20 text-success' },
      'completed': { label: 'Completed', variant: 'default', className: 'bg-success/20 text-success' },
      'cancelled': { label: 'Cancelled', variant: 'destructive', className: 'bg-red-20 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50' },
      'expired': { label: 'Expired', variant: 'outline', className: 'border-orange-500/50 text-orange-600 dark:text-orange-400' },
      'declined': { label: 'Declined', variant: 'destructive', className: 'bg-red-20 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50' },
    };

    const config = statusConfig[status] || { label: status, variant: 'secondary', className: '' };

    return (
      <Badge variant={config.variant} className={`text-xs ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Trophy className="h-4 w-4 text-success" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-accent" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'needs-proof':
        return <Upload className="h-4 w-4 text-destructive" />;
      case 'proof-submitted':
        return <Upload className="h-4 w-4 text-info" />;
      case 'verifying':
        return <CheckCircle className="h-4 w-4 text-warning" />;
      case 'ai-verified':
        return <Gamepad2 className="h-4 w-4 text-success" />; // Changed from Bot to Gamepad2
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1">
          <Navbar onMenuClick={() => setSidebarOpen(true)} walletBalance={walletBalance} />
          
          <main className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-bold bg-gradient-gaming bg-clip-text text-transparent">
                  My Challenges
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground font-inter">
                  Track your active challenges and results
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="hover:bg-secondary/80 text-xs sm:text-sm px-3 sm:px-4 py-2"
                >
                  {/* <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> */}
                  Filter
                </Button>
                <Button
                  onClick={() => setIsNewChallengeModalOpen(true)}
                  className="bg-gradient-gaming hover:shadow-neon-orange transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4 py-2"
                >
                  {/* <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> */}
                  New Challenge
                </Button>
              </div>
            </div>

            {/* Challenges Table */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="font-orbitron text-base sm:text-lg">My Challenges</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Challenges you created and sent to other players
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                        <TableHead className="font-orbitron font-semibold text-xs">Challenge</TableHead>
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Opponents</TableHead>
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Game</TableHead>
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Stake</TableHead>
                        
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Status</TableHead>
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Result</TableHead>
                        <TableHead className="font-orbitron font-semibold text-xs text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                            <p className="text-muted-foreground text-sm">Loading challenges...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredChallenges.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground text-sm">No challenges yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Start by creating your first challenge!</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredChallenges.map((challenge) => (
                          <TableRow key={challenge.id} className="hover:bg-secondary/10 transition-colors duration-200">
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-orbitron font-semibold text-xs text-foreground">
                                    {challenge.label || `${challenge.game} Challenge`}
                                  </h3>
                                  <Badge 
                                    variant={challenge.type === 'outgoing' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {challenge.type === 'outgoing' ? 'Outgoing' : 'Incoming'}
                                  </Badge>
                                </div>
                                {challenge.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {challenge.description}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="space-y-1">
                                {challenge.opponents.map((opp, index) => (
                                  <div key={index} className="flex items-center justify-center gap-1">
                                    <Avatar className="w-5 h-5">
                                      <AvatarFallback className="bg-gradient-gaming text-primary-foreground font-orbitron text-xs">
                                        {opp.username.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium text-foreground">
                                      {opp.username}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="space-y-1">
                                <Badge variant="secondary" className="text-xs">
                                  {challenge.game}
                                </Badge>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {challenge.platform}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-orbitron font-bold text-xs text-success">
                                ${challenge.stake}
                              </span>
                            </TableCell>
                            
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {getStatusIcon(challenge.status)}
                                {getStatusBadge(challenge.status)}
                                {challenge.status === 'completed' && !didCurrentUserWin(challenge) && (
                                  <Badge variant="secondary" className="text-xs bg-destructive/20 text-destructive border-destructive/30 ml-2">
                                    Lost
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {/* Result column */}
                              <div className="flex items-center justify-center gap-1">
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
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openChallengeDetailsModal(challenge)}
                                  className="h-6 w-6 p-0 hover:bg-secondary/80"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                
                                {/* For Incoming challenges (you received) */}
                                {challenge.type === 'incoming' && (
                                  <>
                                    {/* Show Accept/Decline for pending incoming challenges */}
                                    {challenge.status === 'pending' && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleAcceptChallenge(challenge.id)}
                                          className="h-6 px-2 text-xs bg-success hover:bg-success/90"
                                        >
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Accept
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleDeclineChallenge(challenge.id)}
                                          className="h-6 px-2 text-xs"
                                        >
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Decline
                                        </Button>
                                      </>
                                    )}
                                    
                                    {/* Show Claim Reward for active incoming challenges where YOU have accepted */}
                                    {challenge.status === 'active' && challenge.type === 'incoming' && 
                                     challenge.opponents.some(opp => opp.username === user?.username && opp.status === 'accepted') && (
                                      <Button
                                        size="sm"
                                        onClick={() => openProofUploadModal(challenge)}
                                        className="h-6 px-2 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                                      >
                                        <Trophy className="h-3 w-3 mr-1" />
                                        Claim Reward
                                      </Button>
                                    )}
                                    
                                    {/* Show status for accepted incoming challenges */}
                                    {challenge.status === 'pending' && challenge.opponents && 
                                     challenge.opponents.some(opp => opp.username === user?.username && opp.status === 'accepted') && (
                                      <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                                        Accepted
                                      </Badge>
                                    )}
                                  </>
                                )}
                                
                                {/* For Outgoing challenges (you created) */}
                                {challenge.type === 'outgoing' && (
                                  <>
                                    {/* Show opponent status */}
                                    {challenge.opponents && challenge.opponents.length > 0 && (
                                      <div className="text-xs text-muted-foreground">
                                        {challenge.opponents.some(opp => opp.status === 'accepted') ? (
                                          <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
                                            Opponent Accepted
                                          </Badge>
                                        ) : (
                                          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">
                                            Waiting
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Show Claim Reward for outgoing challenges where ANY opponent accepted (you're the challenger) */}
                                    {challenge.status === 'active' && challenge.opponents && 
                                     challenge.opponents.some(opp => opp.status === 'accepted') && (
                                      <Button
                                        size="sm"
                                        onClick={() => openProofUploadModal(challenge)}
                                        className="h-6 px-2 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                                      >
                                        <Trophy className="h-3 w-3 mr-1" />
                                        Claim Reward
                                      </Button>
                                    )}

                                    {/* Show status info for active outgoing challenges where no opponents accepted yet */}
                                    {challenge.status === 'active' && challenge.opponents && 
                                     !challenge.opponents.some(opp => opp.status === 'accepted') && (
                                      <Badge variant="secondary" className="text-xs bg-warning/20 text-warning border-warning/30">
                                        Waiting for Opponent to Accept
                                      </Badge>
                                    )}
                                  </>
                                )}
                                
                                {/* Claim Dispute for completed challenges */}
                                {challenge.status === 'completed' && !didCurrentUserWin(challenge) && !(challenge as any).disputeResolved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleClaimDispute(challenge)}
                                    disabled={Boolean((challenge as any).disputed)}
                                    className={`h-6 px-2 text-xs ${ (challenge as any).disputed ? 'border-gray-300 text-gray-500 cursor-not-allowed opacity-50' : 'border-orange-300 text-orange-700 hover:bg-orange-50' }`}
                                    title={(challenge as any).disputed
                                      ? 'Dispute already submitted - awaiting review'
                                      : 'Submit a dispute for admin review'}
                                  >
                                    <Flag className="h-3 w-3 mr-1" />
                                    Claim Dispute
                                  </Button>
                                )}

                                {/* Legacy proof buttons - keeping for now but they're disabled */}
                                {challenge.status === 'needs-proof' && (
                                  <Button
                                    size="sm"
                                    onClick={() => {/* Proof functionality removed - not appropriate for MyChallenges */}}
                                    className="h-6 px-2 text-xs bg-primary hover:bg-primary/90"
                                    disabled
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Proof
                                  </Button>
                                )}
                                {challenge.status === 'proof-submitted' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {/* View proof status */}}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Status
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteChallenge(challenge.id)}
                                  className="h-6 px-2 text-xs text-destructive"
                                  disabled={isDeleting === challenge.id}
                                >
                                  {isDeleting === challenge.id ? (
                                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                </Button>
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

      {/* Proof Upload Modal */}
      {selectedChallenge && (
        <ProofUploadModal
          isOpen={isProofUploadModalOpen}
          onClose={closeProofUploadModal}
          challenge={selectedChallenge}
          onProofSubmitted={handleProofSubmitted}
        />
      )}
      
      {/* New Challenge Modal */}
      <NewChallengeModal
        isOpen={isNewChallengeModalOpen}
        onClose={() => setIsNewChallengeModalOpen(false)}
        onCreateChallenge={handleCreateChallenge}
      />

      {/* Challenge Details Modal */}
      <ChallengeDetailsModal
        isOpen={isChallengeDetailsModalOpen}
        onClose={closeChallengeDetailsModal}
        challenge={selectedChallenge}
      />

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
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                  <p className="text-xs text-orange-700">
                    Provide a clear reason and attach any images supporting your claim.
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

// Dispute modal (same as in ChallengesForMe)
// Render after main component return