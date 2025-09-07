import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, Users, Trophy, Gamepad2, Crown, Zap, Sword, Filter } from 'lucide-react';
import { realtimeDbService } from '@/services/realtimeDb';
import { NewChallengeModal } from '@/components/ui/new-challenge-modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatTimeAgo, isRecentlyActive } from '@/utils/timeUtils';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '../services/api';
import { walletService } from '@/services/walletService';
import { challengeService } from '../services/challengeService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  uid: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profilePicture?: string;
  rank: string;
  winRate: number;
  totalGames: number;
  currentStreak: number;
  favoriteGame: string;
  createdAt: number;
  lastActive: number;
  status?: 'online' | 'away' | 'offline';
  lastActiveText?: string;
  isOnline?: boolean;
}

// Mock data for active users (will be replaced by API call)
const mockActiveUsers: User[] = [
  {
    uid: '1',
    firstName: 'John',
    lastName: 'Doe',
    username: 'CyberWarrior',
    email: 'john@example.com',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    status: 'online',
    rank: 'diamond',
    winRate: 87.5,
    totalGames: 156,
    currentStreak: 12,
    favoriteGame: 'Valorant',
    createdAt: Date.now(),
    lastActive: Date.now() - 120000 // 2 minutes ago
  },
  {
    uid: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    username: 'PixelHunter',
    email: 'jane@example.com',
    profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    status: 'online',
    rank: 'platinum',
    winRate: 72.3,
    totalGames: 89,
    currentStreak: 5,
    favoriteGame: 'CS:GO',
    createdAt: Date.now(),
    lastActive: Date.now() - 300000 // 5 minutes ago
  },
  {
    uid: '3',
    firstName: 'Mike',
    lastName: 'Johnson',
    username: 'NeonStriker',
    email: 'mike@example.com',
    status: 'online',
    rank: 'gold',
    winRate: 65.8,
    totalGames: 234,
    currentStreak: 3,
    favoriteGame: 'League of Legends',
    createdAt: Date.now(),
    lastActive: Date.now() - 60000 // 1 minute ago
  }
];

