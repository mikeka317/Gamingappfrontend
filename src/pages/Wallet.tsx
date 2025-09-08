import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { walletService } from '../services/walletService';
import type { Wallet as WalletModel, Transaction, Dispute } from '../services/walletService';
import { toast } from '../hooks/use-toast';
import { 
  Wallet as WalletIcon, 
  Plus, 
  Minus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trophy, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  History,
  AlertCircle
} from 'lucide-react';

const Wallet: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletModel | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, transactionsData, disputesData] = await Promise.all([
        walletService.getUserWallet(),
        walletService.getTransactions(),
        walletService.getUserDisputes()
      ]);
      
      setWallet(walletData);
      setTransactions(transactionsData);
      setDisputes(disputesData);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      const transaction = await walletService.addFunds(
        parseFloat(depositAmount),
        depositDescription || 'Manual deposit'
      );
      
      toast({
        title: "Success",
        description: `Successfully added $${depositAmount} to your wallet`,
      });
      
      // Reset form and close modal
      setDepositAmount('');
      setDepositDescription('');
      setIsDepositModalOpen(false);
      
      // Reload wallet data
      await loadWalletData();
    } catch (error) {
      console.error('Error adding funds:', error);
      toast({
        title: "Error",
        description: "Failed to add funds to wallet",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case 'challenge_deduction':
        return <Minus className="h-4 w-4 text-orange-500" />;
      case 'challenge_reward':
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 'admin_fee':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      case 'refund':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'challenge_reward':
      case 'refund':
        return 'text-green-600';
      case 'withdrawal':
      case 'challenge_deduction':
      case 'admin_fee':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDisputeStatusBadge = (status: Dispute['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'under_review':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Under Review</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Dismissed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="h-32 bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-700 rounded"></div>
              <div className="h-32 bg-gray-700 rounded"></div>
            </div>
            <div className="h-96 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Wallet</h1>
          <p className="text-gray-400">Manage your funds and view transaction history</p>
        </div>

        {/* Wallet Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <WalletIcon className="h-5 w-5" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ${wallet?.balance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-green-100 text-sm">USD</p>
            </CardContent>
          </Card>

          {/* Total Transactions Card */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <History className="h-5 w-5" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {transactions.length}
              </div>
              <p className="text-blue-100 text-sm">Transactions</p>
            </CardContent>
          </Card>

          {/* Active Disputes Card */}
          <Card className="bg-gradient-to-r from-orange-600 to-orange-700 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Active Disputes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {disputes.filter(d => ['pending', 'under_review'].includes(d.status)).length}
              </div>
              <p className="text-orange-100 text-sm">Disputes</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Add funds or view detailed information
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Funds
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Funds to Wallet</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Add funds to your wallet for participating in challenges
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount" className="text-white">Amount (USD)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        placeholder="e.g., Manual deposit, Challenge winnings"
                        value={depositDescription}
                        onChange={(e) => setDepositDescription(e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsDepositModalOpen(false)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDeposit}
                        disabled={isProcessing || !depositAmount}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isProcessing ? 'Processing...' : 'Add Funds'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Transaction History</CardTitle>
              <CardDescription className="text-gray-400">
                Recent transactions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Type</TableHead>
                    <TableHead className="text-gray-300">Amount</TableHead>
                    <TableHead className="text-gray-300">Description</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className="border-gray-700">
                      <TableCell className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                      </TableCell>
                      <TableCell className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-300">{transaction.description}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className={transaction.status === 'completed' ? 'bg-green-600' : 'bg-gray-600'}
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {formatDate(transaction.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No transactions found
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Disputes */}
        {disputes.length > 0 && (
          <div className="mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Your Disputes</CardTitle>
                <CardDescription className="text-gray-400">
                  Challenges that have been disputed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Challenge</TableHead>
                      <TableHead className="text-gray-300">Opponent</TableHead>
                      <TableHead className="text-gray-300">Reason</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((dispute) => (
                      <TableRow key={dispute.id} className="border-gray-700">
                        <TableCell className="text-gray-300">
                          {dispute.challengeId.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {dispute.challengerUsername === user?.username 
                            ? dispute.opponentUsername 
                            : dispute.challengerUsername}
                        </TableCell>
                        <TableCell className="text-gray-300 max-w-xs truncate">
                          {dispute.disputeReason}
                        </TableCell>
                        <TableCell>
                          {getDisputeStatusBadge(dispute.status)}
                        </TableCell>
                        <TableCell className="text-gray-400 text-sm">
                          {formatDate(dispute.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
