import { useState, useEffect } from 'react';
import { walletService } from '@/services/walletService';
import { realtimeDbService } from '@/services/realtimeDb';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiService } from '../services/api';
import { challengeService } from '../services/challengeService';
import { ChallengeDetailsModal } from '@/components/ui/challenge-details-modal';
import { ProofUploadModal } from '@/components/ui/proof-upload-modal';
import { Challenge } from '@/services/challengeService';
import { NewChallengeModal } from '@/components/ui/new-challenge-modal';
import { 
  DollarSign, 
  Users, 
  Gamepad2, 
  Clock,
  Calendar,
  DollarSign as DollarSignIcon,
  Sword,
  AlertCircle,
  Target,
  Eye,
  XCircle,
  Trophy,
  CheckCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeAgo } from '../utils/timeUtils';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const { user } = useAuth();
  const [lobbyUsers, setLobbyUsers] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [challengesForMe, setChallengesForMe] = useState<any[]>([]);
  const [loadingChallengesForMe, setLoadingChallengesForMe] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch lobby users and online status
  useEffect(() => {
    // load real wallet balance
    (async () => {
      try {
        const balance = await walletService.getWalletBalance();
        setWalletBalance(balance);
      } catch (e) {
        console.error('Error loading wallet balance:', e);
      }
    })();

    const fetchData = async () => {
      try {
        setLoading(true);
        const users = await apiService.getUsers();
        setLobbyUsers(users.filter((u: any) => !u.isAdmin && u.username?.toLowerCase() !== 'admin' && u.role !== 'admin'));
      } catch (error) {
        console.error('Error fetching lobby users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Listen to real-time online users
  useEffect(() => {
    // Start tracking current user's presence
    realtimeDbService.setUserOnline();
    // Subscribe to online users list for lastSeen updates
    const unsubscribe = realtimeDbService.listenToOnlineUsers((users) => {
      setOnlineUsers(users);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const recentActivity = [
    {
      type: 'win',
      opponent: 'ProGamer_X',
      amount: 50.00,
      game: 'Valorant',
      time: '2 hours ago',
    },
    {
      type: 'loss',
      opponent: 'SkillShot99',
      amount: 25.00,
      game: 'CS2',
      time: '1 day ago',
    },
    {
      type: 'win',
      opponent: 'NoobSlayer',
      amount: 75.00,
      game: 'Fortnite',
      time: '2 days ago',
    },
  ];

  // Transform Firestore users to display format (excluding current user)
  const displayLobbyUsers = lobbyUsers
    .filter(lobbyUser => lobbyUser.uid !== user?.uid)
    .slice(0, 5)
    .map(lobbyUser => ({
      id: lobbyUser.uid,
      username: lobbyUser.username,
      avatar: lobbyUser.profilePicture || '',
      rank: lobbyUser.rank,
      winRate: lobbyUser.winRate,
      totalGames: lobbyUser.totalGames,
      totalWins: Math.round((lobbyUser.winRate / 100) * lobbyUser.totalGames),
      totalLosses: lobbyUser.totalGames - Math.round((lobbyUser.winRate / 100) * lobbyUser.totalGames),
      currentStreak: lobbyUser.currentStreak,
      favoriteGame: lobbyUser.favoriteGame,
      status: onlineUsers.find(ou => ou.uid === lobbyUser.uid)?.isOnline ? 'online' : 'offline',
      lastActive: (() => {
        const ou = onlineUsers.find(ou => ou.uid === lobbyUser.uid);
        const ts = ou?.lastSeen || lobbyUser.lastActive;
        return formatTimeAgo(ts);
      })(),
    }));

  // Fetch public challenges from the service
  const [publicChallenges, setPublicChallenges] = useState<any[]>([]);
  
  // Fetch user's created challenges for "My Active Challenges" tab
  const [myCreatedChallenges, setMyCreatedChallenges] = useState<any[]>([]);
  const [loadingMyChallenges, setLoadingMyChallenges] = useState(false);
  
  // Challenge details modal state
  const [isChallengeDetailsModalOpen, setIsChallengeDetailsModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  
  // Proof upload modal state
  const [isProofUploadModalOpen, setIsProofUploadModalOpen] = useState(false);
  const [selectedProofChallenge, setSelectedProofChallenge] = useState<Challenge | null>(null);
  
  // New challenge modal state
  const [isNewChallengeModalOpen, setIsNewChallengeModalOpen] = useState(false);
  const [selectedUserForChallenge, setSelectedUserForChallenge] = useState<any>(null);

  useEffect(() => {
    const fetchPublicChallenges = async () => {
      try {
        setLoading(true);
        const challenges = await challengeService.getPublicChallenges();
        setPublicChallenges(challenges);
      } catch (error) {
        console.error('Error fetching public challenges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicChallenges();
    const interval = setInterval(fetchPublicChallenges, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchChallengesForMe = async () => {
      try {
        setLoadingChallengesForMe(true);
        console.log('🔍 Dashboard: Fetching challenges for user:', user?.username);
        console.log('🔍 Dashboard: User UID:', user?.uid);
        
        const challenges = await challengeService.getChallengesForMe();
        console.log('✅ Dashboard: Challenges fetched:', challenges);
        console.log('✅ Dashboard: Number of challenges:', challenges.length);
        console.log('🔍 Dashboard: ChallengesForMe IDs:', challenges.map(c => c.id));
        console.log('🔍 Dashboard: ChallengesForMe with undefined IDs:', challenges.filter(c => !c.id));
        
        // Filter out challenges without IDs to prevent key issues
        const validChallenges = challenges.filter(c => c.id);
        console.log('✅ Dashboard: Valid challengesForMe (with IDs):', validChallenges.length);
        
        setChallengesForMe(validChallenges);
      } catch (error) {
        console.error('❌ Dashboard: Error fetching challenges for me:', error);
      } finally {
        setLoadingChallengesForMe(false);
      }
    };

    fetchChallengesForMe();
    const interval = setInterval(fetchChallengesForMe, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user?.uid]);

  // Fetch user's created challenges for "My Active Challenges" tab
  useEffect(() => {
    const fetchMyCreatedChallenges = async () => {
      if (!user?.uid) return;
      
      try {
        setLoadingMyChallenges(true);
        console.log('🔍 Dashboard: Fetching challenges created by user:', user?.username);
        
        const challenges = await challengeService.getMyChallenges();
        console.log('✅ Dashboard: User created challenges fetched:', challenges);
        console.log('🔍 Dashboard: Challenge IDs:', challenges.map(c => c.id));
        console.log('🔍 Dashboard: Challenges with undefined IDs:', challenges.filter(c => !c.id));
        
        // Filter out challenges without IDs to prevent key issues
        const validChallenges = challenges.filter(c => c.id);
        console.log('✅ Dashboard: Valid challenges (with IDs):', validChallenges.length);
        
        setMyCreatedChallenges(validChallenges);
      } catch (error) {
        console.error('❌ Dashboard: Error fetching user created challenges:', error);
        setMyCreatedChallenges([]);
      } finally {
        setLoadingMyChallenges(false);
      }
    };

    fetchMyCreatedChallenges();
    const interval = setInterval(fetchMyCreatedChallenges, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user?.uid]);


  // Challenge button handlers
  const handleChallengeUser = (user: any) => {
    console.log('Challenging user:', user.username);
    setSelectedUserForChallenge(user);
    setIsNewChallengeModalOpen(true);
  };

  // Join a public challenge
  const handleJoinChallenge = async (challenge: any) => {
    try {
      console.log('🎯 Joining public challenge:', challenge);
      
      // Join the challenge using the service
      const joinedChallenge = await challengeService.joinChallenge(challenge.id);
      console.log('✅ Successfully joined challenge:', joinedChallenge);
      
      // Refresh all challenge lists
      await Promise.all([
        // Refresh challenges for me (the joined challenge should now appear here)
        (async () => {
          try {
            const challenges = await challengeService.getChallengesForMe();
            const validChallenges = challenges.filter(c => c.id);
            setChallengesForMe(validChallenges);
          } catch (error) {
            console.error('Error refreshing challenges for me:', error);
          }
        })(),
        // Refresh public challenges (the joined challenge should still be visible but with updated status)
        (async () => {
          try {
            const challenges = await challengeService.getPublicChallenges();
            setPublicChallenges(challenges);
          } catch (error) {
            console.error('Error refreshing public challenges:', error);
          }
        })()
      ]);
      
      // Show success message
      console.log('🎉 Successfully joined the challenge!');
      
    } catch (error) {
      console.error('❌ Error joining challenge:', error);
      // You can add error handling here (e.g., toast notification)
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

  // New challenge handlers
  const handleCreateChallenge = async (challengeData: any) => {
    try {
      console.log('🎯 Creating new challenge:', challengeData);
      
      // Create the challenge using the service
      const newChallenge = await challengeService.createChallenge(challengeData);
      console.log('✅ Challenge created successfully:', newChallenge);
      
      // Close the modal
      setIsNewChallengeModalOpen(false);
      setSelectedUserForChallenge(null);
      
      // Refresh the challenges lists
      await Promise.all([
        // Refresh user's created challenges
        (async () => {
          try {
            const challenges = await challengeService.getMyChallenges();
            const validChallenges = challenges.filter(c => c.id);
            setMyCreatedChallenges(validChallenges);
          } catch (error) {
            console.error('Error refreshing my challenges:', error);
          }
        })(),
        // Refresh challenges for me
        (async () => {
          try {
            const challenges = await challengeService.getChallengesForMe();
            const validChallenges = challenges.filter(c => c.id);
            setChallengesForMe(validChallenges);
          } catch (error) {
            console.error('Error refreshing challenges for me:', error);
          }
        })(),
        // Refresh public challenges
        (async () => {
          try {
            const challenges = await challengeService.getPublicChallenges();
            setPublicChallenges(challenges);
          } catch (error) {
            console.error('Error refreshing public challenges:', error);
          }
        })()
      ]);
      
      // Show success message (you can add toast notifications here)
      console.log('🎉 Challenge created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating challenge:', error);
      // You can add error handling here
    }
  };

  const closeNewChallengeModal = () => {
    setIsNewChallengeModalOpen(false);
    setSelectedUserForChallenge(null);
  };

  // Proof upload modal handlers
  const openProofUploadModal = (challenge: Challenge) => {
    console.log('🔍 Dashboard: Opening proof upload modal with challenge:', challenge);
    console.log('🔍 Dashboard: Challenge structure:', {
      id: challenge.id,
      stake: challenge.stake,
      platform: challenge.platform,
      challenger: challenge.challenger,
      status: challenge.status,
      hasStake: !!challenge.stake,
      stakeType: typeof challenge.stake
    });
    setSelectedProofChallenge(challenge);
    setIsProofUploadModalOpen(true);
  };

  const closeProofUploadModal = () => {
    setIsProofUploadModalOpen(false);
    setSelectedProofChallenge(null);
  };

  const handleProofSubmitted = (result: any) => {
    console.log('Proof submitted successfully:', result);
    // Refresh challenges to show updated status
    closeProofUploadModal();
  };

  // Challenge response handlers
  const handleAcceptChallenge = async (challengeId: string, myTeam?: string, accepterPlatformUsernames?: { [platform: string]: string }) => {
    try {
      await challengeService.respondToChallenge(challengeId, 'accept', myTeam, accepterPlatformUsernames);
      
      // Show success toast
      toast({
        title: "Challenge Accepted! 🎉",
        description: "You've successfully accepted the challenge. Good luck!",
        variant: "default",
      });
      
      // Refresh challenges to show updated status
      const challenges = await challengeService.getChallengesForMe();
      const validChallenges = challenges.filter(c => c.id);
      setChallengesForMe(validChallenges);
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
      
      // Refresh challenges to show updated status
      const challenges = await challengeService.getChallengesForMe();
      const validChallenges = challenges.filter(c => c.id);
      setChallengesForMe(validChallenges);
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

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(challengeId);
      await challengeService.deleteChallenge(challengeId);
      
      // Remove from local state
      setChallengesForMe(prev => prev.filter(c => c.id !== challengeId));
      
      // Show success message
      console.log('Challenge deleted successfully');
    } catch (error) {
      console.error('Error deleting challenge:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Helper functions for rank display
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'bronze': return 'text-amber-600';
      case 'silver': return 'text-gray-400';
      case 'gold': return 'text-yellow-500';
      case 'platinum': return 'text-cyan-400';
      case 'diamond': return 'text-purple-500';
      case 'master': return 'text-orange-500';
      case 'grandmaster': return 'text-red-500';
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
      case 'master': return '🔥';
      case 'grandmaster': return '⚡';
      default: return '🎯';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-success';
      case 'away': return 'bg-warning';
      case 'offline': return 'bg-muted-foreground';
      default: return 'bg-muted-foreground';
    }
  };

  const formatTimeRemaining = (deadline: string | Date) => {
    try {
      const now = new Date();
      const challengeDeadline = new Date(deadline);
      
      // Check if the date is valid
      if (isNaN(challengeDeadline.getTime())) {
        console.warn('⚠️ Invalid deadline date:', deadline);
        return 'Invalid Date';
      }
      
      const diffInSeconds = (challengeDeadline.getTime() - now.getTime()) / 1000;

      if (diffInSeconds <= 0) {
        return 'Expired';
      }

      const days = Math.floor(diffInSeconds / (3600 * 24));
      const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);

      if (days > 0) {
        return `${days}d ${hours}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch (error) {
      console.error('❌ Error formatting deadline:', error, 'deadline:', deadline);
      return 'Invalid Date';
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
            {/* Welcome Section */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-bold bg-gradient-gaming bg-clip-text text-transparent">
                Welcome back, {user?.firstName || 'Gamer'}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-inter">
                Ready to dominate the competition? Check your stats and active challenges.
              </p>
            </div>

            {/* Stats Grid */}
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
                    {challengesForMe.filter(c => c.status === 'pending').length}
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
                    ${challengesForMe.reduce((sum, c) => sum + c.stake, 0).toFixed(2)}
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
                    {new Set(challengesForMe.map(c => c.game)).size}
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
                    {new Set(challengesForMe.map(c => c.challenger.uid)).size}
                  </div>
                  <p className="text-xs sm:text-sm text-accent font-inter">
                    Unique challengers
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stats Grid for User's Created Challenges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-neon-orange transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-inter font-medium text-muted-foreground">
                    My Active Challenges
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-orange/10">
                    <Target className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-orange" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold mb-1">
                    {myCreatedChallenges.length}
                  </div>
                  <p className="text-xs sm:text-sm text-orange font-inter">
                    Active challenges
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-neon-cyan transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-inter font-medium text-muted-foreground">
                    Total Wager Value
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-cyan/10">
                    <DollarSign className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-cyan" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold mb-1">
                    ${myCreatedChallenges.reduce((sum, c) => sum + c.stake, 0).toFixed(2)}
                  </div>
                  <p className="text-xs sm:text-sm text-cyan font-inter">
                    Total stake value
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-neon-green transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-inter font-medium text-muted-foreground">
                    Games Created
                  </CardTitle>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-green/10">
                    <Gamepad2 className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-green" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold mb-1">
                    {new Set(myCreatedChallenges.map(c => c.game)).size}
                  </div>
                  <p className="text-xs sm:text-sm text-green font-inter">
                    Different games
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-neon-purple transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-inter font-medium text-muted-foreground">
                    Opponents
                      </CardTitle>
                  <div className="p-1.5 sm:p-2 rounded-lg bg-purple/10">
                    <Users className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-purple" />
                      </div>
                    </CardHeader>
                    <CardContent>
                  <div className="text-lg sm:text-xl lg:text-2xl font-orbitron font-bold mb-1">
                    {new Set(myCreatedChallenges.flatMap(c => c.opponents?.map(o => o.username) || [])).size}
                  </div>
                  <p className="text-xs sm:text-sm text-purple font-inter">
                    Unique opponents
                      </p>
                    </CardContent>
                  </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-secondary/50 backdrop-blur-sm">
                <TabsTrigger value="overview" className="font-inter font-medium text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="challenges" className="font-inter font-medium text-xs sm:text-sm">My Challenges</TabsTrigger>
                <TabsTrigger value="challenges-for-me" className="font-inter font-medium text-xs sm:text-sm">Challenges For Me</TabsTrigger>
                <TabsTrigger value="activity" className="font-inter font-medium text-xs sm:text-sm">Recent Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 sm:gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Lobby - Active Users */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="font-orbitron text-base sm:text-lg">Lobby</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Active players online now</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                              <TableHead className="font-orbitron font-semibold text-xs">Player</TableHead>
                              <TableHead className="font-orbitron font-semibold text-xs text-center">Rank</TableHead>
                              <TableHead className="font-orbitron font-semibold text-xs text-center">Status</TableHead>
                              <TableHead className="font-orbitron font-semibold text-xs text-center">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                  <p className="text-muted-foreground text-sm">Loading players...</p>
                                </TableCell>
                              </TableRow>
                            ) : displayLobbyUsers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-muted-foreground text-sm">No players available</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              displayLobbyUsers.map((user) => (
                                <TableRow key={`lobby-user-${user.id}`} className="hover:bg-secondary/10 transition-colors duration-200">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <Avatar className="w-6 h-6">
                                        <AvatarImage src={user.avatar} alt={user.username} />
                                        <AvatarFallback className="bg-gradient-gaming text-primary-foreground font-orbitron text-xs">
                                          {user.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-background ${getStatusColor(user.status)}`} />
                                    </div>
                                    <div>
                                      <div className="font-orbitron font-semibold text-xs text-foreground hover:text-primary transition-colors cursor-pointer">
                                        {user.username}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className={`text-xs font-medium ${getRankColor(user.rank)}`}>
                                      {getRankIcon(user.rank)}
                                    </span>
                                    <span className={`text-xs font-medium ${getRankColor(user.rank)}`}>
                                      {user.rank.charAt(0).toUpperCase() + user.rank.slice(1)}
                                    </span>
                                  </div>
                                </TableCell>
                                
                                <TableCell className="text-center">
                                  <span className="text-xs text-muted-foreground">{user.lastActive}</span>
                                </TableCell>
                                <TableCell className="text-center">
                                                                      <Button
                                      size="sm"
                                      onClick={() => handleChallengeUser(user)}
                                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-orange"
                                    >
                                      <Sword className="h-3 w-3 mr-1" />
                                      Challenge
                                    </Button>
                                  </TableCell>
                                </TableRow>
                                ))
                              )}
                            </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Public Challenges */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="font-orbitron text-base sm:text-lg">Public Challenges</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Open challenges you can join. Each join creates an individual challenge. Completed challenges remain visible for reference.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-64 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                              <TableHead className="font-orbitron font-semibold text-xs">Challenger</TableHead>
                              <TableHead className="font-orbitron font-semibold text-xs text-center">Game</TableHead>
                              <TableHead className="font-orbitron font-semibold text-xs text-center">Wager</TableHead>
                              
                              <TableHead className="font-orbitron font-semibold text-xs text-center">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {loading ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                  <p className="text-muted-foreground text-sm">Loading challenges...</p>
                                </TableCell>
                              </TableRow>
                            ) : publicChallenges.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                  <p className="text-muted-foreground text-sm">No public challenges available</p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              publicChallenges.map((challenge) => (
                                challenge.id ? (
                                  <TableRow key={`public-challenge-${challenge.id}`} className="hover:bg-secondary/10 transition-colors duration-200">
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                          <AvatarFallback className="bg-gradient-gaming text-primary-foreground font-orbitron text-xs">
                                            {challenge.challenger.username.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="font-orbitron font-semibold text-xs text-foreground">
                                          {challenge.challenger.username}
                                        </span>
                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        <Badge variant="secondary" className="text-xs">
                                          {challenge.game}
                                        </Badge>
                                        {challenge.opponents && challenge.opponents.length > 0 && (
                                          <span className="text-xs text-muted-foreground">
                                            {challenge.opponents.length} participant{challenge.opponents.length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className="font-orbitron font-bold text-xs text-success">
                                        ${challenge.stake.toFixed(2)}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className="text-xs text-muted-foreground font-inter">
                                        {challenge.deadline ? (() => {
                                          console.log('🔍 Debug deadline:', challenge.deadline, typeof challenge.deadline);
                                          return formatTimeRemaining(challenge.deadline);
                                        })() : 'No deadline'}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {(() => {
                                        // Check if current user has already joined this challenge
                                        const hasJoined = challenge.opponents && 
                                          challenge.opponents.some((opp: any) => opp.username === user?.username);
                                        
                                        if (hasJoined) {
                                          return (
                                            <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                                              <CheckCircle className="h-3 w-3 mr-1" />
                                              Joined
                                            </Badge>
                                          );
                                        }
                                        
                                        // Check if challenge is still accepting participants
                                        if (challenge.status !== 'pending') {
                                          let statusText = challenge.status;
                                          let statusColor = 'bg-muted/20 text-muted border-muted/30';
                                          
                                          if (challenge.status === 'active') {
                                            statusText = 'In Progress';
                                            statusColor = 'bg-blue/20 text-blue border-blue/30';
                                          } else if (challenge.status === 'completed') {
                                            statusText = 'Completed';
                                            statusColor = 'bg-success/20 text-success border-success/30';
                                          } else if (challenge.status === 'cancelled') {
                                            statusText = 'Cancelled';
                                            statusColor = 'bg-destructive/20 text-destructive border-destructive/30';
                                          } else if (challenge.status === 'expired') {
                                            statusText = 'Expired';
                                            statusColor = 'bg-orange/20 text-orange border-orange/30';
                                          }
                                          
                                          // For completed challenges, show winner info if available
                                          if (challenge.status === 'completed' && challenge.winner) {
                                            const isWinner = challenge.winner === user?.username;
                                            const isLoser = challenge.loser === user?.username;
                                            
                                            if (isWinner) {
                                              return (
                                                <Badge variant="secondary" className="text-xs bg-yellow/20 text-yellow-600 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800/50">
                                                  <Trophy className="h-3 w-3 mr-1" />
                                                  Winner!
                                                </Badge>
                                              );
                                            } else if (isLoser) {
                                              return (
                                                <Badge variant="secondary" className="text-xs bg-red-20 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50">
                                                  <XCircle className="h-3 w-3 mr-1" />
                                                  Lost
                                                </Badge>
                                              );
                                            } else {
                                              return (
                                                <Badge variant="secondary" className={`text-xs ${statusColor}`}>
                                                  <Clock className="h-3 w-3 mr-1" />
                                                  {statusText}
                                                </Badge>
                                              );
                                            }
                                          }
                                          
                                          return (
                                            <Badge variant="secondary" className={`text-xs ${statusColor}`}>
                                              <Clock className="h-3 w-3 mr-1" />
                                              {statusText}
                                            </Badge>
                                          );
                                        }
                                        
                                        // Show join button for pending challenges
                                        return (
                                          <Button
                                            size="sm"
                                            onClick={() => handleJoinChallenge(challenge)}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-orange"
                                          >
                                            <Sword className="h-3 w-3 mr-1" />
                                            Join
                                          </Button>
                                        );
                                                                              })()}
                                    </TableCell>
                                  </TableRow>
                                ) : null
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="challenges" className="space-y-4">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="font-orbitron text-base sm:text-lg">My Challenges</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">All challenges you've created</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                            <TableHead className="font-orbitron font-semibold text-xs">Opponent</TableHead>
                            <TableHead className="font-orbitron font-semibold text-xs text-center">Game</TableHead>
                            <TableHead className="font-orbitron font-semibold text-xs text-center">Wager</TableHead>
                            <TableHead className="font-orbitron font-semibold text-xs text-center">Status</TableHead>
                            <TableHead className="font-orbitron font-semibold text-xs text-center">Time Left</TableHead>
                            <TableHead className="font-orbitron font-semibold text-xs text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingMyChallenges ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                <p className="text-muted-foreground text-sm">Loading challenges...</p>
                              </TableCell>
                            </TableRow>
                          ) : myCreatedChallenges.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground text-sm">No active challenges</p>
                                <p className="text-xs text-muted-foreground mt-1">Create a challenge to get started</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            myCreatedChallenges.map((challenge, index) => (
                              challenge.id ? (
                                <TableRow key={`my-challenge-${challenge.id}-${index}`} className="hover:bg-secondary/10 transition-colors duration-200">
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="bg-gradient-gaming text-primary-foreground font-orbitron text-xs">
                                          {challenge.opponents && challenge.opponents.length > 0 
                                            ? challenge.opponents[0].username.charAt(0).toUpperCase()
                                            : '?'
                                          }
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-orbitron font-semibold text-xs text-foreground">
                                        {challenge.opponents && challenge.opponents.length > 0 
                                          ? challenge.opponents[0].username
                                          : 'Unknown'
                                        }
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="secondary" className="text-xs">
                                      {challenge.game}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="font-orbitron font-bold text-xs text-success">
                                      ${challenge.stake.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge 
                                      variant="secondary" 
                                      className={`text-xs ${
                                        challenge.status === 'pending' ? 'bg-warning/20 text-warning border-warning/30' :
                                        challenge.status === 'active' ? 'bg-success/20 text-success border-success/30' :
                                        challenge.status === 'completed' ? 'bg-primary/20 text-primary border-primary/30' :
                                        challenge.status === 'proof-submitted' ? 'bg-cyan/20 text-cyan border-cyan/30' :
                                        challenge.status === 'verifying' ? 'bg-blue/20 text-blue border-blue/30' :
                                        challenge.status === 'ai-verified' ? 'bg-green/20 text-green border-green/30' :
                                        challenge.status === 'cancelled' ? 'bg-red-20 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50' :
                                        challenge.status === 'expired' ? 'bg-orange-20 text-orange-600 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800/50' :
                                        challenge.status === 'declined' ? 'bg-red-20 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/50' :
                                        'bg-secondary/20 text-secondary border-secondary/30'
                                      }`}
                                    >
                              {challenge.status.replace('-', ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-xs text-muted-foreground font-inter">
                                        {challenge.deadline ? (() => {
                                          console.log('🔍 My Challenges deadline:', challenge.deadline, typeof challenge.deadline);
                                          return formatTimeRemaining(challenge.deadline);
                                        })() : 'No deadline'}
                            </span>
                          </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {challenge.status === 'active' && challenge.opponents && 
                                     (challenge.challenger.uid === user?.uid || 
                                      challenge.opponents.every(opp => opp.status === 'accepted')) && (
                                      <Button
                                        size="sm"
                                        onClick={() => openProofUploadModal(challenge)}
                                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-orange"
                                      >
                                        <Trophy className="h-3 w-3 mr-1" />
                                        Claim Reward
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ) : null
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="challenges-for-me" className="space-y-4">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="font-orbitron text-base sm:text-lg">Challenges For Me</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Challenges from other players</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                            <TableHead className="font-orbitron font-semibold text-xs">Challenger</TableHead>
                            <TableHead className="font-orbitron font-semibold text-xs text-center">Game</TableHead>
                            <TableHead className="font-orbitron font-semibold text-xs text-center">Wager</TableHead>
                            
                            <TableHead className="font-orbitron font-semibold text-xs text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingChallengesForMe ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                                <p className="text-muted-foreground text-sm">Loading challenges...</p>
                              </TableCell>
                            </TableRow>
                          ) : challengesForMe.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8">
                                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground text-sm">No challenges received yet</p>
                                <p className="text-xs text-muted-foreground mt-1">Other players can challenge you from the Lobby</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            challengesForMe.map((challenge) => (
                              challenge.id ? (
                                <TableRow key={`for-me-challenge-${challenge.id}`} className="hover:bg-secondary/10 transition-colors duration-200">
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback className="bg-gradient-gaming text-primary-foreground font-orbitron text-xs">
                                          {challenge.challenger.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-orbitron font-semibold text-xs text-foreground">
                                        {challenge.challenger.username}
                                      </span>
                        </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="secondary" className="text-xs">
                                      {challenge.game}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="font-orbitron font-bold text-xs text-success">
                                      ${challenge.stake.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-xs text-muted-foreground font-inter">
                                      {challenge.deadline ? (() => {
                                        console.log('🔍 Challenges For Me deadline:', challenge.deadline, typeof challenge.deadline);
                                        return formatTimeRemaining(challenge.deadline);
                                      })() : 'No deadline'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
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
                                            onClick={() => handleAcceptChallenge(challenge.id)}
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
                                      
                                      {/* Show Claim Reward for active challenges where YOU have accepted OR you're the challenger */}
                                      {/* Only show for active status - completed challenges don't need Claim Reward button */}
                                      {challenge.status === 'active' && challenge.opponents && (
                                        (challenge.challenger.uid === user?.uid) || 
                                        (challenge.opponents.some(opp => opp.username === user?.username && opp.status === 'accepted'))
                                      ) && (
                                        <Button
                                          size="sm"
                                          onClick={() => openProofUploadModal(challenge)}
                                          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-orange"
                                        >
                                          <Trophy className="h-3 w-3 mr-1" />
                                          Claim Reward
                                        </Button>
                                      )}
                                      
                                      {/* Show status info for accepted challenges that are not yet active */}
                                      {challenge.status === 'accepted' && (
                                        <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                                          Challenge Accepted
                                        </Badge>
                                      )}

                                      {/* Show status info for active challenges where you can't claim yet */}
                                      {challenge.status === 'active' && challenge.opponents && 
                                       !((challenge.challenger.uid === user?.uid) || 
                                         (challenge.opponents.some(opp => opp.username === user?.username && opp.status === 'accepted'))) && (
                                        <Badge variant="secondary" className="text-xs bg-warning/20 text-warning border-warning/30">
                                          Accept Challenge to Claim Reward
                                        </Badge>
                                      )}

                                      {/* Show status info for completed challenges */}
                                      {['verifying', 'ai-verified', 'completed'].includes(challenge.status) && (
                                        <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                                          {challenge.status === 'verifying' ? 'Verifying' : 
                                           challenge.status === 'ai-verified' ? 'AI Verified' : 'Completed'}
                                        </Badge>
                                      )}

                                      {/* Show winner info for completed challenges */}
                                      {challenge.status === 'completed' && challenge.winner && (
                                        <div className="text-xs text-center">
                                          <div className="font-semibold text-primary mb-1">Winner</div>
                                          <div className="text-success font-bold">{challenge.winner}</div>
                                        </div>
                                      )}
                                      
                                      <Button
                                        size="sm"
                                        onClick={() => handleDeleteChallenge(challenge.id)}
                                        disabled={isDeleting === challenge.id}
                                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-red"
                                      >
                                        {isDeleting === challenge.id ? (
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                                        ) : (
                                          <XCircle className="h-3 w-3 mr-1" />
                                        )}
                                        Delete
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : null
                            ))
                          )}
                        </TableBody>
                      </Table>
                      </div>
                    </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type === 'win' ? 'bg-success' : 'bg-destructive'
                          }`} />
                          <div>
                            <p className="font-inter font-medium">
                              {activity.type === 'win' ? 'Won' : 'Lost'} against {activity.opponent}
                            </p>
                            <p className="text-sm text-muted-foreground">{activity.game} • {activity.time}</p>
                          </div>
                        </div>
                        <div className={`font-orbitron font-bold ${
                          activity.type === 'win' ? 'text-success' : 'text-destructive'
                        }`}>
                          {activity.type === 'win' ? '+' : '-'}${activity.amount.toFixed(2)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
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
      
      {/* New Challenge Modal */}
      <NewChallengeModal
        isOpen={isNewChallengeModalOpen}
        onClose={closeNewChallengeModal}
        onCreateChallenge={handleCreateChallenge}
        preSelectedUser={selectedUserForChallenge}
      />

      {/* Proof Upload Modal */}
      {selectedProofChallenge && (
        <ProofUploadModal
          isOpen={isProofUploadModalOpen}
          onClose={closeProofUploadModal}
          challenge={selectedProofChallenge}
          onProofSubmitted={handleProofSubmitted}
        />
      )}

      {/* Floating Create Challenge Button */}
      <Button
        onClick={() => setIsNewChallengeModalOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-gradient-gaming hover:shadow-neon-orange transition-all duration-300 text-white font-orbitron font-bold text-sm sm:text-lg px-4 py-3 sm:px-6 sm:py-4 rounded-full shadow-lg hover:scale-105 transform hover:shadow-neon-orange/50"
        size="lg"
      >
        <span className="h-4 w-4 sm:h-6 sm:w-6 mr-2 text-2xl font-bold flex items-center justify-center">+</span>
        <span className="hidden sm:inline">Challenge</span>
        <span className="sm:hidden">Challenge</span>
      </Button>
    </div>
  );
}