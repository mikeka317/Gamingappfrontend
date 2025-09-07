import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Wallet,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';

interface Dispute {
  id: string;
  challengeId: string;
  challengerId: string;
  challengerUsername: string;
  opponentId: string;
  opponentUsername: string;
  disputeReason: string;
  evidence: string[];
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  adminNotes?: string;
  resolution?: 'challenger_wins' | 'opponent_wins' | 'split' | 'refund';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminWallet {
  balance: number;
  currency: string;
  totalFees: number;
}

interface DisputeStats {
  total: number;
  pending: number;
  underReview: number;
  resolved: number;
  dismissed: number;
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [adminWallet, setAdminWallet] = useState<AdminWallet | null>(null);
  const [disputeStats, setDisputeStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [resolution, setResolution] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [disputesData, walletData, statsData] = await Promise.all([
        fetch('/api/admin/disputes', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json()),
        fetch('/api/admin/wallet', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json()),
        fetch('/api/admin/disputes/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }).then(res => res.json())
      ]);
      
      if (disputesData.success) setDisputes(disputesData.data);
      if (walletData.success) setAdminWallet(walletData.data);
      if (statsData.success) setDisputeStats(statsData.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolution) {
      toast({
        title: "Missing Information",
        description: "Please select a resolution",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/admin/disputes/${selectedDispute.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          resolution,
          adminNotes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Dispute resolved successfully",
        });
        
        // Reset form and close modal
        setResolution('');
        setAdminNotes('');
        setIsDisputeModalOpen(false);
        setSelectedDispute(null);
        
        // Reload data
        await loadAdminData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openDisputeModal = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setResolution('');
    setAdminNotes('');
    setIsDisputeModalOpen(true);
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

  // Check if user is admin
  if (!user || (user.username !== 'admin' && user.username !== 'Admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mt-20">
            <Shield className="h-24 w-24 text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-400 text-lg">
              You don't have permission to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="h-32 bg-gray-700 rounded"></div>
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
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-500" />
            Admin Panel
          </h1>
          <p className="text-gray-400">Manage disputes, monitor system, and oversee operations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Total Disputes */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Total Disputes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {disputeStats?.total || 0}
              </div>
              <p className="text-blue-100 text-sm">All Time</p>
            </CardContent>
          </Card>

          {/* Pending Disputes */}
          <Card className="bg-gradient-to-r from-yellow-600 to-yellow-700 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {disputeStats?.pending || 0}
              </div>
              <p className="text-yellow-100 text-sm">Awaiting Review</p>
            </CardContent>
          </Card>

          {/* Admin Wallet */}
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Admin Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ${adminWallet?.balance?.toFixed(2) || '0.00'}
              </div>
              <p className="text-green-100 text-sm">Available Balance</p>
            </CardContent>
          </Card>

          {/* Total Fees */}
          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Total Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ${adminWallet?.totalFees?.toFixed(2) || '0.00'}
              </div>
              <p className="text-purple-100 text-sm">Collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Disputes Table */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dispute Management</CardTitle>
            <CardDescription className="text-gray-400">
              Review and resolve user disputes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Challenge ID</TableHead>
                  <TableHead className="text-gray-300">Parties</TableHead>
                  <TableHead className="text-gray-300">Reason</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id} className="border-gray-700">
                    <TableCell className="text-gray-300 font-mono text-sm">
                      {dispute.challengeId.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="text-sm">
                        <div>Challenger: {dispute.challengerUsername}</div>
                        <div>Opponent: {dispute.opponentUsername}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300 max-w-xs">
                      <div className="truncate" title={dispute.disputeReason}>
                        {dispute.disputeReason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getDisputeStatusBadge(dispute.status)}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {formatDate(dispute.createdAt)}
                    </TableCell>
                    <TableCell>
                      {dispute.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => openDisputeModal(dispute)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Review
                        </Button>
                      )}
                      {dispute.status === 'resolved' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {dispute.resolution?.replace('_', ' ')}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {disputes.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No disputes found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dispute Resolution Modal */}
        {selectedDispute && (
          <Dialog open={isDisputeModalOpen} onOpenChange={setIsDisputeModalOpen}>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Resolve Dispute</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Review the dispute and provide a resolution
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Dispute Details */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-white font-semibold mb-3">Dispute Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Challenge ID:</span>
                      <div className="text-white font-mono">{selectedDispute.challengeId}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <div>{getDisputeStatusBadge(selectedDispute.status)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Challenger:</span>
                      <div className="text-white">{selectedDispute.challengerUsername}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Opponent:</span>
                      <div className="text-white">{selectedDispute.opponentUsername}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-gray-400">Reason:</span>
                    <div className="text-white mt-1">{selectedDispute.disputeReason}</div>
                  </div>
                  {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                    <div className="mt-3">
                      <span className="text-gray-400">Evidence:</span>
                      <div className="text-white mt-1">
                        {selectedDispute.evidence.map((item, index) => (
                          <div key={index} className="text-sm">• {item}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Resolution Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resolution" className="text-white">Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select resolution" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="challenger_wins">Challenger Wins</SelectItem>
                        <SelectItem value="opponent_wins">Opponent Wins</SelectItem>
                        <SelectItem value="split">Split Prize</SelectItem>
                        <SelectItem value="refund">Refund Both Parties</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="adminNotes" className="text-white">Admin Notes (Optional)</Label>
                    <Textarea
                      id="adminNotes"
                      placeholder="Add any additional notes about the resolution..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={4}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsDisputeModalOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleResolveDispute}
                    disabled={isProcessing || !resolution}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isProcessing ? 'Processing...' : 'Resolve Dispute'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
