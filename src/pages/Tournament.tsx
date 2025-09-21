import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Crown, Trophy, Users, Calendar, Clock, Star, Play, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { walletService } from '@/services/walletService';
import { TournamentBracket } from '@/components/TournamentBracket';
import { useAuth } from '@/contexts/AuthContext';
import { tournamentService, Tournament, ActiveTournaments } from '@/services/tournamentService';
import { tournamentTypesService, TournamentType } from '@/services/tournamentTypesService';

// Tournament types will be loaded from API

// Mock active tournaments data - one tournament per type
const mockActiveTournaments = {
  clash: {
    id: 'clash_001',
    name: 'Weekly Clash Championship',
    players: 4,
    currentPlayers: 3,
    entryFee: 25,
    prizePool: 100,
    status: 'waiting', // waiting, starting, in_progress, completed
    startTime: '2025-01-20T15:00:00Z',
    game: 'Fortnite',
    type: 'clash',
    participants: [
      { id: 'user1', username: 'Player1', joinedAt: '2025-01-20T14:30:00Z' },
      { id: 'user2', username: 'Player2', joinedAt: '2025-01-20T14:35:00Z' },
      { id: 'user3', username: 'Player3', joinedAt: '2025-01-20T14:40:00Z' }
    ],
    bracket: null, // Will be generated when tournament starts
    currentRound: 0,
    isFull: false
  },
  battle: {
    id: 'battle_001',
    name: 'Epic Battle Royale',
    players: 8,
    currentPlayers: 6,
    entryFee: 50,
    prizePool: 400,
    status: 'waiting',
    startTime: '2025-01-20T17:00:00Z',
    game: 'Apex Legends',
    type: 'battle',
    participants: [
      { id: 'user3', username: 'Player3', joinedAt: '2025-01-20T16:30:00Z' },
      { id: 'user4', username: 'Player4', joinedAt: '2025-01-20T16:35:00Z' },
      { id: 'user5', username: 'Player5', joinedAt: '2025-01-20T16:40:00Z' },
      { id: 'user6', username: 'Player6', joinedAt: '2025-01-20T16:45:00Z' },
      { id: 'user7', username: 'Player7', joinedAt: '2025-01-20T16:50:00Z' },
      { id: 'user8', username: 'Player8', joinedAt: '2025-01-20T16:55:00Z' }
    ],
    bracket: null,
    currentRound: 0,
    isFull: false
  },
  rumble: {
    id: 'rumble_001',
    name: 'Mega Rumble Championship',
    players: 16,
    currentPlayers: 12,
    entryFee: 100,
    prizePool: 1600,
    status: 'waiting',
    startTime: '2025-01-20T18:00:00Z',
    game: 'Valorant',
    type: 'rumble',
    participants: [
      { id: 'user9', username: 'Player9', joinedAt: '2025-01-20T17:30:00Z' },
      { id: 'user10', username: 'Player10', joinedAt: '2025-01-20T17:35:00Z' },
      { id: 'user11', username: 'Player11', joinedAt: '2025-01-20T17:40:00Z' },
      { id: 'user12', username: 'Player12', joinedAt: '2025-01-20T17:45:00Z' },
      { id: 'user13', username: 'Player13', joinedAt: '2025-01-20T17:50:00Z' },
      { id: 'user14', username: 'Player14', joinedAt: '2025-01-20T17:55:00Z' },
      { id: 'user15', username: 'Player15', joinedAt: '2025-01-20T18:00:00Z' },
      { id: 'user16', username: 'Player16', joinedAt: '2025-01-20T18:05:00Z' },
      { id: 'user17', username: 'Player17', joinedAt: '2025-01-20T18:10:00Z' },
      { id: 'user18', username: 'Player18', joinedAt: '2025-01-20T18:15:00Z' },
      { id: 'user19', username: 'Player19', joinedAt: '2025-01-20T18:20:00Z' },
      { id: 'user20', username: 'Player20', joinedAt: '2025-01-20T18:25:00Z' }
    ],
    bracket: null,
    currentRound: 0,
    isFull: false
  },
  warzone: {
    id: 'warzone_001',
    name: 'Ultimate Warzone Showdown',
    players: 32,
    currentPlayers: 28,
    entryFee: 200,
    prizePool: 6400,
    status: 'waiting',
    startTime: '2025-01-20T19:00:00Z',
    game: 'Warzone',
    type: 'warzone',
    participants: [
      { id: 'user21', username: 'Player21', joinedAt: '2025-01-20T18:30:00Z' },
      { id: 'user22', username: 'Player22', joinedAt: '2025-01-20T18:35:00Z' },
      { id: 'user23', username: 'Player23', joinedAt: '2025-01-20T18:40:00Z' },
      { id: 'user24', username: 'Player24', joinedAt: '2025-01-20T18:45:00Z' },
      { id: 'user25', username: 'Player25', joinedAt: '2025-01-20T18:50:00Z' },
      { id: 'user26', username: 'Player26', joinedAt: '2025-01-20T18:55:00Z' },
      { id: 'user27', username: 'Player27', joinedAt: '2025-01-20T19:00:00Z' },
      { id: 'user28', username: 'Player28', joinedAt: '2025-01-20T19:05:00Z' },
      { id: 'user29', username: 'Player29', joinedAt: '2025-01-20T19:10:00Z' },
      { id: 'user30', username: 'Player30', joinedAt: '2025-01-20T19:15:00Z' },
      { id: 'user31', username: 'Player31', joinedAt: '2025-01-20T19:20:00Z' },
      { id: 'user32', username: 'Player32', joinedAt: '2025-01-20T19:25:00Z' },
      { id: 'user33', username: 'Player33', joinedAt: '2025-01-20T19:30:00Z' },
      { id: 'user34', username: 'Player34', joinedAt: '2025-01-20T19:35:00Z' },
      { id: 'user35', username: 'Player35', joinedAt: '2025-01-20T19:40:00Z' },
      { id: 'user36', username: 'Player36', joinedAt: '2025-01-20T19:45:00Z' },
      { id: 'user37', username: 'Player37', joinedAt: '2025-01-20T19:50:00Z' },
      { id: 'user38', username: 'Player38', joinedAt: '2025-01-20T19:55:00Z' },
      { id: 'user39', username: 'Player39', joinedAt: '2025-01-20T20:00:00Z' },
      { id: 'user40', username: 'Player40', joinedAt: '2025-01-20T20:05:00Z' },
      { id: 'user41', username: 'Player41', joinedAt: '2025-01-20T20:10:00Z' },
      { id: 'user42', username: 'Player42', joinedAt: '2025-01-20T20:15:00Z' },
      { id: 'user43', username: 'Player43', joinedAt: '2025-01-20T20:20:00Z' },
      { id: 'user44', username: 'Player44', joinedAt: '2025-01-20T20:25:00Z' },
      { id: 'user45', username: 'Player45', joinedAt: '2025-01-20T20:30:00Z' },
      { id: 'user46', username: 'Player46', joinedAt: '2025-01-20T20:35:00Z' },
      { id: 'user47', username: 'Player47', joinedAt: '2025-01-20T20:40:00Z' },
      { id: 'user48', username: 'Player48', joinedAt: '2025-01-20T20:45:00Z' }
    ],
    bracket: null,
    currentRound: 0,
    isFull: false
  }
};

