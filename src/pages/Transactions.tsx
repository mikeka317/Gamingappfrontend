import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  User,
  Gamepad2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  userId: string;
  username: string;
  type: 'deposit' | 'withdrawal' | 'challenge_deduction' | 'challenge_reward' | 'admin_fee' | 'refund';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  reference: string;
  metadata?: Record<string, any>;
  createdAt: any;
  updatedAt: any;
}

export default function Transactions() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalRewards: 0,
    totalDeductions: 0,
    totalTransactions: 0
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle wallet balance updates
  const handleWalletUpdate = (newBalance: number) => {
    const validBalance = typeof newBalance === 'number' && !isNaN(newBalance) ? newBalance : 0;
    setWalletBalance(validBalance);
    fetchTransactions();
    fetchTransactionStats();
  };

  // Fetch transactions from backend
  const fetchTransactions = async () => {
    if (!user) return;
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast({
        title: "Authentication Error",
        description: "Please log in again",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`http://localhost:5072/api/wallet/transactions?limit=100`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setTransactions(data.data);
        } else {
          toast({
            title: "API Error",
            description: data.message || "Failed to fetch transactions",
            variant: "destructive",
          });
        }
      } else {
        const errorText = await response.text();
        
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please log in again",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: `Failed to fetch transactions: ${response.status}`,
            variant: "destructive",
          });
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet balance
  const fetchWalletBalance = async () => {
    if (!user) return;
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    try {
      const response = await fetch(`http://localhost:5072/api/wallet/balance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWalletBalance(data.data.balance || 0);
        } else {
          setWalletBalance(0);
        }
      } else {
        setWalletBalance(0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      setWalletBalance(0);
    }
  };

  // Fetch transaction statistics
  const fetchTransactionStats = async () => {
    if (!user) return;
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;
    
    try {
      const response = await fetch(`http://localhost:5072/api/wallet/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchTransactionStats();
      fetchWalletBalance();
    }
  }, [user]);

  // Filter transactions based on selected filter
  const getFilteredTransactions = () => {
    if (!Array.isArray(transactions)) {
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
    
    return filtered;
  };

  // Format transaction date properly
  const formatTransactionDate = (dateValue: any) => {
    try {
      let date: Date;
      
      if (dateValue?.toDate) {
        // Firestore Timestamp
        date = dateValue.toDate();
      } else if (dateValue?._seconds) {
        // Firestore Timestamp object with _seconds and _nanoseconds
        date = new Date(dateValue._seconds * 1000);
      } else if (typeof dateValue === 'string') {
        // ISO string
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        // Date object
        date = dateValue;
      } else if (typeof dateValue === 'number') {
        // Numeric timestamp
        date = new Date(dateValue);
      } else {
        return 'Invalid date';
      }
      
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

  // Get transaction type display info
  const getTransactionTypeInfo = (type: string) => {
    switch (type) {
      case 'deposit':
        return { label: 'Deposit', color: 'bg-green-100 text-green-800', icon: '💰' };
      case 'withdrawal':
        return { label: 'Withdrawal', color: 'bg-red-100 text-red-800', icon: '🏦' };
      case 'challenge_reward':
        return { label: 'Challenge Win', color: 'bg-blue-100 text-blue-800', icon: '🏆' };
      case 'challenge_deduction':
        return { label: 'Challenge Fee', color: 'bg-orange-100 text-orange-800', icon: '⚔️' };
      case 'admin_fee':
        return { label: 'Admin Fee', color: 'bg-purple-100 text-purple-800', icon: '⚙️' };
      case 'refund':
        return { label: 'Refund', color: 'bg-yellow-100 text-yellow-800', icon: '↩️' };
      default:
        return { label: type, color: 'bg-gray-100 text-gray-800', icon: '❓' };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="flex-1">
          <Navbar onMenuClick={() => setSidebarOpen(true)} walletBalance={walletBalance || 0} onWalletUpdate={handleWalletUpdate} />
          
          <main className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-orbitron font-bold text-primary mb-2">Transaction History</h1>
              <p className="text-muted-foreground">View all your financial transactions and gaming activities</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Deposits</p>
                      <p className="text-2xl font-orbitron font-bold text-success">${stats.totalDeposits.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Withdrawals</p>
                      <p className="text-2xl font-orbitron font-bold text-warning">${stats.totalWithdrawals.toFixed(2)}</p>
                        </div>
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                </CardContent>
              </Card>



              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-orbitron font-bold text-primary">{stats.totalTransactions}</p>
                        </div>
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>

            {/* Transactions Table */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-orbitron">All Transactions</CardTitle>
                    <CardDescription>
                      Complete history of your financial activities
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
                      onClick={() => {
                        fetchTransactions();
                        fetchTransactionStats();
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-secondary/30 border-border/50 hover:bg-secondary/50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">Loading transactions...</span>
                  </div>
                ) : getFilteredTransactions().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-secondary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                    <p className="text-muted-foreground">
                      {transactionFilter === 'all' 
                        ? 'Your transaction history will appear here once you make deposits or withdrawals'
                        : `No ${transactionFilter === 'credit' ? 'credits' : 'debits'} found. Try changing the filter or make some transactions.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFilteredTransactions().map((transaction, index) => {
                      const typeInfo = getTransactionTypeInfo(transaction.type);
                      const isCredit = transaction.type === 'deposit' || transaction.type === 'challenge_reward' || transaction.type === 'refund';
                      
                      return (
                        <div key={transaction.id || index} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/30 hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${typeInfo.color}`}>
                              {typeInfo.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium">{transaction.description}</p>
                                <Badge variant="secondary" className={typeInfo.color}>
                                  {typeInfo.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatTransactionDate(transaction.createdAt)}
                                </span>
                                
            </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-orbitron font-bold text-lg ${
                              isCredit ? 'text-success' : 'text-destructive'
                            }`}>
                              {isCredit ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Status: {transaction.status}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}