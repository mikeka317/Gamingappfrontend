import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { walletService } from '@/services/walletService';
import { stripeService } from '@/services/stripeService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  CreditCard, 
  Gamepad2, 
  Camera,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebaseClient';
import { apiService } from '@/services/api';
import ImageUpload from '@/components/ImageUpload';
import { API_BASE_URL } from '@/services/api';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  bio: string;
  avatar: string | null;
  joinDate: string;
  gaming: {
    preferredGames: string[];
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'professional';
    playStyle: 'casual' | 'competitive' | 'both';
  };
}

const mockUserProfile: UserProfile = {
  id: 'user_1',
  username: 'GamerPro',
  email: 'gamerpro@example.com',
  firstName: 'John',
  lastName: 'Doe',
  country: 'United States',
  bio: 'Professional gamer and esports enthusiast. Love competitive gaming and challenging opponents!',
  avatar: null,
  joinDate: '2023-01-15',
  gaming: {
    preferredGames: ['Valorant', 'CS2', 'Apex Legends', 'Fortnite'],
    skillLevel: 'advanced',
    playStyle: 'competitive',
  },
};

export default function Profile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paypalAmount, setPaypalAmount] = useState('');
  const [stripeDepositAmount, setStripeDepositAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalMethod, setWithdrawalMethod] = useState('paypal');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalType, setWithdrawalType] = useState(''); // 'paypal' or 'stripe'
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [bankRoutingNumber, setBankRoutingNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [isStripeLoading, setIsStripeLoading] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [availableGames, setAvailableGames] = useState<string[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(false);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [countries, setCountries] = useState<{ countryCode: string; countryName: string }[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState<boolean>(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [activeDepositTab, setActiveDepositTab] = useState('paypal');
  const [activeWithdrawalTab, setActiveWithdrawalTab] = useState('paypal');
  
  // Platform management states
  const [isAddingPlatform, setIsAddingPlatform] = useState(false);
  const [editingPlatformIndex, setEditingPlatformIndex] = useState<number | null>(null);
  const [newPlatform, setNewPlatform] = useState({ platform: '', onlineUserId: '' });
  const [editingPlatform, setEditingPlatform] = useState({ platform: '', onlineUserId: '' });

  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();

  // Filter transactions based on selected filter
  const getFilteredTransactions = () => {
    console.log('🔍 getFilteredTransactions called with:', {
      transactions: transactions,
      transactionsLength: transactions?.length,
      isArray: Array.isArray(transactions),
      filter: transactionFilter
    });
    
    if (!Array.isArray(transactions)) {
      console.log('⚠️ Transactions is not an array, returning empty array');
      return [];
    }
    
    let filtered;
    switch (transactionFilter) {
      case 'debit':
        filtered = transactions.filter(t => 
          t.type === 'challenge_deduction' || 
          t.type === 'withdrawal' || 
          t.type === 'admin_fee'
        );
        break;
      case 'credit':
        filtered = transactions.filter(t => 
          t.type === 'deposit' || 
          t.type === 'challenge_reward' || 
          t.type === 'refund'
        );
        break;
      default:
        filtered = transactions;
    }
    
    console.log('✅ Filtered transactions result:', {
      filter: transactionFilter,
      originalCount: transactions.length,
      filteredCount: filtered.length,
      filteredTypes: filtered.map(t => t.type)
    });
    
    return filtered;
  };

  // Calculate real totals from transactions
  const calculateTotals = () => {
    if (!Array.isArray(transactions)) return { totalDeposits: 0, totalWithdrawals: 0 };
    
    const totals = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'deposit') {
        acc.totalDeposits += Math.abs(transaction.amount);
      } else if (transaction.type === 'withdrawal') {
        acc.totalWithdrawals += Math.abs(transaction.amount);
      }
      return acc;
    }, { totalDeposits: 0, totalWithdrawals: 0 });
    
    return totals;
  };

  // Get transaction statistics from backend
  const [transactionStats, setTransactionStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalRewards: 0,
    totalDeductions: 0,
    totalTransactions: 0
  });

  const fetchTransactionStats = async () => {
    if (user) {
      try {
        const response = await fetch(`${API_BASE_URL}/wallet/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTransactionStats(data.data);
            console.log('✅ Transaction stats fetched:', data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching transaction stats:', error);
      }
    }
  };

  // Format transaction date properly
  const formatTransactionDate = (dateValue: any): string => {
    try {
      if (!dateValue) return 'Unknown date';
      
      let date: Date;
      
      // Handle different date formats
      if (dateValue.toDate) {
        // Firestore Timestamp
        date = dateValue.toDate();
      } else if (dateValue._seconds) {
        // Firestore Timestamp object
        date = new Date(dateValue._seconds * 1000);
      } else if (typeof dateValue === 'string') {
        // ISO string or other string format
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        // Already a Date object
        date = dateValue;
      } else {
        // Try to parse as number (timestamp)
        date = new Date(dateValue);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date value:', dateValue);
        return 'Invalid date';
      }
      
      // Format the date nicely
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Value:', dateValue);
      return 'Invalid date';
    }
  };

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (user) {
      try {
        const balance = await walletService.getWalletBalance();
        setWalletBalance(balance);
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        // Keep the default balance if fetch fails
      }
    }
  };

  // Handle wallet balance updates
  const handleWalletUpdate = (newBalance: number) => {
    setWalletBalance(newBalance);
  };

  // Fetch user transactions
  const fetchTransactions = async () => {
    if (user) {
      try {
        setIsLoadingTransactions(true);
        console.log('🔍 Fetching transactions for user:', user.uid);
        
        const userTransactions = await walletService.getTransactions();
        console.log('🔍 Fetched transactions response:', userTransactions);
        console.log('🔍 Transactions array length:', userTransactions?.length);
        console.log('🔍 Transactions is array:', Array.isArray(userTransactions));
        
        // Debug: Log the first transaction structure
        if (userTransactions && userTransactions.length > 0) {
          console.log('🔍 First transaction structure:', {
            transaction: userTransactions[0],
            createdAt: userTransactions[0].createdAt,
            createdAtType: typeof userTransactions[0].createdAt,
            hasToDate: !!(userTransactions[0] as any)?.createdAt?.toDate,
            hasSeconds: !!(userTransactions[0] as any)?.createdAt?._seconds
          });
        }
        
        if (Array.isArray(userTransactions)) {
          console.log('✅ Setting transactions state with:', userTransactions.length, 'transactions');
          setTransactions(userTransactions);
        } else {
          console.warn('⚠️ Transactions response is not an array:', userTransactions);
          setTransactions([]);
        }
      } catch (error) {
        console.error('❌ Error fetching transactions:', error);
        setTransactions([]); // Set empty array if fetch fails
      } finally {
        setIsLoadingTransactions(false);
      }
    }
  };

  // Handle Stripe deposit
  const handleStripeDeposit = async () => {
    if (!stripeDepositAmount || parseFloat(stripeDepositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than $0",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(stripeDepositAmount);
    
    // Validate amount range
    if (amount < 1 || amount > 1000) {
      toast({
        title: "Invalid Amount",
        description: "Amount must be between $1 and $1000",
        variant: "destructive",
      });
      return;
    }

    // Debug: Check authentication status
    const authToken = localStorage.getItem('authToken');
    console.log('🔐 Auth check for Stripe deposit:', {
      hasUser: !!user,
      hasToken: !!authToken,
      tokenLength: authToken?.length,
      userId: user?.uid,
      username: user?.username
    });

    if (!user || !authToken) {
      toast({
        title: "Authentication Error",
        description: "Please log in to make a deposit",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsStripeLoading(true);
      
      console.log('💳 Creating Stripe checkout session for:', {
        amount,
        userId: user.uid,
        username: user.username
      });
      
      // Create Stripe checkout session
      const checkoutSession = await stripeService.createCheckoutSession(
        amount, 
        'Wallet deposit via Stripe'
      );
      
      console.log('💳 Stripe checkout session created:', checkoutSession);
      
      // Redirect to Stripe checkout
      await stripeService.redirectToCheckout(checkoutSession.url);
      
      // Clear the amount input
      setStripeDepositAmount('');
      
      toast({
        title: "Redirecting to Stripe",
        description: "You will be redirected to complete your payment",
      });
      
    } catch (error: any) {
      console.error('Error creating Stripe checkout session:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setIsStripeLoading(false);
    }
  };

  // Initialize profile from user context and fetch wallet balance
  useEffect(() => {
    if (user) {
      setProfile({
        id: user.uid,
        username: user.username,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        country: user.country || '',
        bio: user.bio || '',
        avatar: user.profilePicture || null,
        joinDate: typeof user.createdAt === 'number' ? new Date(user.createdAt).toISOString() : (user.createdAt as string),
        gaming: {
          preferredGames: Array.isArray((user as any)?.gaming?.preferredGames) ? (user as any).gaming.preferredGames : [],
          skillLevel: ((user as any)?.gaming?.skillLevel || 'beginner') as any,
          playStyle: ((user as any)?.gaming?.playStyle || 'casual') as any,
        },
      });
      
      // Fetch wallet balance and transactions
      fetchWalletBalance();
      fetchTransactions();
      fetchTransactionStats();
    }
  }, [user]);

  // Load games for Preferred Games
  useEffect(() => {
    const loadGames = async () => {
      try {
        setIsLoadingGames(true);
        setGamesError(null);
        const res = await apiService.get<{ id: number; gameName: string; isPublic: boolean }[]>(`/games?publicOnly=true`);
        if (!res.success || !res.data) throw new Error(res.message || 'Failed to fetch games');
        const names = (res.data || []).map(g => g.gameName).sort((a, b) => a.localeCompare(b));
        setAvailableGames(names);
      } catch (e) {
        setGamesError(e instanceof Error ? e.message : 'Failed to load games');
        setAvailableGames([]);
      } finally {
        setIsLoadingGames(false);
      }
    };
    loadGames();
  }, []);

  // Load countries for General > Country dropdown
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setIsLoadingCountries(true);
        setCountriesError(null);
        const res = await apiService.getPublic<{ countryCode: string; countryName: string }[]>(`/helpers/countries`);
        if (!res.success || !res.data) throw new Error(res.message || 'Failed to fetch countries');
        setCountries(res.data);
      } catch (e) {
        setCountriesError(e instanceof Error ? e.message : 'Failed to load countries');
        setCountries([]);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  // Handle Stripe and PayPal payment success/cancel from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const sessionId = urlParams.get('session_id');
    const token = urlParams.get('token'); // PayPal token
    const PayerID = urlParams.get('PayerID'); // PayPal PayerID
    // PayPal redirects with 'token' which is the order id in Checkout SDK flow
    const paypalOrderId = token;

    if (success === 'true') {
      if (sessionId) {
        // This is a Stripe payment
        console.log('✅ Stripe payment successful:', sessionId);
        toast({
          title: "Payment Successful!",
          description: "Your funds have been added to your wallet. Please wait a moment for the balance to update.",
        });
        
        // Try to manually verify the payment if webhook didn't work
        setTimeout(async () => {
          try {
            console.log('🔍 Attempting manual payment verification for session:', sessionId);
            const verificationResult = await stripeService.verifyPayment(sessionId);
            console.log('✅ Manual verification result:', verificationResult);
            
            if (verificationResult.status === 'processed') {
              toast({
                title: "Payment Verified!",
                description: `Successfully added $${verificationResult.amount} to your wallet.`,
              });
            }
          } catch (error) {
            console.error('❌ Manual verification failed:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if your wallet balance doesn't update.",
              variant: "destructive",
            });
          }
          
          // Refresh wallet balance and transactions
          fetchWalletBalance();
          fetchTransactions();
          fetchTransactionStats();
        }, 3000); // Wait 3 seconds for webhook to process, then try manual verification
        
      } else if (paypalOrderId) {
        // This is a PayPal payment
        console.log('✅ PayPal payment successful:', { paypalOrderId, PayerID });
        toast({
          title: "PayPal Payment Successful!",
          description: "Verifying your payment and updating your balance...",
        });

        // Attempt to verify/capture and credit wallet
        (async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/wallet/paypal/verify-payment`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ orderId: paypalOrderId })
            });

            const data = await response.json();
            if (response.ok && data.success) {
              toast({
                title: "Payment Verified",
                description: `Successfully added $${Number(data.data?.amount || 0).toFixed(2)} to your wallet.`,
              });
            } else {
              // If verification failed, still refresh in case webhook credited it
              console.warn('⚠️ PayPal verification failed:', data);
              toast({
                title: "Verification Pending",
                description: "If your balance doesn't update in a minute, please contact support.",
              });
            }
          } catch (err) {
            console.error('❌ PayPal verification error:', err);
            toast({
              title: "Verification Error",
              description: "We couldn't verify your PayPal payment. If your balance doesn't update, please contact support.",
              variant: 'destructive',
            });
          } finally {
            // Refresh wallet balance and transactions
            await fetchWalletBalance();
            await fetchTransactions();
            await fetchTransactionStats();
          }
        })();
      }
      
      // Clean up URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      
    } else if (canceled === 'true') {
      console.log('❌ Payment cancelled');
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. No funds were charged.",
        variant: "destructive",
      });
      
      // Clean up URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchWalletBalance, fetchTransactions, fetchTransactionStats, toast]);

  const handleProfileUpdate = (field: keyof UserProfile, value: any) => {
    setProfile(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleGamingUpdate = (field: string, value: any) => {
    setProfile(prev => prev ? ({
      ...prev,
      gaming: {
        ...prev.gaming,
        [field]: value
      }
    }) : null);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    // Validate username if it was changed
    if (profile.username !== user?.username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(profile.username)) {
        toast({
          title: "Validation Error",
          description: "Username must be 3-20 characters and contain only letters, numbers, and underscores",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      await updateUserProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        country: profile.country,
        bio: profile.bio,
        username: profile.username,
        profilePicture: profile.avatar || undefined
      });

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast({ title: 'Validation Error', description: 'Please fill all password fields', variant: 'destructive' });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ title: 'Validation Error', description: 'New passwords do not match', variant: 'destructive' });
        return;
      }
      if (newPassword.length < 8) {
        toast({ title: 'Validation Error', description: 'Password must be at least 8 characters long', variant: 'destructive' });
        return;
      }

      const current = firebaseAuth.currentUser;
      if (!current) {
        toast({ title: 'Not Signed In', description: 'Please log in again and retry', variant: 'destructive' });
        return;
      }
      const emailAddr = user?.email || current.email;
      if (!emailAddr) {
        toast({ title: 'Error', description: 'No email associated with this account', variant: 'destructive' });
        return;
      }

      // Re-authenticate then update password
      const credential = EmailAuthProvider.credential(emailAddr, currentPassword);
      await reauthenticateWithCredential(current, credential);
      await updatePassword(current, newPassword);

      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      toast({ title: 'Password Updated', description: 'Your password has been changed successfully' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleImageUploaded = (imageUrl: string) => {
    if (profile) {
      console.log('🖼️ Profile image updated:', imageUrl);
      
      // Update the profile immediately to show preview
      setProfile({
        ...profile,
        avatar: imageUrl || null
      });
      
      // Only show success message for actual uploads (not previews)
      if (imageUrl && !imageUrl.startsWith('data:')) {
        toast({
          title: "Profile image updated!",
          description: "Your profile picture has been updated successfully",
        });
      }
    }
  };

  // Platform management functions
  const handleAddPlatform = async () => {
    if (!newPlatform.platform.trim() || !newPlatform.onlineUserId.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both platform and online user ID",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate platforms
    const existingPlatform = user?.platforms?.find(p => p.platform === newPlatform.platform.trim());
    if (existingPlatform) {
      toast({
        title: "Duplicate Platform",
        description: `${newPlatform.platform} platform is already connected. Please edit the existing one instead.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedPlatforms = [...(user?.platforms || []), {
        platform: newPlatform.platform.trim(),
        onlineUserId: newPlatform.onlineUserId.trim()
      }];

      await updateUserProfile({
        platforms: updatedPlatforms
      });

      setNewPlatform({ platform: '', onlineUserId: '' });
      setIsAddingPlatform(false);
      
      toast({
        title: "Platform Added!",
        description: `${newPlatform.platform} platform has been added successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add platform",
        variant: "destructive",
      });
    }
  };

  const handleEditPlatform = async () => {
    if (!editingPlatform.platform.trim() || !editingPlatform.onlineUserId.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both platform and online user ID",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate platforms (excluding the current one being edited)
    const existingPlatform = user?.platforms?.find((p, index) => 
      index !== editingPlatformIndex && p.platform === editingPlatform.platform.trim()
    );
    if (existingPlatform) {
      toast({
        title: "Duplicate Platform",
        description: `${editingPlatform.platform} platform is already connected. Please choose a different platform.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedPlatforms = [...(user?.platforms || [])];
      if (editingPlatformIndex !== null) {
        updatedPlatforms[editingPlatformIndex] = {
          platform: editingPlatform.platform.trim(),
          onlineUserId: editingPlatform.onlineUserId.trim()
        };
      }

      await updateUserProfile({
        platforms: updatedPlatforms
      });

      setEditingPlatformIndex(null);
      setEditingPlatform({ platform: '', onlineUserId: '' });
      
      toast({
        title: "Platform Updated!",
        description: `${editingPlatform.platform} platform has been updated successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update platform",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlatform = async (index: number) => {
    const platform = user?.platforms?.[index];
    if (!platform) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove the ${platform.platform} platform?\n\nThis will remove your connection to ${platform.platform} and your online user ID "${platform.onlineUserId}".`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const updatedPlatforms = [...(user?.platforms || [])];
      const deletedPlatform = updatedPlatforms.splice(index, 1)[0];
      
      await updateUserProfile({
        platforms: updatedPlatforms
      });
      
      toast({
        title: "Platform Deleted!",
        description: `${deletedPlatform.platform} platform has been removed`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete platform",
        variant: "destructive",
      });
    }
  };

  const startEditPlatform = (index: number) => {
    const platform = user?.platforms?.[index];
    if (platform) {
      setEditingPlatformIndex(index);
      setEditingPlatform({
        platform: platform.platform,
        onlineUserId: platform.onlineUserId
      });
    }
  };

  const cancelEditPlatform = () => {
    setEditingPlatformIndex(null);
    setEditingPlatform({ platform: '', onlineUserId: '' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1">
          <Navbar 
            onMenuClick={() => setSidebarOpen(true)} 
            walletBalance={walletBalance}
            onWalletUpdate={handleWalletUpdate}
          />
          
          <main className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-orbitron font-bold bg-gradient-gaming bg-clip-text text-transparent">
                  Profile Settings
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground font-inter">
                  Manage your account and preferences
                </p>
              </div>

              <div className="flex gap-2 sm:gap-3">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Reset profile to original user data when canceling
                        if (user) {
                          setProfile({
                            id: user.uid,
                            username: user.username,
                            email: user.email,
                            firstName: user.firstName || '',
                            lastName: user.lastName || '',
                            country: user.country || '',
                            bio: user.bio || '',
                            avatar: user.profilePicture || null,
                            joinDate: typeof user.createdAt === 'number' ? new Date(user.createdAt).toISOString() : (user.createdAt as string),
                            gaming: {
                              preferredGames: [],
                              skillLevel: 'beginner',
                              playStyle: 'casual',
                            },
                          });
                        }
                        setIsEditing(false);
                      }}
                      className="hover:bg-secondary/80 text-xs sm:text-sm px-3 sm:px-4 py-2"
                    >
                      <X className="h-4 w-4 mr-1 sm:mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isLoading}
                      className="bg-gradient-gaming hover:shadow-neon-orange transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4 py-2"
                    >
                      <Save className="h-4 w-4 mr-1 sm:mr-2" />
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-gaming hover:shadow-neon-orange transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4 py-2"
                  >
                    <Edit3 className="h-4 w-4 mr-1 sm:mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Tabs */}
            <Tabs defaultValue="general" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50 backdrop-blur-sm">
                <TabsTrigger value="general" className="font-inter font-medium text-xs sm:text-sm">General</TabsTrigger>
                <TabsTrigger value="wallet" className="font-inter font-medium text-xs sm:text-sm">Wallet</TabsTrigger>
                <TabsTrigger value="gaming" className="font-inter font-medium text-xs sm:text-sm">Gaming</TabsTrigger>
              </TabsList>

              {/* General Profile Settings */}
              <TabsContent value="general" className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                     {/* Profile Picture */}
                   <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                     <CardHeader>
                       <CardTitle className="font-orbitron text-base sm:text-lg">Profile Picture</CardTitle>
                       <CardDescription className="text-xs sm:text-sm">Update your avatar</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-3 sm:space-y-4">
                       <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                         <div className="relative inline-block">
                           <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-border/50">
                             <AvatarImage 
                               src={profile.avatar || undefined} 
                               alt={`${profile.firstName} ${profile.lastName}`}
                             />
                             <AvatarFallback className="bg-gradient-gaming text-primary-foreground font-orbitron text-lg sm:text-xl lg:text-2xl">
                               {profile.firstName && profile.firstName[0]}{profile.lastName && profile.lastName[0]}
                             </AvatarFallback>
                           </Avatar>
                           
                           {/* Remove button for profile image when editing */}
                           {isEditing && profile.avatar && (
                             <Button
                               size="sm"
                               variant="destructive"
                               className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                               onClick={() => handleImageUploaded('')}
                               disabled={false}
                             >
                               <X className="w-3 h-3" />
                             </Button>
                           )}
                         </div>
                         <ImageUpload
                           onImageUploaded={handleImageUploaded}
                           currentImageUrl={profile.avatar}
                           className="w-full sm:w-auto"
                           isEditing={isEditing}
                         />
                       </div>
                     </CardContent>
                   </Card>

                  {/* Account Info */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="font-orbitron text-base sm:text-lg">Account Info</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Basic account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="font-inter font-medium text-xs sm:text-sm">Username</Label>
                          {isEditing ? (
                            <div className="space-y-1">
                              <Input
                                id="username"
                                value={profile.username}
                                onChange={(e) => handleProfileUpdate('username', e.target.value)}
                                disabled
                                className="bg-secondary/30 border-border/50 text-sm sm:text-base"
                                placeholder="Enter username"
                              />
                              <p className="text-xs text-muted-foreground">
                                Username must be 3-20 characters and contain only letters, numbers, and underscores
                              </p>
                              {profile.username !== user?.username && (
                                <p className="text-xs text-amber-500">
                                  ⚠️ Username will be changed from "{user?.username}" to "{profile.username}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="font-orbitron font-semibold text-sm sm:text-base">{profile.username}</span>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="font-inter text-xs sm:text-sm">Email</span>
                          <span className="text-xs sm:text-sm text-muted-foreground">{profile.email}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="font-inter text-xs sm:text-sm">Member Since</span>
                          <span className="text-xs sm:text-sm text-muted-foreground">{formatDate(profile.joinDate)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="font-inter text-xs sm:text-sm">Gaming Platforms</span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {user?.platforms ? `${user.platforms.length} connected` : 'None'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Personal Information */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="font-orbitron text-base sm:text-lg">Personal Information</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="font-inter font-medium text-xs sm:text-sm">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile.firstName}
                          onChange={(e) => handleProfileUpdate('firstName', e.target.value)}
                          disabled={!isEditing}
                          className="bg-secondary/30 border-border/50 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="font-inter font-medium text-xs sm:text-sm">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile.lastName}
                          onChange={(e) => handleProfileUpdate('lastName', e.target.value)}
                          disabled={!isEditing}
                          className="bg-secondary/30 border-border/50 text-sm sm:text-base"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-inter font-medium text-xs sm:text-sm">Country</Label>
                        <Select 
                          value={profile.country} 
                          onValueChange={(value) => handleProfileUpdate('country', value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className="bg-secondary/30 border-border/50 text-sm sm:text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingCountries && (
                              <div className="p-2 text-xs text-muted-foreground">Loading countries...</div>
                            )}
                            {!isLoadingCountries && countriesError && (
                              <div className="p-2 text-xs text-destructive">{countriesError}</div>
                            )}
                            {!isLoadingCountries && !countriesError && countries.length === 0 && (
                              <div className="p-2 text-xs text-muted-foreground">No countries found</div>
                            )}
                            {!isLoadingCountries && !countriesError && countries.map((c) => (
                              <SelectItem key={c.countryCode} value={c.countryName}>{c.countryName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="font-inter font-medium text-xs sm:text-sm">
                        Bio
                      </Label>
                      <Textarea
                        id="bio"
                        value={profile.bio}
                        onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                        disabled={!isEditing}
                        className="bg-secondary/30 border-border/50 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>


                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="font-orbitron">Security</CardTitle>
                    <CardDescription>Change your account password</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="bg-secondary/30 border-border/50 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-secondary/30 border-border/50"
                          placeholder="Minimum 8 characters"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-secondary/30 border-border/50"
                          placeholder="Confirm your new password"
                        />
                      </div>
                      <Button
                        onClick={handlePasswordChange}
                        className="w-full bg-gradient-gaming hover:shadow-neon-orange transition-all duration-300"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Wallet Settings */}
              <TabsContent value="wallet" className="space-y-6">
                {/* Wallet Overview */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-orbitron">Wallet Overview</CardTitle>
                        <CardDescription>Manage your wallet balance and transactions</CardDescription>
                      </div>
                      <Button
                        onClick={fetchWalletBalance}
                        variant="outline"
                        size="sm"
                        className="bg-secondary/30 border-border/50 hover:bg-secondary/50"
                      >
                        Refresh Balance
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gradient-glow border border-border/30 rounded-lg">
                        <div className="text-2xl font-orbitron font-bold text-primary mb-2">
                          ${walletBalance.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Current Balance</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-glow border border-border/30 rounded-lg">
                        <div className="text-2xl font-orbitron font-bold text-success mb-2">
                          ${transactionStats.totalDeposits.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Deposits</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-glow border border-border/30 rounded-lg">
                        <div className="text-2xl font-orbitron font-bold text-warning mb-2">
                          ${transactionStats.totalWithdrawals.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Withdrawals</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                                {/* Deposit and Withdrawal Options */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Deposit Options */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="font-orbitron">Deposit Funds</CardTitle>
                      <CardDescription>Add money to your wallet using your preferred method</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={activeDepositTab} onValueChange={setActiveDepositTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="paypal" className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">PP</span>
                            </div>
                            PayPal
                          </TabsTrigger>
                          <TabsTrigger value="bank" className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-purple-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs">💳</span>
                            </div>
                            Bank Cards
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="paypal" className="space-y-4 mt-6">
                      <div className="p-4 border border-border/30 rounded-lg bg-gradient-glow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">PP</span>
                          </div>
                          <div>
                                <h4 className="font-orbitron font-semibold">Deposit via PayPal</h4>
                                <p className="text-xs text-muted-foreground">Instant deposits with PayPal</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Input
                            type="number"
                            placeholder="Amount ($)"
                            className="bg-secondary/30 border-border/50"
                            min="1"
                            step="0.01"
                            value={paypalAmount}
                            onChange={(e) => setPaypalAmount(e.target.value)}
                          />
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700 hover:shadow-neon-blue transition-all duration-300"
                            onClick={async () => {
                              if (paypalAmount && parseFloat(paypalAmount) > 0) {
                                try {
                                  // Use the new PayPal deposit endpoint
                                  const response = await fetch(`${API_BASE_URL}/wallet/paypal-deposit`, {
                                    method: 'POST',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                                      'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                      amount: parseFloat(paypalAmount),
                                      description: `PayPal deposit of $${paypalAmount}`
                                    })
                                  });
                                  
                                  if (response.ok) {
                                    const data = await response.json();
                                    if (data.success) {
                                      const approvalUrl = data?.data?.approvalUrl;
                                      if (approvalUrl) {
                                        // Redirect user to PayPal approval
                                        window.location.href = approvalUrl;
                                        return;
                                      }
                                      // Fallback: no approvalUrl returned
                                      toast({
                                        title: "PayPal Order Created",
                                        description: "Continuing without redirect. Please try again if not prompted by PayPal.",
                                      });
                                    } else {
                                      throw new Error(data.message || 'PayPal deposit failed');
                                    }
                                  } else {
                                    throw new Error('PayPal deposit failed');
                                  }
                                } catch (error: any) {
                                  console.error('PayPal deposit error:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to process PayPal deposit",
                                    variant: "destructive",
                                  });
                                }
                              } else {
                                alert('Please enter a valid amount.');
                              }
                            }}
                          >
                            Deposit with PayPal
                          </Button>
                        </div>
                      </div>
                        </TabsContent>

                        <TabsContent value="bank" className="space-y-4 mt-6">
                      <div className="p-4 border border-border/30 rounded-lg bg-gradient-glow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">💳</span>
                          </div>
                          <div>
                                <h4 className="font-orbitron font-semibold">Deposit via Bank Cards</h4>
                                <p className="text-xs text-muted-foreground">Credit/Debit cards via Stripe</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <Input
                            type="number"
                            placeholder="Amount ($)"
                            className="bg-secondary/30 border-border/50"
                            min="1"
                            step="0.01"
                            value={stripeDepositAmount}
                            onChange={(e) => setStripeDepositAmount(e.target.value)}
                          />
                          <Button 
                            className="w-full bg-purple-600 hover:bg-purple-700 hover:shadow-neon-purple transition-all duration-300"
                            onClick={handleStripeDeposit}
                            disabled={isStripeLoading}
                          >
                            {isStripeLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Creating Payment...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>💳</span>
                                    Deposit with Bank Card
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Right Column: Withdrawal Options */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="font-orbitron">Withdraw Funds</CardTitle>
                      <CardDescription>Withdraw your winnings using your preferred method</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={activeWithdrawalTab} onValueChange={setActiveWithdrawalTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="paypal" className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs font-bold">PP</span>
                          </div>
                            PayPal
                          </TabsTrigger>
                          <TabsTrigger value="bank" className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-600 rounded flex items-center justify-center">
                              <span className="text-white text-xs">🏦</span>
                          </div>
                            Bank Cards
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="paypal" className="space-y-4 mt-6">
                        <div className={`p-4 border border-border/30 rounded-lg bg-gradient-glow relative ${isWithdrawing && withdrawalType === 'paypal' ? 'opacity-75' : ''}`}>
                          {isWithdrawing && withdrawalType === 'paypal' && (
                            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-10">
                              <div className="bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg">
                                <div className="flex items-center gap-3">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                  <span className="font-semibold">Processing PayPal Withdrawal...</span>
                        </div>
                                            </div>
                            </div>
                          )}
                                                  <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">PP</span>
                            </div>
                            <div>
                                <h4 className="font-orbitron font-semibold">Withdraw via PayPal</h4>
                                <p className="text-xs text-muted-foreground">Instant PayPal withdrawals</p>
                            </div>
                          </div>
                        
                        <div className="space-y-3">
                          <Input
                            type="number"
                            placeholder="Amount ($)"
                            className="bg-secondary/30 border-border/50"
                            min="1"
                            max={walletBalance}
                            step="0.01"
                            value={withdrawalAmount}
                            onChange={(e) => setWithdrawalAmount(e.target.value)}
                                disabled={isWithdrawing}
                          />
                          
                          <Input
                            type="email"
                            placeholder="PayPal Email for payout"
                            className="bg-secondary/30 border-border/50"
                            value={paypalEmail}
                            onChange={(e) => setPaypalEmail(e.target.value)}
                            disabled={isWithdrawing}
                          />
                          <p className="text-xs text-muted-foreground">
                                Withdrawals will be sent to: {paypalEmail || 'your PayPal email'}
                              </p>
                              
                              <div className="text-xs text-muted-foreground bg-secondary/20 p-3 rounded-lg">
                                <p className="font-semibold mb-2">PayPal Withdrawal Requirements:</p>
                                <ul className="space-y-1">
                                  <li>• Valid PayPal email address</li>
                                  <li>• Minimum withdrawal: $10.00</li>
                                  <li>• Instant processing</li>
                                </ul>
                              </div>

                              <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700 hover:shadow-neon-blue transition-all duration-300"
                                onClick={async () => {
                                  // Validate withdrawal amount
                                  if (!withdrawalAmount || parseFloat(withdrawalAmount) < 10) {
                                    alert('Minimum withdrawal amount is $10.00');
                                    return;
                                  }
                                  
                                  // Validate PayPal email
                                  if (!paypalEmail || !paypalEmail.includes('@')) {
                                    alert('Please enter a valid PayPal email address');
                                    return;
                                  }
                                  
                                  setIsWithdrawing(true);
                                  setWithdrawalType('paypal');
                                  
                                  try {
                                    // Use the new withdrawal endpoint
                                    const response = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        amount: parseFloat(withdrawalAmount),
                                        description: `PayPal withdrawal of $${withdrawalAmount}`,
                                        preferredPayoutMethod: 'paypal',
                                        payoutEmail: paypalEmail
                                      })
                                    });
                                    
                                    const data = await response.json();
                                    if (response.ok && data.success) {
                                      await fetchWalletBalance(); // Refresh balance
                                      await fetchTransactions(); // Refresh transactions
                                      await fetchTransactionStats(); // Refresh stats
                                      
                                      toast({
                                        title: "Success",
                                        description: `PayPal withdrawal of $${withdrawalAmount} initiated successfully`,
                                      });
                                      
                                      setWithdrawalAmount('');
                                    } else {
                                      if (data.error && data.error.message) {
                                        throw new Error(data.error.message);
                                      } else if (data.message) {
                                        throw new Error(data.message);
                                      } else {
                                        throw new Error(`Withdrawal failed: ${response.status} ${response.statusText}`);
                                      }
                                    }
                                  } catch (error: any) {
                                    console.error('PayPal withdrawal error:', error);
                                    toast({
                                      title: "Error",
                                      description: "Failed to process PayPal withdrawal",
                                      variant: "destructive",
                                    });
                                  } finally {
                                    setIsWithdrawing(false);
                                    setWithdrawalType('');
                                  }
                                }}
                                disabled={walletBalance < 10 || isWithdrawing}
                              >
                                {isWithdrawing && withdrawalType === 'paypal' ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing PayPal Withdrawal...
                                  </>
                                ) : walletBalance < 10 ? 'Minimum $10 required' : 'Withdraw via PayPal'}
                              </Button>
                          </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="bank" className="space-y-4 mt-6">
                          <div className={`p-4 border border-border/30 rounded-lg bg-gradient-glow relative ${isWithdrawing && withdrawalType === 'stripe' ? 'opacity-75' : ''}`}>
                            {isWithdrawing && withdrawalType === 'stripe' && (
                              <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-10">
                                <div className="bg-white/90 dark:bg-gray-800/90 p-4 rounded-lg shadow-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                                    <span className="font-semibold">Processing Bank Withdrawal...</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">🏦</span>
                              </div>
                              <div>
                                <h4 className="font-orbitron font-semibold">Withdraw via Bank Cards</h4>
                                <p className="text-xs text-muted-foreground">Bank transfer via Stripe</p>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <Input
                                type="number"
                                placeholder="Amount ($)"
                                className="bg-secondary/30 border-border/50"
                                min="1"
                                max={walletBalance}
                                step="0.01"
                                value={withdrawalAmount}
                                onChange={(e) => setWithdrawalAmount(e.target.value)}
                                disabled={isWithdrawing}
                              />
                              
                              {/* Bank Account Details */}
                            <div className="space-y-3 p-4 bg-secondary/20 rounded-lg border border-border/30">
                              <h4 className="font-semibold text-sm">Bank Account Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label htmlFor="account-holder" className="text-xs">
                                    Account Holder Name
                                  </Label>
                                  <Input
                                    id="account-holder"
                                    type="text"
                                    placeholder="John Doe"
                                    className="bg-secondary/30 border-border/50 text-sm"
                                    value={bankAccountHolder}
                                    onChange={(e) => setBankAccountHolder(e.target.value)}
                                    disabled={isWithdrawing}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label htmlFor="routing-number" className="text-xs">
                                    Routing Number
                                  </Label>
                                  <Input
                                    id="routing-number"
                                    type="text"
                                    placeholder="123456789"
                                    className="bg-secondary/30 border-border/50 text-sm"
                                    value={bankRoutingNumber}
                                    onChange={(e) => setBankRoutingNumber(e.target.value)}
                                    disabled={isWithdrawing}
                                  />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                  <Label htmlFor="account-number" className="text-xs">
                                    Account Number
                                  </Label>
                                  <Input
                                    id="account-number"
                                    type="text"
                                    placeholder="1234567890"
                                    className="bg-secondary/30 border-border/50 text-sm"
                                    value={bankAccountNumber}
                                    onChange={(e) => setBankAccountNumber(e.target.value)}
                                    disabled={isWithdrawing}
                                  />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Your bank details are encrypted and securely stored for processing withdrawals.
                              </p>
                            </div>
                          
                          <div className="text-xs text-muted-foreground bg-secondary/20 p-3 rounded-lg">
                                <p className="font-semibold mb-2">Bank Withdrawal Requirements:</p>
                            <ul className="space-y-1">
                                  <li>• Complete bank account details</li>
                                  <li>• Valid routing number (9 digits)</li>
                              <li>• Minimum withdrawal: $10.00</li>
                                  <li>• Processing time: 2-7 business days (via Stripe)</li>
                                  <li>• Funds deducted immediately from wallet</li>
                            </ul>
                          </div>

                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 hover:shadow-neon-green transition-all duration-300"
                            onClick={async () => {
                              // Validate withdrawal amount
                              if (!withdrawalAmount || parseFloat(withdrawalAmount) < 10) {
                                alert('Minimum withdrawal amount is $10.00');
                                return;
                              }
                              
                                  // Validate bank details
                                if (!bankAccountHolder || !bankRoutingNumber || !bankAccountNumber) {
                                    alert('Please fill in all bank account details');
                                  return;
                                }
                                
                                if (bankRoutingNumber.length !== 9) {
                                  alert('Routing number must be 9 digits');
                                  return;
                                }
                                
                                if (bankAccountNumber.length < 4) {
                                  alert('Account number must be at least 4 digits');
                                  return;
                                }
                                
                                setIsWithdrawing(true);
                                setWithdrawalType('stripe');
                              
                              try {
                                // Use the new withdrawal endpoint
                                const response = await fetch(`${API_BASE_URL}/wallet/withdraw`, {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                    amount: parseFloat(withdrawalAmount),
                                        description: `Bank withdrawal of $${withdrawalAmount}`,
                                        preferredPayoutMethod: 'stripe',
                                        bankDetails: {
                                      accountHolderName: bankAccountHolder,
                                      routingNumber: bankRoutingNumber,
                                      accountNumber: bankAccountNumber
                                        }
                                  })
                                });
                                
                                const data = await response.json();
                                if (response.ok && data.success) {
                                  await fetchWalletBalance(); // Refresh balance
                                  await fetchTransactions(); // Refresh transactions
                                  await fetchTransactionStats(); // Refresh stats
                                  
                                      // Show success message with Stripe payout details if available
                                      if (data.data?.stripePayoutId) {
                                    toast({
                                      title: "Success",
                                          description: `Bank withdrawal of $${withdrawalAmount} processed successfully! Payout ID: ${data.data.stripePayoutId}. Money will arrive in 2-7 business days.`,
                                    });
                                      } else if (data.data?.stripeTransferId) {
                                        // Fallback for old transfer format
                                    toast({
                                      title: "Success",
                                          description: `Bank withdrawal of $${withdrawalAmount} processed successfully! Transfer ID: ${data.data.stripeTransferId}. Check your Stripe dashboard for real-time updates.`,
                                    });
                                  } else {
                                    toast({
                                      title: "Success",
                                          description: `Bank withdrawal of $${withdrawalAmount} submitted for processing. Bank transfer will be processed within 2-5 business days.`,
                                    });
                                  }
                                  
                                  setWithdrawalAmount('');
                                      // Clear bank details
                                    setBankAccountHolder('');
                                    setBankRoutingNumber('');
                                    setBankAccountNumber('');
                                } else {
                                      // Handle HTTP error responses
                                  if (data.error && data.error.message) {
                                    throw new Error(data.error.message);
                                  } else if (data.message) {
                                    throw new Error(data.message);
                                  } else {
                                    throw new Error(`Withdrawal failed: ${response.status} ${response.statusText}`);
                                  }
                                }
                              } catch (error: any) {
                                    console.error('Bank withdrawal error:', error);
                                
                                // Show specific error message for Stripe Connect failures
                                    if (error.message) {
                                  if (error.message.includes('Stripe Connect transfer failed')) {
                                    toast({
                                      title: "Stripe Connect Failed",
                                      description: "Bank transfer failed. Please check your bank details and try again.",
                                      variant: "destructive",
                                    });
                                  } else if (error.message.includes('Invalid routing number')) {
                                    toast({
                                      title: "Invalid Bank Details",
                                      description: "Please check your routing and account numbers.",
                                      variant: "destructive",
                                    });
                                  } else {
                                    toast({
                                      title: "Stripe Error",
                                      description: error.message,
                                      variant: "destructive",
                                    });
                                  }
                                } else {
                                  toast({
                                    title: "Error",
                                        description: "Failed to process bank withdrawal",
                                    variant: "destructive",
                                  });
                                }
                              } finally {
                                setIsWithdrawing(false);
                                setWithdrawalType('');
                              }
                            }}
                            disabled={walletBalance < 10 || isWithdrawing}
                          >
                                {isWithdrawing && withdrawalType === 'stripe' ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing Bank Withdrawal...
                                  </>
                                ) : walletBalance < 10 ? 'Minimum $10 required' : 'Withdraw via Bank Transfer'}
                          </Button>
                        </div>
                      </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>

                {/* Transaction History */}
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-orbitron">Transaction History</CardTitle>
                        <CardDescription>
                          View your recent deposits and withdrawals
                          {transactionFilter !== 'all' && (
                            <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                              {getFilteredTransactions().length} {transactionFilter === 'credit' ? 'credits' : 'debits'}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Transaction Filter Buttons */}
                        <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1 border border-border/30">
                          <Button
                            variant={transactionFilter === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTransactionFilter('all')}
                            className={`text-xs px-3 py-1 h-8 ${
                              transactionFilter === 'all' 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'hover:bg-secondary/50'
                            }`}
                          >
                            All
                          </Button>
                          <Button
                            variant={transactionFilter === 'credit' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTransactionFilter('credit')}
                            className={`text-xs px-3 py-1 h-8 ${
                              transactionFilter === 'credit' 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'hover:bg-secondary/50'
                            }`}
                          >
                            Credit
                          </Button>
                          <Button
                            variant={transactionFilter === 'debit' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setTransactionFilter('debit')}
                            className={`text-xs px-3 py-1 h-8 ${
                              transactionFilter === 'debit' 
                                ? 'bg-primary text-primary-foreground shadow-sm' 
                                : 'hover:bg-secondary/50'
                            }`}
                          >
                            Debit
                          </Button>
                        </div>
                        <Button
                          onClick={fetchTransactions}
                          variant="outline"
                          size="sm"
                          className="bg-secondary/30 border-border/50 hover:bg-secondary/50"
                          disabled={isLoadingTransactions}
                        >
                          {isLoadingTransactions ? 'Loading...' : 'Refresh'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTransactions ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                        <p className="text-muted-foreground">Loading transactions...</p>
                      </div>
                    ) : !Array.isArray(transactions) || transactions.length === 0 ? (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <h3 className="text-lg font-orbitron font-semibold mb-2">No transactions yet</h3>
                        <p className="text-muted-foreground font-inter">
                          Your transaction history will appear here once you make deposits or withdrawals
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {getFilteredTransactions().length === 0 ? (
                          <div className="text-center py-8">
                            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <h3 className="text-lg font-orbitron font-semibold mb-2">
                              No {transactionFilter === 'all' ? '' : transactionFilter} transactions found
                            </h3>
                            <p className="text-muted-foreground font-inter">
                              {transactionFilter === 'all' 
                                ? 'Your transaction history will appear here once you make deposits or withdrawals'
                                : `No ${transactionFilter === 'credit' ? 'credits' : 'debits'} found. Try changing the filter or make some transactions.`
                              }
                            </p>
                          </div>
                        ) : (
                          getFilteredTransactions().slice(0, 10).map((transaction, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/30">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  transaction.type === 'deposit' || transaction.type === 'challenge_reward' 
                                    ? 'bg-green-100 text-green-600' 
                                    : 'bg-red-100 text-red-600'
                                }`}>
                                  {transaction.type === 'deposit' || transaction.type === 'challenge_reward' ? '+' : '-'}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{transaction.description}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatTransactionDate(transaction.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <div className={`font-semibold ${
                                transaction.type === 'deposit' || transaction.type === 'challenge_reward' 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                ${Math.abs(transaction.amount).toFixed(2)}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gaming Preferences */}
              <TabsContent value="gaming" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gaming Profile */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="font-orbitron">Gaming Profile</CardTitle>
                      <CardDescription>Set your gaming preferences and skill level</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Skill Level</Label>
                          <Select 
                            disabled={!isEditing}
                            value={profile.gaming.skillLevel} 
                            onValueChange={(value: any) => handleGamingUpdate('skillLevel', value)}
                          >
                            <SelectTrigger disabled={!isEditing} className="bg-secondary/30 border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                              <SelectItem value="professional">Professional</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Play Style</Label>
                          <Select 
                            disabled={!isEditing}
                            value={profile.gaming.playStyle} 
                            onValueChange={(value: any) => handleGamingUpdate('playStyle', value)}
                          >
                            <SelectTrigger disabled={!isEditing} className="bg-secondary/30 border-border/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="casual">Casual</SelectItem>
                              <SelectItem value="competitive">Competitive</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gaming Platforms */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                                      <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-orbitron">
                        Gaming Platforms
                        {user?.platforms && user.platforms.length > 0 && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({user.platforms.length} connected)
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>Manage your connected gaming platforms and online IDs</CardDescription>
                    </div>
                    <Button
                      onClick={() => setIsAddingPlatform(true)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Platform
                    </Button>
                  </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Add New Platform Form */}
                      {isAddingPlatform && (
                        <div className="p-4 bg-secondary/20 rounded-lg border border-border/30 space-y-3">
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">Add New Platform</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="newPlatformType" className="text-xs">Platform</Label>
                              <Select 
                                value={newPlatform.platform} 
                                onValueChange={(value) => setNewPlatform(prev => ({ ...prev, platform: value }))}
                              >
                                <SelectTrigger className="bg-input/50 border-border/50 text-xs">
                                  <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pc">PC</SelectItem>
                                  <SelectItem value="playstation">PlayStation</SelectItem>
                                  <SelectItem value="ps">PS</SelectItem>
                                  <SelectItem value="xbox">Xbox</SelectItem>
                                  <SelectItem value="nintendo">Nintendo Switch</SelectItem>
                                  <SelectItem value="mobile">Mobile</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newOnlineUserId" className="text-xs">Online User ID</Label>
                              <Input
                                id="newOnlineUserId"
                                type="text"
                                placeholder="Your username/ID"
                                value={newPlatform.onlineUserId}
                                onChange={(e) => setNewPlatform(prev => ({ ...prev, onlineUserId: e.target.value }))}
                                className="bg-input/50 border-border/50 text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleAddPlatform}
                              size="sm"
                              className="bg-success hover:bg-success/90 text-success-foreground"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Platform
                            </Button>
                            <Button
                              onClick={() => {
                                setIsAddingPlatform(false);
                                setNewPlatform({ platform: '', onlineUserId: '' });
                              }}
                              size="sm"
                              variant="outline"
                              className="border-border/50"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Existing Platforms */}
                      {user?.platforms && user.platforms.length > 0 ? (
                        <div className="space-y-3">

                          {user.platforms.map((platformData, index) => (
                            <div key={index} className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                              {/* Always show the edit form if this platform is being edited */}
                              {editingPlatformIndex === index && (
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2">
                                    <Gamepad2 className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-sm">Edit Platform</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label className="text-xs">Platform</Label>
                                      <Select 
                                        value={editingPlatform.platform} 
                                        onValueChange={(value) => setEditingPlatform(prev => ({ ...prev, platform: value }))}
                                      >
                                        <SelectTrigger className="bg-input/50 border-border/50 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pc">PC</SelectItem>
                                          <SelectItem value="playstation">PlayStation</SelectItem>
                                          <SelectItem value="ps">PS</SelectItem>
                                          <SelectItem value="xbox">Xbox</SelectItem>
                                          <SelectItem value="nintendo">Nintendo Switch</SelectItem>
                                          <SelectItem value="mobile">Mobile</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs">Online User ID</Label>
                                      <Input
                                        type="text"
                                        placeholder="Your username/ID"
                                        value={editingPlatform.onlineUserId}
                                        onChange={(e) => setEditingPlatform(prev => ({ ...prev, onlineUserId: e.target.value }))}
                                        className="bg-input/50 border-border/50 text-xs"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={handleEditPlatform}
                                      size="sm"
                                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Save Changes
                                    </Button>
                                    <Button
                                      onClick={cancelEditPlatform}
                                      size="sm"
                                      variant="outline"
                                      className="border-border/50"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {/* Always show the display mode if this platform is NOT being edited */}
                              {editingPlatformIndex !== index && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                      <Gamepad2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-sm capitalize">
                                        {platformData.platform === 'pc' ? 'PC' : 
                                         platformData.platform === 'playstation' || platformData.platform === 'ps' ? 'PlayStation' : 
                                         platformData.platform === 'xbox' ? 'Xbox' : 
                                         platformData.platform === 'nintendo' ? 'Nintendo Switch' : 
                                         platformData.platform === 'mobile' ? 'Mobile' : 
                                         platformData.platform}
                                      </div>
                                      <div className="text-xs text-muted-foreground">ID: {platformData.onlineUserId}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs bg-primary/20 text-primary border-primary/30">
                                      Connected
                                    </Badge>
                                    <Button
                                      onClick={() => startEditPlatform(index)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-secondary/50"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeletePlatform(index)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <Gamepad2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No gaming platforms connected</p>
                          <p className="text-xs">Click "Add Platform" to get started</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Preferred Games */}
                  <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="font-orbitron">Preferred Games</CardTitle>
                      <CardDescription>Select your favorite games</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {isLoadingGames && (
                          <div className="text-sm text-muted-foreground">Loading games...</div>
                        )}
                        {!isLoadingGames && gamesError && (
                          <div className="text-sm text-destructive">{gamesError}</div>
                        )}
                        {!isLoadingGames && !gamesError && availableGames.length === 0 && (
                          <div className="text-sm text-muted-foreground">No games available</div>
                        )}
                        {!isLoadingGames && !gamesError && availableGames.map((game) => (
                          <div key={game} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={game}
                              checked={profile.gaming.preferredGames.includes(game)}
                              disabled={!isEditing}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleGamingUpdate('preferredGames', [...profile.gaming.preferredGames, game]);
                                } else {
                                  handleGamingUpdate('preferredGames', profile.gaming.preferredGames.filter(g => g !== game));
                                }
                              }}
                              className="rounded border-border/50"
                            />
                            <Label htmlFor={game} className="cursor-pointer">{game}</Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
}