// Mock tournament bracket data for when user is in a tournament
const mockTournamentBracket = {
  clash: {
    id: 'clash_001',
    name: 'Weekly Clash Championship',
    type: 'clash',
    players: 4,
    matches: [
      {
        id: 'match_1',
        round: 1,
        matchNumber: 1,
        player1: { id: 'user1', username: 'Player1' },
        player2: { id: 'user2', username: 'Player2' },
        status: 'pending',
        winner: null
      },
      {
        id: 'match_2',
        round: 1,
        matchNumber: 2,
        player1: { id: 'user3', username: 'Player3' },
        player2: { id: 'user4', username: 'Player4' },
        status: 'pending',
        winner: null
      },
      {
        id: 'match_3',
        round: 2,
        matchNumber: 1,
        player1: { id: 'winner1', username: 'Winner of Match 1' },
        player2: { id: 'winner2', username: 'Winner of Match 2' },
        status: 'pending',
        winner: null
      }
    ]
  }
};

export default function Tournament() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [activeTournamentType, setActiveTournamentType] = useState('clash');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isInTournament, setIsInTournament] = useState(false);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournaments, setTournaments] = useState<ActiveTournaments>({});
  const [tournamentTypes, setTournamentTypes] = useState<TournamentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningTournament, setJoiningTournament] = useState<string | null>(null);
  const [startingTournament, setStartingTournament] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch wallet balance and tournaments
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch wallet balance
      const balance = await walletService.getWalletBalance();
      setWalletBalance(balance);
      
      // Fetch active tournament types
      const types = await tournamentTypesService.getActiveTournamentTypes();
      setTournamentTypes(types);
      
      // Fetch active tournaments
      const activeTournaments = await tournamentService.getActiveTournaments();
      setTournaments(activeTournaments);
      
      console.log('✅ Fetched tournament types:', types);
      console.log('✅ Fetched tournaments:', activeTournaments);
      console.log('🔍 Tournament types length:', types.length);
      console.log('🔍 Tournaments object keys:', Object.keys(activeTournaments));
      console.log('🔍 Active tournament type:', activeTournamentType);
      console.log('🔍 Tournament for active type:', activeTournaments[activeTournamentType as keyof typeof activeTournaments]);
      
      // Log detailed tournament status for debugging
      for (const [type, tournament] of Object.entries(activeTournaments)) {
        console.log(`🔍 ${type} tournament details:`, {
          id: tournament.id,
          status: tournament.status,
          participants: tournament.participants?.length,
          players: tournament.players,
          isFull: tournament.participants?.length >= tournament.players
        });
      }
    } catch (error) {
      console.error('❌ Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet balance and tournaments on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Check if user is in a tournament
  useEffect(() => {
    const checkTournamentParticipation = () => {
      console.log('🔍 Checking tournament participation for user:', user?.uid);
      console.log('🔍 Available tournaments:', Object.keys(tournaments));
      
      // Check if user is in any tournament
      for (const [type, tournament] of Object.entries(tournaments)) {
        console.log(`🔍 Checking ${type} tournament:`, {
          id: tournament.id,
          status: tournament.status,
          participants: tournament.participants?.length,
          participantsList: tournament.participants?.map(p => ({ uid: p.uid, username: p.username }))
        });
        
        if (tournament.participants?.some((p: any) => p.uid === user?.uid)) {
          console.log(`🔍 User found in ${type} tournament with status:`, tournament.status);
          // Only set isInTournament to true if tournament is in_progress or completed
          // This prevents UI change when just joining a waiting tournament
          if (tournament.status === 'in_progress' || tournament.status === 'completed') {
            setIsInTournament(true);
            setCurrentTournament(tournament);
            console.log(`🎯 User is in ${type} tournament:`, tournament.id);
            return;
          } else {
            console.log(`⏳ User is in ${type} tournament but it's waiting, not changing UI`);
          }
        }
      }
      setIsInTournament(false);
      setCurrentTournament(null);
    };

    if (Object.keys(tournaments).length > 0) {
      checkTournamentParticipation();
    }
  }, [user, tournaments]);

  // Update tournament participation when tournament status changes
  useEffect(() => {
    if (isInTournament && currentTournament) {
      // Update current tournament data from tournaments state
      const updatedTournament = Object.values(tournaments).find(t => t.id === currentTournament.id);
      if (updatedTournament) {
        setCurrentTournament(updatedTournament);
      }
    }
  }, [tournaments, isInTournament, currentTournament]);

  // Check if tournament should be started (for existing full tournaments)
  // Disabled automatic tournament start to keep UI consistent
  // useEffect(() => {
  //   // Check if any tournament is full but not started
  //   for (const [type, tournament] of Object.entries(tournaments)) {
  //     if (tournament.participants.length === tournament.players && tournament.status === 'waiting') {
  //       console.log(`Tournament ${tournament.id} is full but not started. Starting now...`);
  //       checkAndStartTournament(tournament.id);
  //     }
  //   }
  // }, [tournaments]);

  // Generate tournament bracket - only first round initially
  const generateBracket = (participants: any[]) => {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const matches = [];
    let matchId = 1;

    console.log('🏆 Generating bracket for participants:', shuffled.length);

    // Only create first round matches initially
    const roundMatches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      if (i + 1 < shuffled.length) {
        roundMatches.push({
          id: `match_${matchId}`,
          round: 1,
          matchNumber: Math.floor(i / 2) + 1,
          player1: shuffled[i],
          player2: shuffled[i + 1],
          status: 'pending',
          winner: null
        });
        matchId++;
      }
    }
    
    console.log(`🎯 Round 1 matches:`, roundMatches);
    matches.push(...roundMatches);

    console.log('✅ Generated first round matches:', matches.length);
    console.log('📋 First round matches:', matches.map(m => ({ id: m.id, round: m.round, player1: m.player1.username, player2: m.player2.username })));
    return matches;
  };

  // Generate next round matches when current round is completed
  const generateNextRound = (currentMatches: any[], round: number) => {
    const currentRoundMatches = currentMatches.filter(m => m.round === round);
    const winners = currentRoundMatches
      .filter(m => m.status === 'completed' && m.winner)
      .map(m => m.winner);

    if (winners.length === 0) {
      console.log('❌ No winners found for round', round);
      return currentMatches;
    }

    console.log(`🏆 Generating round ${round + 1} with ${winners.length} winners:`, winners.map(w => w.username));

    const newMatches = [];
    let matchId = currentMatches.length + 1;

    // Create matches for next round
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) {
        newMatches.push({
          id: `match_${matchId}`,
          round: round + 1,
          matchNumber: Math.floor(i / 2) + 1,
          player1: winners[i],
          player2: winners[i + 1],
          status: 'pending',
          winner: null
        });
        matchId++;
      }
    }

    console.log(`🎯 Round ${round + 1} matches:`, newMatches);
    return [...currentMatches, ...newMatches];
  };

  // Check if tournament is full and start it
  const checkAndStartTournament = (tournamentId: string) => {
    setTournaments(prev => {
      const updated = { ...prev };
      for (const [type, tournament] of Object.entries(updated)) {
        if (tournament.id === tournamentId) {
          // Only start if we have exactly the required number of players
          if (tournament.participants.length === tournament.players) {
            console.log(`Tournament ${tournamentId} is now full with ${tournament.participants.length} players. Starting tournament...`);
            
            // Tournament is full, start it immediately
            const bracket = generateBracket(tournament.participants);
            updated[type] = {
              ...tournament,
              status: 'in_progress', // Changed from 'starting' to 'in_progress'
              bracket,
              currentRound: 1,
              isFull: true
            };
            
            console.log(`Tournament ${tournamentId} is now in progress!`);
          } else {
            console.log(`Tournament ${tournamentId} has ${tournament.participants.length}/${tournament.players} players. Waiting for more...`);
          }
        }
      }
      return updated;
    });
  };

  // Tournament action handlers
  const handleStartMatch = async (matchId: string) => {
    try {
      console.log('🚀 Starting match:', matchId);
      
      if (!currentTournament) {
        console.error('❌ No current tournament found');
        return;
      }

      // Start match via API
      const result = await tournamentService.startMatch(currentTournament.id, matchId);
      
      console.log('🔍 Start match result:', result);
      
      // Update local state with backend response
      setTournaments(prev => {
        const updated = { ...prev };
        for (const [type, tournament] of Object.entries(updated)) {
          if (tournament.bracket) {
            const updatedBracket = tournament.bracket.map((match: any) => {
              if (match.id === matchId) {
                return {
                  ...match,
                  startedPlayers: result.startedPlayers,
                  status: result.bothPlayersStarted ? 'ready' : 'pending'
                };
              }
              return match;
            });
            updated[type] = { ...tournament, bracket: updatedBracket };
          }
        }
        return updated;
      });
      
    } catch (error: any) {
      console.error('❌ Error starting match:', error);
      alert(error.message || 'Failed to start match. Please try again.');
    }
  };

  const handleReadyMatch = async (matchId: string) => {
    try {
      console.log('Ready for match:', matchId);
      
      if (!currentTournament) {
        console.error('❌ No current tournament found');
        return;
      }

      // Ready match via API
      const result = await tournamentService.readyMatch(currentTournament.id, matchId);
      
      console.log('🔍 Ready match result:', result);
      
      // Update local state with backend response
      setTournaments(prev => {
        const updated = { ...prev };
        for (const [type, tournament] of Object.entries(updated)) {
          if (tournament.bracket) {
            const updatedBracket = tournament.bracket.map((match: any) => {
              if (match.id === matchId) {
                return {
                  ...match,
                  readyPlayers: result.readyPlayers,
                  status: result.bothPlayersReady ? 'in_progress' : 'ready'
                };
              }
              return match;
            });
            updated[type] = { ...tournament, bracket: updatedBracket };
          }
        }
        return updated;
      });
      
    } catch (error: any) {
      console.error('❌ Error readying match:', error);
      alert(error.message || 'Failed to ready match. Please try again.');
    }
  };

  const handleSubmitScorecard = async (matchId: string, scorecard: {player1Score: number, player2Score: number}) => {
    try {
      console.log('📊 Submitting scorecard for match:', matchId, scorecard);
      
      if (!currentTournament) {
        console.error('❌ No current tournament found');
        return;
      }

      // Submit scorecard via API
      await tournamentService.submitScorecard(
        currentTournament.id, 
        matchId, 
        scorecard.player1Score, 
        scorecard.player2Score
      );
      
      // Update local state
      setTournaments(prev => {
        const updated = { ...prev };
        for (const [type, tournament] of Object.entries(updated)) {
          if (tournament.bracket) {
            const updatedBracket = tournament.bracket.map((match: any) => 
              match.id === matchId ? { 
                ...match, 
                status: 'scorecard_submitted',
                scorecard: {
                  ...scorecard,
                  submittedBy: user?.username || 'Unknown',
                  submittedAt: new Date().toISOString()
                }
              } : match
            );
            updated[type] = { ...tournament, bracket: updatedBracket };
          }
        }
        return updated;
      });

      // Auto-advance to AI verification after 2 seconds
      setTimeout(() => {
        setTournaments(prev => {
          const updated = { ...prev };
          for (const [type, tournament] of Object.entries(updated)) {
            if (tournament.bracket) {
              const updatedBracket = tournament.bracket.map((match: any) => 
                match.id === matchId ? { 
                  ...match, 
                  status: 'ai_verification'
                } : match
              );
              updated[type] = { ...tournament, bracket: updatedBracket };
            }
          }
          return updated;
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Error submitting scorecard:', error);
      alert(error.message || 'Failed to submit scorecard. Please try again.');
    }
  };

  const handleUploadProof = async (matchId: string, proofImages: string[], proofDescription: string) => {
    try {
      console.log('📸 Uploading proof for match:', matchId, 'with images:', proofImages.length, 'description:', proofDescription);
      
      if (!currentTournament) {
        console.error('❌ No current tournament found');
        return;
      }

      // Find the match to get its current status
      const match = currentTournament.bracket?.find(m => m.id === matchId);
      console.log('🔍 Current match status for', matchId, ':', match?.status);
      console.log('🔍 Full match object:', match);
      console.log('🔍 Match status type:', typeof match?.status);
      console.log('🔍 Match status value:', JSON.stringify(match?.status));

      // Upload proof via API
      await tournamentService.uploadProof(currentTournament.id, matchId, proofImages, proofDescription);
      
      console.log('✅ Proof uploaded successfully');
      
    } catch (error: any) {
      console.error('❌ Error uploading proof:', error);
      alert(error.message || 'Failed to upload proof. Please try again.');
    }
  };

  const handleCheckMatchStatus = async (matchId: string) => {
    try {
      console.log('🔍 Checking match status for:', matchId);
      
      if (!currentTournament) {
        console.error('❌ No current tournament found');
        return;
      }

      // Call the status check API
      const result = await tournamentService.checkMatchStatus(currentTournament.id, matchId);
      
      console.log('✅ Status check result:', result);
      
      if (result.success) {
        // Refresh the tournament data to get the updated match status
        await fetchData();
        alert(result.message || 'Match status updated successfully!');
      }
      
    } catch (error: any) {
      console.error('❌ Error checking match status:', error);
      alert(error.message || 'Failed to check match status. Please try again.');
    }
  };

  const handleAIClaim = async (matchId: string) => {
    try {
      console.log('🤖 AI claim for match:', matchId);
      
      if (!currentTournament) {
        console.error('❌ No current tournament found');
        return;
      }

      // Trigger AI verification via API
      const result = await tournamentService.aiClaim(currentTournament.id, matchId);
      
      // Update local state
      setTournaments(prev => {
        const updated = { ...prev };
        for (const [type, tournament] of Object.entries(updated)) {
          if (tournament.bracket) {
            const match = tournament.bracket.find((m: any) => m.id === matchId);
            if (match) {
              const winner = result.aiResult.winner === match.player1.username ? match.player1 : match.player2;
              const updatedBracket = tournament.bracket.map((match: any) => 
                match.id === matchId ? { 
                  ...match, 
                  status: 'completed',
                  aiResult: result.aiResult,
                  winner: winner.uid || winner.id
                } : match
              );
              
              // Check if all matches in current round are completed
              const currentRound = match.round;
              const currentRoundMatches = updatedBracket.filter((m: any) => m.round === currentRound);
              const allCurrentRoundCompleted = currentRoundMatches.every((m: any) => m.status === 'completed');
              
              if (allCurrentRoundCompleted && currentRoundMatches.length > 1) {
                console.log(`🏆 All matches in round ${currentRound} completed, generating next round...`);
                const newBracket = generateNextRound(updatedBracket, currentRound);
                updated[type] = { ...tournament, bracket: newBracket };
                console.log('✅ Next round generated:', newBracket.filter((m: any) => m.round === currentRound + 1));
              } else {
                updated[type] = { ...tournament, bracket: updatedBracket };
              }
              
              console.log('✅ Match completed and bracket updated:', updatedBracket.find(m => m.id === matchId));
            }
          }
        }
        return updated;
      });

      // Auto-complete the next match after this one completes
      setTimeout(() => {
        console.log('🎯 Triggering auto-complete for match:', matchId);
        autoCompleteNextMatch(matchId);
        
        // Check if this was the final match and tournament is complete
        checkTournamentCompletion(matchId);
      }, 1000);
      
    } catch (error: any) {
      console.error('❌ Error processing AI claim:', error);
      alert(error.message || 'Failed to process AI claim. Please try again.');
    }
  };

  // Auto-complete the next match in the same round
  const autoCompleteNextMatch = (completedMatchId: string) => {
    console.log('🔄 Auto-completing next match after:', completedMatchId);
    
    setTournaments(prev => {
      const updated = { ...prev };
      for (const [type, tournament] of Object.entries(updated)) {
        if (tournament.bracket) {
          // Find the completed match to get its round
          const completedMatch = tournament.bracket.find((match: any) => match.id === completedMatchId);
          console.log('📍 Completed match found:', completedMatch);
          
          if (completedMatch) {
            // Find other matches in the same round that are still pending
            const sameRoundMatches = tournament.bracket.filter((match: any) => 
              match.round === completedMatch.round && match.status === 'pending' && match.id !== completedMatchId
            );
            
            console.log('🎯 Same round pending matches:', sameRoundMatches);
            
            if (sameRoundMatches.length > 0) {
              // Auto-complete the first pending match in the same round
              const nextMatch = sameRoundMatches[0];
              console.log('✅ Auto-completing next match:', nextMatch.id);
              
              const updatedBracket = tournament.bracket.map((match: any) => 
                match.id === nextMatch.id ? { 
                  ...match, 
                  status: 'completed',
                  winner: Math.random() > 0.5 ? match.player1.id : match.player2.id,
                  aiResult: {
                    winner: Math.random() > 0.5 ? match.player1.username : match.player2.username,
                    confidence: Math.floor(Math.random() * 30) + 70,
                    reasoning: 'Auto-completed for workflow testing.'
                  }
                } : match
              );
              updated[type] = { ...tournament, bracket: updatedBracket };
              
              // After auto-completing this match, check if we need to advance to next round
              setTimeout(() => {
                console.log('🚀 Checking round advancement after auto-complete...');
                checkAndAdvanceRound(completedMatch.round, updatedBracket);
              }, 1000);
            } else {
              console.log('⚠️ No pending matches in same round, checking round advancement...');
              // All matches in this round are complete, check if we need to advance to next round
              checkAndAdvanceRound(completedMatch.round, tournament.bracket);
            }
          }
        }
      }
      return updated;
    });
  };

  // Check if all matches in a round are complete and advance to next round
  const checkAndAdvanceRound = (completedRound: number, bracket: any[]) => {
    console.log(`🔍 Checking round ${completedRound} advancement...`);
    const roundMatches = bracket.filter((match: any) => match.round === completedRound);
    console.log(`📊 Round ${completedRound} matches:`, roundMatches.map(m => ({ id: m.id, status: m.status, winner: m.winner })));
    
    const allComplete = roundMatches.every((match: any) => match.status === 'completed');
    console.log(`✅ All matches complete:`, allComplete);
    
    if (allComplete) {
      console.log(`🎉 Round ${completedRound} is complete! Advancing to next round...`);
      
      // Find next round matches and set them to pending
      const nextRound = completedRound + 1;
      const nextRoundMatches = bracket.filter((match: any) => match.round === nextRound);
      console.log(`🎯 Next round ${nextRound} matches:`, nextRoundMatches);
      
      if (nextRoundMatches.length > 0) {
        setTimeout(() => {
          console.log(`🚀 Advancing to round ${nextRound}...`);
          setTournaments(prev => {
            const updated = { ...prev };
            for (const [type, tournament] of Object.entries(updated)) {
              if (tournament.bracket) {
                let updatedBracket = tournament.bracket.map((match: any) => 
                  match.round === nextRound ? { ...match, status: 'pending' } : match
                );
                
                // Update the final match with real winners from previous round
                if (completedRound === 1 && nextRound === 2) {
                  console.log(`🔄 Updating final match with real winners...`);
                  const round1Matches = bracket.filter((match: any) => match.round === 1);
                  const winners = round1Matches.map((match: any) => {
                    const winner = match.winner === match.player1.id ? match.player1 : match.player2;
                    return {
                      id: winner.id,
                      username: winner.username,
                      level: Math.floor(Math.random() * 50) + 20
                    };
                  });
                  
                  console.log(`🏆 Winners from round 1:`, winners);
                  
                  if (winners.length >= 2) {
                    updatedBracket = updatedBracket.map((match: any) => 
                      match.round === nextRound ? {
                        ...match,
                        player1: {
                          id: winners[0].id,
                          username: winners[0].username
                        },
                        player2: {
                          id: winners[1].id,
                          username: winners[1].username
                        }
                      } : match
                    );
                    console.log(`✅ Final match updated with real winners!`);
                    console.log(`🎯 Final match details:`, updatedBracket.find(m => m.round === nextRound));
                  }
                }
                
                updated[type] = { ...tournament, bracket: updatedBracket };
              }
            }
            return updated;
          });
        }, 2000); // 2 second delay before advancing to next round
      } else {
        console.log(`⚠️ No next round matches found for round ${nextRound}`);
      }
    } else {
      console.log(`⏳ Round ${completedRound} not yet complete, waiting...`);
    }
  };

  // Check if tournament is complete
  const checkTournamentCompletion = (completedMatchId: string) => {
    setTournaments(prev => {
      const updated = { ...prev };
      for (const [type, tournament] of Object.entries(updated)) {
        if (tournament.bracket) {
          const completedMatch = tournament.bracket.find((match: any) => match.id === completedMatchId);
          if (completedMatch) {
            // Check if this was the final match (highest round number)
            const maxRound = Math.max(...tournament.bracket.map((m: any) => m.round));
            if (completedMatch.round === maxRound) {
              console.log('🏆 Tournament completed! Final match finished.');
              
              // Update tournament status to completed
              updated[type] = { 
                ...tournament, 
                status: 'completed',
                winner: completedMatch.winner === completedMatch.player1.id ? completedMatch.player1 : completedMatch.player2
              };
              
              console.log('🎉 Tournament winner:', updated[type].winner);
            }
          }
        }
      }
      return updated;
    });
  };

  const handleJoinTournament = async (tournamentId: string, tournamentType: string) => {
    try {
      console.log('🎯 Joining tournament:', tournamentId, tournamentType);
      
      setJoiningTournament(tournamentId);
      
      // Check if user is already in a tournament
      if (isInTournament) {
        alert('You are already in a tournament! Complete your current tournament first.');
        return;
      }

      // Check wallet balance
      const tournament = tournaments[tournamentType as keyof ActiveTournaments];
      if (tournament && walletBalance < tournament.entryFee) {
        alert(`Insufficient funds! You need at least ${tournament.entryFee} credits to join this tournament.`);
        return;
      }

      // Join tournament via API
      const updatedTournament = await tournamentService.joinTournament(tournamentId, tournamentType);
      
      // Update local state - only update participant count and keep UI the same
      console.log(`🔄 Updating tournament state for ${tournamentType}:`, {
        participants: updatedTournament.participants,
        currentPlayers: updatedTournament.participants.length,
        status: 'waiting'
      });
      
      setTournaments(prev => ({
        ...prev,
        [tournamentType]: {
          ...prev[tournamentType as keyof ActiveTournaments],
          participants: updatedTournament.participants,
          currentPlayers: updatedTournament.participants.length,
          // Keep the same UI state - don't change status or other properties
          status: 'waiting' // Always keep as waiting to maintain UI
        }
      }));

      // Show success message
      alert(`Successfully joined ${tournamentType} tournament! Waiting for more players...`);

      // Refresh wallet balance
      const balance = await walletService.getWalletBalance();
      setWalletBalance(balance);

      console.log('✅ Successfully joined tournament:', updatedTournament);
      
    } catch (error: any) {
      console.error('❌ Error joining tournament:', error);
      alert(error.message || 'Failed to join tournament. Please try again.');
    } finally {
      setJoiningTournament(null);
    }
  };

  const handleStartTournament = async (tournamentId: string) => {
    try {
      console.log('🚀 Starting tournament:', tournamentId);
      
      setStartingTournament(tournamentId);
      
      // Start tournament via API
      const updatedTournament = await tournamentService.startTournament(tournamentId);
      
      console.log('✅ Tournament started successfully:', updatedTournament);
      
      // Update local state with the started tournament
      setTournaments(prev => {
        const updated = { ...prev };
        // Find which tournament type this belongs to
        for (const [type, tournament] of Object.entries(prev)) {
          if (tournament.id === tournamentId) {
            updated[type as keyof ActiveTournaments] = {
              ...tournament,
              ...updatedTournament,
              status: 'in_progress'
            };
            break;
          }
        }
        return updated;
      });

      // Show success message
      alert('Tournament started successfully! Check your matches and begin playing!');
      
      // Refresh wallet balance (entry fees were deducted)
      const balance = await walletService.getWalletBalance();
      setWalletBalance(balance);
      
    } catch (error: any) {
      console.error('❌ Error starting tournament:', error);
      
      // Handle insufficient funds error specifically
      if (error.message && error.message.includes('insufficient funds')) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.insufficientFunds) {
            const insufficientUsers = errorData.insufficientFunds.map((user: any) => 
              `${user.username} (${user.balance}/${user.required} credits)`
            ).join(', ');
            alert(`Cannot start tournament: Some participants have insufficient funds:\n${insufficientUsers}\n\nPlease ask them to add more credits to their wallet.`);
          } else {
            alert(errorData.message || 'Some participants have insufficient funds. Please ask them to add more credits.');
          }
        } catch {
          alert('Some participants have insufficient funds. Please ask them to add more credits to their wallet.');
        }
      } else {
        alert(error.message || 'Failed to start tournament. Please try again.');
      }
    } finally {
      setStartingTournament(null);
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-xl">
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-bold bg-gradient-gaming bg-clip-text text-transparent">
                      Tournament
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {isInTournament ? 'Follow your tournament progress' : 'Compete in epic tournaments and win amazing prizes'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={fetchData}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-gaming rounded-full flex items-center justify-center mx-auto mb-4 shadow-neon-orange">
                  <Clock className="h-8 w-8 text-primary-foreground animate-spin" />
                </div>
                <h2 className="text-xl font-semibold text-primary mb-2">Loading Tournaments...</h2>
                <p className="text-muted-foreground">Please wait while we fetch the latest tournament data.</p>
              </div>
            ) : isInTournament && currentTournament && currentTournament.status === 'in_progress' ? (
              <TournamentBracket
                tournamentId={currentTournament.id}
                tournamentName={currentTournament.name}
                currentPlayerId={user?.uid || ''}
                matches={currentTournament.bracket || []}
                onStartMatch={handleStartMatch}
                onReadyMatch={handleReadyMatch}
                onSubmitScorecard={handleSubmitScorecard}
                onUploadProof={handleUploadProof}
                onAIClaim={handleAIClaim}
                onCheckMatchStatus={handleCheckMatchStatus}
              />
            ) : isInTournament && currentTournament && currentTournament.status === 'completed' ? (
              // Show tournament completion
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-gaming rounded-full flex items-center justify-center mx-auto mb-6 shadow-neon-orange">
                  <Trophy className="h-12 w-12 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-bold text-primary mb-4">Tournament Complete!</h2>
                <p className="text-xl text-muted-foreground mb-6">
                  Winner: <span className="font-semibold text-primary">{currentTournament.winner?.username}</span>
                </p>
                <Button 
                  onClick={() => {
                    setIsInTournament(false);
                    setCurrentTournament(null);
                  }}
                  className="bg-gradient-gaming hover:shadow-neon-orange"
                >
                  Return to Tournament List
                </Button>
              </div>
            ) : isInTournament && currentTournament ? (
              // Show tournament status when user is in tournament but not in progress
              <Card className="bg-gradient-glow border-border/30">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-gaming rounded-full flex items-center justify-center mx-auto mb-4 shadow-neon-orange">
                      <Crown className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">You're in {currentTournament.name}</h3>
                    <p className="text-muted-foreground mb-4">
                      {currentTournament.status === 'waiting' && `${currentTournament.players - currentTournament.participants.length} more players needed`}
                      {currentTournament.status === 'starting' && 'Tournament is starting... Get ready!'}
                      {currentTournament.status === 'in_progress' && 'Tournament is in progress! Check your matches below.'}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>Players: {currentTournament.participants.length}/{currentTournament.players}</span>
                      <span>Entry: ${currentTournament.entryFee}</span>
                      <span>Prize: ${currentTournament.prizePool}</span>
                    </div>
                    
                    {currentTournament.status === 'waiting' && currentTournament.participants.length === currentTournament.players && (
                      <Button 
                        onClick={() => checkAndStartTournament(currentTournament.id)}
                        className="bg-gradient-gaming hover:shadow-neon-orange"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Start Tournament Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>

            {/* Tournament Type Tabs */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Tournament Types</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tournamentTypes.map((type) => (
                  <Button
                    key={type.key}
                    variant={activeTournamentType === type.key ? 'default' : 'outline'}
                    onClick={() => setActiveTournamentType(type.key)}
                    className={`flex flex-col items-center gap-2 p-4 h-auto ${
                      activeTournamentType === type.key 
                        ? 'bg-gradient-gaming shadow-neon-orange' 
                        : 'hover:bg-secondary/50'
                    }`}
                  >
                    <div className="text-2xl">{type.icon}</div>
                    <div className="text-center">
                      <div className="font-semibold">{type.name}</div>
                      <div className="text-xs text-muted-foreground">{type.players} players</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Active Tournament for Selected Type */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Active {tournamentTypes.find(t => t.id === activeTournamentType)?.name} Tournament
                </h2>
                <Badge variant="outline" className="text-success border-success">
                  Active
                </Badge>
              </div>

              {/* Active Tournament Display */}
              <div className="space-y-4">
                {tournaments[activeTournamentType as keyof typeof tournaments] ? (
                  (() => {
                    const tournament = tournaments[activeTournamentType as keyof typeof tournaments];
                    const isUserInTournament = tournament.participants.some((p: any) => p.uid === user?.uid);
                    const canJoin = !isUserInTournament && 
                                  tournament.status === 'waiting' && 
                                  tournament.participants.length < tournament.players &&
                                  walletBalance >= tournament.entryFee;
                    
                    return (
                      <Card className="bg-gradient-glow border-border/30 hover:shadow-neon-cyan transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-3xl">
                                {tournamentTypes.find(t => t.id === tournament.type)?.icon}
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{tournament.name}</h3>
                                <p className="text-sm text-muted-foreground">{tournament.game}</p>
                              </div>
                            </div>
                            <Badge 
                              variant={tournament.status === 'waiting' ? 'outline' : tournament.status === 'starting' ? 'default' : 'default'}
                              className={
                                tournament.status === 'waiting' ? 'text-warning border-warning' : 
                                tournament.status === 'starting' ? 'text-primary border-primary' :
                                'text-success border-success'
                              }
                            >
                              {tournament.status === 'waiting' ? 'Waiting for Players' : 
                               tournament.status === 'starting' ? 'Starting...' :
                               tournament.status === 'in_progress' ? 'In Progress' : 'Completed'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-primary">{tournament.currentPlayers || tournament.participants.length}/{tournament.players}</div>
                              <div className="text-xs text-muted-foreground">Players</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-success">${tournament.entryFee}</div>
                              <div className="text-xs text-muted-foreground">Entry Fee</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-warning">${tournament.prizePool}</div>
                              <div className="text-xs text-muted-foreground">Prize Pool</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-accent">
                                {tournament.status === 'waiting' ? 
                                  `${tournament.players - tournament.participants.length} needed` :
                                  tournament.status === 'starting' ? 'Starting...' :
                                  tournament.status === 'in_progress' ? 'In Progress' :
                                  new Date(tournament.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                }
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {tournament.status === 'waiting' ? 'More Players' : 
                                 tournament.status === 'starting' ? 'Get Ready' :
                                 tournament.status === 'in_progress' ? 'Active' : 'Start Time'}
                              </div>
                            </div>
                          </div>

                          {/* Participants List */}
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">Participants ({tournament.participants.length})</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {tournament.participants.map((participant: any, index: number) => (
                                <div 
                                  key={participant.uid || participant.id || index}
                                  className={`p-2 rounded-lg text-sm ${
                                    participant.uid === user?.uid 
                                      ? 'bg-primary/20 text-primary font-semibold' 
                                      : 'bg-secondary/20 text-muted-foreground'
                                  }`}
                                >
                                  {participant.username}
                                </div>
                              ))}
                              {/* Empty slots */}
                              {Array.from({ length: tournament.players - tournament.participants.length }).map((_, index) => (
                                <div key={`empty-${index}`} className="p-2 rounded-lg text-sm bg-secondary/10 text-muted-foreground border-2 border-dashed border-border/30">
                                  Waiting...
                                </div>
                              ))}
                            </div>
                          </div>
                          
                        <div className="flex gap-2">
                          {canJoin ? (
                            <Button 
                              className="flex-1 bg-gradient-gaming hover:shadow-neon-orange"
                              onClick={() => handleJoinTournament(tournament.id, tournament.type)}
                              disabled={joiningTournament === tournament.id}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {joiningTournament === tournament.id ? 'Joining...' : `Join Tournament (${tournament.entryFee})`}
                            </Button>
                          ) : isUserInTournament ? (
                            tournament.participants.length >= tournament.players && tournament.status === 'waiting' ? (
                              <Button 
                                className="flex-1 bg-gradient-gaming hover:shadow-neon-orange"
                                onClick={() => handleStartTournament(tournament.id)}
                                disabled={startingTournament === tournament.id}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                {startingTournament === tournament.id ? 'Starting...' : 'Start Tournament'}
                              </Button>
                            ) : tournament.status === 'in_progress' ? (
                              <Button 
                                className="flex-1 bg-gradient-gaming hover:shadow-neon-orange"
                                disabled
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Tournament in Progress
                              </Button>
                            ) : (
                              <Button 
                                className="flex-1 bg-gradient-gaming hover:shadow-neon-orange"
                                disabled
                              >
                                <Crown className="h-4 w-4 mr-2" />
                                Joined - Waiting for Players
                              </Button>
                            )
                          ) : tournament.status === 'starting' ? (
                            <Button 
                              className="flex-1"
                              disabled
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Tournament Starting...
                            </Button>
                          ) : tournament.status === 'in_progress' ? (
                            <Button 
                              className="flex-1"
                              disabled
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Tournament In Progress
                            </Button>
                          ) : tournament.participants.length >= tournament.players ? (
                            <Button 
                              className="flex-1"
                              disabled
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Tournament Full
                            </Button>
                          ) : walletBalance < tournament.entryFee ? (
                            <Button 
                              className="flex-1"
                              disabled
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Insufficient Funds (Need ${tournament.entryFee})
                            </Button>
                          ) : (
                            <Button 
                              className="flex-1"
                              disabled
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Cannot Join
                            </Button>
                          )}
                          <Button variant="outline" className="px-6">
                            <Clock className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                        </CardContent>
                      </Card>
                    );
                  })()
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-gaming rounded-full flex items-center justify-center mx-auto mb-4 shadow-neon-orange">
                      <Crown className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Active Tournament</h3>
                    <p className="text-muted-foreground mb-4">
                      No {tournamentTypes.find(t => t.key === activeTournamentType)?.name} tournament is currently active.
                    </p>
                    <Button className="bg-gradient-gaming hover:shadow-neon-orange">
                      <Star className="h-4 w-4 mr-2" />
                      Get Notified
                    </Button>
                  </div>
                )}
              </div>
            </div>
              </>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
