import { useState, useEffect, useRef } from 'react';
import { X, Users, Gamepad2, DollarSign, Monitor, Play, Gamepad, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// removed Textarea
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// removed DatePicker
import { apiService } from '@/services/api';
import { User } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

interface NewChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChallenge: (challengeData: NewChallengeData) => void;
  preSelectedUser?: any; // Optional prop for pre-selecting a user
}

interface NewChallengeData {
  opponents: string[];
  game: string;
  stake: number;
  platform: string;
  label: string;
  isPublic: boolean;
}

interface RepoGame { id: number; gameName: string; isPublic: boolean }
interface GameOption { value: string; label: string }

const platforms = [
  
  
  { value: 'pc', label: 'PC', icon: Monitor },
  { value: 'ps', label: 'PlayStation', icon: Play },
  { value: 'xbox', label: 'Xbox', icon: Gamepad },
  { value: 'nintendo', label: 'Nintendo Switch', icon: Gamepad2 },
  { value: 'mobile', label: 'Mobile', icon: Monitor },
];

export const NewChallengeModal = ({ isOpen, onClose, onCreateChallenge, preSelectedUser }: NewChallengeModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<NewChallengeData>({
    opponents: [],
    game: '',
    stake: 0,
    platform: '',
    label: '',
    isPublic: false,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [gameOptions, setGameOptions] = useState<GameOption[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug logging for platform selection changes
  useEffect(() => {
    console.log('📝 Platform selection changed:', {
      platform: formData.platform,
      userPlatforms: user?.platforms,
      hasMatchingPlatform: user?.platforms?.some(p => p.platform === formData.platform),
      matchingPlatformData: user?.platforms?.find(p => p.platform === formData.platform)
    });
  }, [formData.platform, user?.platforms]);

  // Debug logging for user object
  useEffect(() => {
    console.log('👤 User object in modal:', {
      user: user,
      hasUser: !!user,
      platforms: user?.platforms,
      platformsCount: user?.platforms?.length || 0,
      platformTypes: user?.platforms?.map(p => p.platform) || []
    });
  }, [user]);

  // Set pre-selected user when modal opens
  useEffect(() => {
    if (preSelectedUser && preSelectedUser.username) {
      setFormData(prev => ({
        ...prev,
        opponents: [preSelectedUser.username]
      }));
      console.log('✅ Pre-selected user set:', preSelectedUser.username);
    }
  }, [preSelectedUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoadingUsers(true);
        console.log('🔍 Fetching users from API...');
        const fetchedUsers = await apiService.getUsers();
        console.log('✅ Users fetched successfully:', fetchedUsers);
        console.log('✅ Users structure:', {
          length: fetchedUsers.length,
          firstUser: fetchedUsers[0],
          allUsers: fetchedUsers.map(u => ({ username: u.username, uid: u.uid }))
        });
        setUsers(fetchedUsers.filter((u: any) => !u.isAdmin && u.username?.toLowerCase() !== 'admin' && u.role !== 'admin'));
      } catch (error) {
        console.error('❌ Error fetching users:', error);
        // Show error in dropdown
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch available games from backend
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoadingGames(true);
        setGamesError(null);
        const res = await apiService.get<RepoGame[]>(`/games?publicOnly=true`);
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Failed to load games');
        }
        const options = (res.data as RepoGame[])
          .sort((a, b) => a.gameName.localeCompare(b.gameName))
          .map(g => ({ value: g.gameName, label: g.gameName }));
        setGameOptions(options);
      } catch (err) {
        console.error('❌ Error fetching games:', err);
        setGamesError(err instanceof Error ? err.message : 'Failed to load games');
        setGameOptions([]);
      } finally {
        setIsLoadingGames(false);
      }
    };

    fetchGames();
  }, []);

  // Debug current user changes
  useEffect(() => {
    console.log('🔍 Current user changed:', {
      username: user?.username,
      uid: user?.uid,
      userLoaded: !!user?.uid
    });
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (field: keyof NewChallengeData, value: string | number | boolean | string[] | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getMinDate = () => undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.game || formData.stake <= 0 || !formData.platform) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    
    try {
      // Include platform usernames from profile if available
      const autoPlatformUsernames: Record<string, string> = {};
      if (user?.platforms && user.platforms.length > 0) {
        user.platforms.forEach(platformData => {
          if (platformData.onlineUserId && platformData.onlineUserId.trim()) {
            autoPlatformUsernames[platformData.platform] = platformData.onlineUserId.trim();
          }
        });
      }

      const apiChallengeData = {
        opponents: formData.opponents,
        game: formData.game,
        stake: formData.stake,
        platform: formData.platform,
        label: formData.label,
        isPublic: formData.isPublic,
        challengerPlatformUsernames: Object.keys(autoPlatformUsernames).length > 0 ? autoPlatformUsernames : undefined
      };
      
      console.log('🎯 Frontend: Sending challenge data:', apiChallengeData);
      console.log('🎯 Frontend: isPublic:', apiChallengeData.isPublic);
      console.log('🎯 Frontend: opponents:', apiChallengeData.opponents);
      console.log('🎯 Frontend: challengerPlatformUsernames:', apiChallengeData.challengerPlatformUsernames);
      console.log('🎯 Frontend: Raw formData:', formData);
      
      await onCreateChallenge(apiChallengeData);
      onClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter users by search query and exclude the current logged-in user
  const filteredUsers = users.filter(userItem => {
    const matchesSearch = userItem.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    // If current user is not loaded yet, show all users temporarily
    if (!user?.uid) {
      console.log('⚠️ Current user not loaded yet, showing all users temporarily');
      return matchesSearch;
    }
    
    const isNotCurrentUser = userItem.uid !== user.uid;
    return matchesSearch && isNotCurrentUser;
  });

  // Debug logging
  console.log('🔍 Debug - Users filtering:', {
    totalUsers: users.length,
    currentUser: user?.username,
    currentUserId: user?.uid,
    filteredUsers: filteredUsers.length,
    searchQuery,
    users: users.map(u => ({ username: u.username, uid: u.uid })),
    filteredUsersList: filteredUsers.map(u => ({ username: u.username, uid: u.uid })),
    userLoaded: !!user?.uid
  });

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose} // Close when clicking outside
    >
      <Card 
        className="w-full max-w-md sm:max-w-lg lg:max-w-xl max-h-[90vh] bg-card/95 backdrop-blur-xl border-border/50 shadow-glass overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside card
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 flex-shrink-0">
          <div className="space-y-1">
            <CardTitle className="font-orbitron text-lg sm:text-xl">Create New Challenge</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Challenge a player to a competitive match
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

        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)] pr-2">
          {/* Challenge Summary */}
          {(formData.opponents.length > 0 || formData.game || formData.stake > 0 || formData.isPublic) && (
            <div className="mb-6 p-4 bg-gradient-glow border border-border/30 rounded-lg">
              <h4 className="font-orbitron font-semibold text-sm mb-3 text-primary">Challenge Summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {formData.isPublic ? (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium text-primary ml-2">Public Challenge</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      Anyone can join this challenge without invitation
                    </p>
                  </div>
                ) : (
                  formData.opponents.length > 0 && (
                    <div>
                      <span className="text-muted-foreground">Opponents:</span>
                      <div className="font-medium text-foreground">
                        {formData.opponents.map((opponent, index) => (
                          <span key={index} className="inline-block bg-primary/20 text-primary px-2 py-1 rounded mr-2 mb-1">
                            {opponent}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                )}
                {formData.game && (
                  <div>
                    <span className="text-muted-foreground">Game:</span>
                    <span className="font-medium text-foreground ml-2 capitalize">{formData.game}</span>
                  </div>
                )}
                
                {formData.platform && (
                  <div>
                    <span className="text-muted-foreground">Platform:</span>
                    <span className="font-medium text-foreground ml-2 capitalize">
                      {platforms.find(p => p.value === formData.platform)?.label || formData.platform}
                    </span>
                  </div>
                )}
                
                

                {formData.stake > 0 && (
                  <div>
                    <span className="text-muted-foreground">Stake:</span>
                    <span className="font-medium text-foreground ml-2 text-success">${formData.stake}</span>
                  </div>
                )}
                {formData.label && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Label:</span>
                    <span className="font-medium text-foreground ml-2">{formData.label}</span>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Visibility:</span>
                  <span className={`font-medium ml-2 ${formData.isPublic ? 'text-primary' : 'text-muted-foreground'}`}>
                    {formData.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Public Challenge Checkbox - Moved to top */}
            <div className="space-y-2">
              <div className={`flex items-center space-x-3 p-3 border rounded-lg transition-all duration-300 ${
                formData.isPublic 
                  ? 'bg-primary/10 border-primary/30' 
                  : 'bg-secondary/20 border-border/30'
              }`}>
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="w-4 h-4 rounded border-border/50 text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2"
                />
                <div className="flex-1">
                  <Label htmlFor="isPublic" className="text-sm font-inter font-medium cursor-pointer text-foreground">
                    Make this challenge public
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.isPublic 
                      ? '✅ This challenge will be visible to all players' 
                      : 'Public challenges can be viewed and joined by other players'
                    }
                  </p>
                </div>
                {formData.isPublic && (
                  <div className="flex items-center gap-2 text-primary">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-medium">Public</span>
                  </div>
                )}
              </div>
            </div>

            {/* Opponent Selection - Only show if not public */}
            {!formData.isPublic && (
              <div className="space-y-2">
                <Label htmlFor="opponent" className="text-sm font-inter font-medium">
                  Opponent Username(s)
                </Label>
                <div className="relative" ref={dropdownRef}>
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="opponent"
                    type="text"
                    placeholder="Search for opponent's username"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      if (e.target.value === '') {
                        // Don't clear opponents array, just clear search
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsDropdownOpen(false);
                      }
                    }}
                    className="pl-10 bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300 text-sm sm:text-base"
                    required={formData.opponents.length === 0}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-secondary/80"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {/* Username Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {isLoadingUsers ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
                          Loading users...
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          {searchQuery ? (
                            'No users found matching your search'
                          ) : users.length === 0 ? (
                            'No users available in the system'
                          ) : !user?.uid ? (
                            'Loading user information...'
                          ) : (
                            'No other users available to challenge'
                          )}
                         
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user.uid}
                            type="button"
                            className="w-full p-3 text-left hover:bg-secondary/80 focus:bg-secondary/80 transition-colors duration-200 flex items-center gap-3"
                            onClick={() => {
                              // Add to opponents array if not already there
                              if (!formData.opponents.includes(user.username)) {
                                handleInputChange('opponents', [...formData.opponents, user.username]);
                              }
                              setSearchQuery('');
                              setIsDropdownOpen(false);
                            }}
                          >
                            <div className="w-8 h-8 bg-gradient-gaming rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-foreground">{user.username}</div>
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            </div>
                            {formData.opponents.includes(user.username) && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                {/* Selected Opponents Display */}
                {formData.opponents.length > 0 && (
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground mb-2 block">Selected Opponents:</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.opponents.map((opponent, index) => (
                        <div key={index} className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-2 rounded-lg text-sm">
                          <span>{opponent}</span>
                          <button
                            type="button"
                            onClick={() => handleInputChange('opponents', formData.opponents.filter((_, i) => i !== index))}
                            className="hover:bg-primary/30 rounded-full p-1 transition-colors duration-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Public Challenge Info - Show when public is enabled */}
            {formData.isPublic && (
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium text-primary">Public Challenge</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This challenge will be visible to all players. Anyone can join without needing to be specifically invited.
                </p>
              </div>
            )}

            {/* Challenge Label */}
            <div className="space-y-2">
              <Label htmlFor="label" className="text-sm font-inter font-medium">
                Challenge Label
              </Label>
              <Input
                id="label"
                type="text"
                placeholder="e.g., 1v1 Valorant, Tournament Match, etc."
                value={formData.label}
                onChange={(e) => handleInputChange('label', e.target.value)}
                className="bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300 text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Add a descriptive label for your challenge
              </p>
            </div>

            {/* Game Selection */}
            <div className="space-y-2">
              <Label htmlFor="game" className="text-sm font-inter font-medium">
                Game
              </Label>
              <Select onValueChange={(value) => handleInputChange('game', value)} required>
                <SelectTrigger className="bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300 text-sm sm:text-base">
                  <SelectValue placeholder={isLoadingGames ? 'Loading games...' : (gamesError ? 'Failed to load games' : 'Select a game')} />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                  {isLoadingGames && (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      Loading games...
                    </div>
                  )}
                  {!isLoadingGames && gamesError && (
                    <div className="p-3 text-sm text-destructive text-center">
                      {gamesError}
                    </div>
                  )}
                  {!isLoadingGames && !gamesError && gameOptions.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      No games available
                    </div>
                  )}
                  {!isLoadingGames && !gamesError && gameOptions.map((game) => (
                    <SelectItem key={game.value} value={game.value} className="hover:bg-secondary/80 focus:bg-secondary/80">
                      {game.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <Label htmlFor="platform" className="text-sm font-inter font-medium">
                Gaming Platform
              </Label>
              <Select onValueChange={(value) => handleInputChange('platform', value)} required>
                <SelectTrigger className="bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300 text-sm sm:text-base">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                  {platforms.map((platform) => {
                    const Icon = platform.icon;
                    return (
                      <SelectItem key={platform.value} value={platform.value} className="hover:bg-secondary/80 focus:bg-secondary/80">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {platform.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Stake Amount */}
            <div className="space-y-2">
              <Label htmlFor="stake" className="text-sm font-inter font-medium">
                Stake Amount ($)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="stake"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Enter stake amount"
                  value={formData.stake || ''}
                  onChange={(e) => handleInputChange('stake', parseFloat(e.target.value) || 0)}
                  className="pl-10 bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300 text-sm sm:text-base"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum stake: $1.00
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 hover:bg-secondary/80 text-sm sm:text-base py-2.5 sm:py-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-gaming hover:shadow-neon-orange transition-all duration-300 text-sm sm:text-base py-2.5 sm:py-3"
                disabled={isCreating}
              >
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span className="text-xs sm:text-sm">Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Create Challenge</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
