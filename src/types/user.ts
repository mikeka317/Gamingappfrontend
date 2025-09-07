export interface User {
  uid: string;
  email: string;
  username: string;
  isAdmin?: boolean;
  firstName?: string;
  lastName?: string;
  country?: string;
  bio?: string;
  platforms: Array<{ platform: string; onlineUserId: string }>;
  profilePicture?: string;
  rank?: string;
  winRate?: number;
  totalGames?: number;
  currentStreak?: number;
  favoriteGame?: string;
  wallet: number;
  createdAt: string | number;
  updatedAt?: string;
  lastActive?: number;
  status?: string;
}