export default function Lobby() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [filterRank, setFilterRank] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]); // RealtimeDB online users will be here
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);

  // Fetch users from API and calculate real status
  useEffect(() => {
    // Load real wallet balance for header
    (async () => {
      try {
        const balance = await walletService.getWalletBalance();
        setWalletBalance(balance);
      } catch (e) {
        console.error('Lobby: failed to load wallet balance', e);
      }
    })();

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const apiUsers = await apiService.getUsers();
        
        // Convert API users to our User interface with real status calculation
        const convertedUsers: User[] = apiUsers
          .filter(apiUser => apiUser.uid !== currentUser?.uid)
          .filter(apiUser => !(apiUser as any)?.isAdmin && apiUser.username?.toLowerCase() !== 'admin' && (apiUser as any)?.role !== 'admin')
          .map(apiUser => {
          const now = Date.now();
          const ou = onlineUsers.find((ou: any) => ou.uid === apiUser.uid);
          const lastActiveTime = ou?.lastSeen || apiUser.lastActive;
          const timeDiff = now - lastActiveTime;
          
          // Debug logging
          console.log(`🔍 User ${apiUser.username}:`, {
            lastActive: lastActiveTime,
            lastActiveDate: new Date(lastActiveTime).toLocaleString(),
            now: now,
            nowDate: new Date(now).toLocaleString(),
            timeDiff: timeDiff,
            timeDiffMinutes: Math.round(timeDiff / (60 * 1000))
          });
          
          // Calculate real status based on actual lastActive timestamp
          let status: 'online' | 'away' | 'offline' = 'offline';
          let lastActiveText: string;
          
          if (ou?.isOnline) { // use realtime DB
            status = 'online';
            lastActiveText = 'Online now';
          } else if (timeDiff < 15 * 60 * 1000) { // Less than 15 minutes - away
            status = 'away';
            lastActiveText = formatTimeAgo(lastActiveTime);
          } else { // More than 15 minutes - offline
            status = 'offline';
            lastActiveText = formatTimeAgo(lastActiveTime);
          }
          
          console.log(`✅ User ${apiUser.username} status:`, { status, lastActiveText });
          
          return {
            uid: apiUser.uid,
            username: apiUser.username,
            firstName: apiUser.firstName,
            lastName: apiUser.lastName,
            email: apiUser.email,
            profilePicture: apiUser.profilePicture,
            status: status,
            rank: apiUser.rank,
            winRate: apiUser.winRate,
            totalGames: apiUser.totalGames,
            currentStreak: apiUser.currentStreak,
            favoriteGame: apiUser.favoriteGame,
            createdAt: typeof apiUser.createdAt === 'number' ? apiUser.createdAt : Date.now(),
            lastActive: typeof lastActiveTime === 'number' ? lastActiveTime : Date.now(),
            lastActiveText: lastActiveText,
            isOnline: status === 'online'
          };
        });
        
        setUsers(convertedUsers);
        console.log('✅ Lobby: Fetched real users from API:', convertedUsers.length);
      } catch (error) {
        console.error('❌ Lobby: Error fetching users:', error);
        // Fallback to mock data only if API fails
        setUsers(mockActiveUsers);
      } finally {
        setLoading(false);
      }
    };

    // start presence tracking and subscribe
    realtimeDbService.setUserOnline();
    const unsubscribe = realtimeDbService.listenToOnlineUsers((list) => {
      setOnlineUsers(list as any[]);
    });

    fetchUsers();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Update user status every minute to keep "last active" times current
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(prevUsers => prevUsers.map(user => {
        const now = Date.now();
        const ou = onlineUsers.find((ou: any) => ou.uid === user.uid);
        const lastActiveTime = ou?.lastSeen || user.lastActive;
        const timeDiff = now - lastActiveTime;
        
        let status: 'online' | 'away' | 'offline' = 'offline';
        let lastActiveText: string;
        
        if (ou?.isOnline) {
          status = 'online';
          lastActiveText = 'Online now';
        } else if (timeDiff < 15 * 60 * 1000) { // Less than 15 minutes - away
          status = 'away';
          lastActiveText = formatTimeAgo(lastActiveTime);
        } else { // More than 15 minutes - offline
          status = 'offline';
          lastActiveText = formatTimeAgo(lastActiveTime);
        }
        
        return {
          ...user,
          status,
          lastActiveText,
          isOnline: status === 'online'
        };
      }));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Filter users based on search and rank
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.favoriteGame.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRank = filterRank === 'all' || user.rank === filterRank;
    return matchesSearch && matchesRank;
  });

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

  const handleChallengeUser = (user: User) => {
    setSelectedUser(user);
    setChallengeModalOpen(true);
  };

  const handleCloseChallengeModal = () => {
    setChallengeModalOpen(false);
    setSelectedUser(null);
  };

  const handleCreateChallenge = async (challengeData: any) => {
    try {
      console.log('🎯 Creating challenge with data:', challengeData);
      
      // Create the challenge using the service
      const newChallenge = await challengeService.createChallenge(challengeData);
      console.log('✅ Challenge created successfully:', newChallenge);
      
      // Close the modal
      handleCloseChallengeModal();
      
      // Show success message
      console.log('🎉 Challenge created successfully!');
      
    } catch (error) {
      console.error('❌ Error creating challenge:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1">
          <Navbar onMenuClick={() => setSidebarOpen(true)} walletBalance={walletBalance} onWalletUpdate={setWalletBalance} />
          
          <main className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-orbitron font-bold bg-gradient-gaming bg-clip-text text-transparent">
              Game Lobby
            </h1>
            <p className="text-muted-foreground">
              Find opponents and start challenging
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-glow border border-border/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Users className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-orbitron font-bold">{onlineUsers.length}</p>
                <p className="text-sm text-muted-foreground">Online Now</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-glow border border-border/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-orbitron font-bold">6</p>
                <p className="text-sm text-muted-foreground">Online Now</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-glow border border-border/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/20 rounded-lg">
                <Zap className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-orbitron font-bold">3</p>
                <p className="text-sm text-muted-foreground">In Matches</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-glow border border-border/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <Trophy className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-orbitron font-bold">2</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-card/50 border-border/50 focus:border-primary/50"
          />
        </div>
        
        <select
          value={filterRank}
          onChange={(e) => setFilterRank(e.target.value)}
          className="px-4 py-2 bg-card/50 border border-border/50 rounded-md text-sm focus:border-primary/50 focus:outline-none"
        >
          <option value="all">All Ranks</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
          <option value="diamond">Diamond</option>
          <option value="master">Master</option>
          <option value="grandmaster">Grandmaster</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading players...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No players found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <Table>
          <TableHeader>
            <TableRow className="bg-secondary/20 hover:bg-secondary/20">
              <TableHead className="font-orbitron font-semibold">Player</TableHead>
              <TableHead className="font-orbitron font-semibold text-center">Rank</TableHead>
              <TableHead className="font-orbitron font-semibold text-center">Games</TableHead>
              <TableHead className="font-orbitron font-semibold text-center">Last Active</TableHead>
              <TableHead className="font-orbitron font-semibold text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.uid} className="hover:bg-secondary/10 transition-colors duration-200">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10 border-2 border-border/50">
                        <AvatarImage src={user.profilePicture} alt={user.username} />
                        <AvatarFallback className="bg-gradient-gaming text-primary-foreground font-orbitron text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`} />
                    </div>
                    <div>
                      <div className="font-orbitron font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
                        {user.username}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {/* Intentionally left blank per requirement: hide favorite game and WR */}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-sm font-medium ${getRankColor(user.rank)}`}>
                      {getRankIcon(user.rank)}
                    </span>
                    <span className={`text-sm font-medium ${getRankColor(user.rank)}`}>
                      {user.rank.charAt(0).toUpperCase() + user.rank.slice(1)}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className="text-center">
                    <div className="font-orbitron font-bold text-foreground">
                      {user.totalGames}
                    </div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <span className="text-sm text-muted-foreground">{user.lastActiveText}</span>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    onClick={() => handleChallengeUser(user)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold transition-all duration-300 hover:shadow-neon-orange"
                  >
                    <Sword className="h-3 w-3 mr-1" />
                    Challenge
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </div>

            {/* No Results */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-orbitron font-semibold mb-2">No Players Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}

            {/* Challenge Modal */}
            {selectedUser && (
              <NewChallengeModal
                isOpen={challengeModalOpen}
                onClose={handleCloseChallengeModal}
                onCreateChallenge={handleCreateChallenge}
                preSelectedUser={selectedUser}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}