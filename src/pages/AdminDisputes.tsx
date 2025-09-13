import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertTriangle, Eye, Flag } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Dispute {
  id: string;
  challengeId: string;
  challengerUsername: string;
  opponentUsername: string;
  reason: string;
  evidence: string;
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'resolved';
  adminNotes: string;
  resolvedAt: string | null;
  resolution: 'challenger-wins' | 'opponent-wins' | 'split-prize' | null;
}

type AdminResolutionUI = 'keep-winner' | 'revert-decision' | 'draw';

function normalizeTimestampToISO(input: any): string {
  try {
    if (!input) return new Date().toISOString();
    if (typeof input === 'string' || typeof input === 'number') {
      const d = new Date(input);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    }
    if (typeof input === 'object') {
      if (typeof (input as any).toDate === 'function') {
        const d = (input as any).toDate();
        return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
      }
      const seconds = (input as any).seconds ?? (input as any)._seconds;
      if (typeof seconds === 'number') {
        return new Date(seconds * 1000).toISOString();
      }
    }
  } catch (_) {}
  return new Date().toISOString();
}

export default function AdminDisputes() {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [resolution, setResolution] = useState<AdminResolutionUI>('keep-winner');
  const [challengeWinner, setChallengeWinner] = useState<'challenger' | 'opponent' | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [challengeProofImages, setChallengeProofImages] = useState<string[]>([]);

  // Check if user is admin (you can implement your own admin check logic)
  const isAdmin = (user as any)?.isAdmin || user?.role === 'admin' || (user?.username || '').toLowerCase() === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      // Redirect non-admin users
      return;
    }

    const fetchDisputes = async () => {
      try {
        setLoading(true);
        const res = await apiService.get<any[]>(`/admin/disputes`);
        const list = (res.data || []).map((d: any) => ({
          id: d.id,
          challengeId: d.challengeId,
          challengerUsername: d.challengerUsername || d.challenger || '',
          opponentUsername: d.opponentUsername || d.opponent || '',
          reason: d.disputeReason || d.reason || '',
          evidence: Array.isArray(d.evidence) ? d.evidence.join(',') : (d.evidence || ''),
          submittedAt: normalizeTimestampToISO(d.createdAt),
          status: d.status || 'pending',
          adminNotes: d.adminNotes || '',
          resolvedAt: d.resolvedAt ? normalizeTimestampToISO(d.resolvedAt) : null,
          resolution:
            d.resolution === 'challenger_wins' ? 'challenger-wins' :
            d.resolution === 'opponent_wins' ? 'opponent-wins' :
            d.resolution === 'refund' ? 'split-prize' :
            (d.resolution || null),
        }));
        setDisputes(list);
      } catch (error) {
        console.error('Error fetching disputes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
    const interval = setInterval(fetchDisputes, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [isAdmin]);

  const openDisputeModal = async (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setAdminNotes(dispute.adminNotes || '');
    setResolution('keep-winner');
    // Fetch challenge to determine current winner (if any)
    try {
      const resp = await apiService.get<any>(`/challenges/${dispute.challengeId}`);
      const winnerUsername = resp?.data?.winnerUsername || resp?.data?.winner?.username || null;
      if (winnerUsername) {
        if (winnerUsername === dispute.challengerUsername) setChallengeWinner('challenger');
        else if (winnerUsername === dispute.opponentUsername) setChallengeWinner('opponent');
        else setChallengeWinner(null);
      } else setChallengeWinner(null);

      // Collect challenge proof images from challenge data
      const data = resp?.data || {};
      const urls: string[] = [];
      if (Array.isArray(data.proofImages)) {
        urls.push(...(data.proofImages as string[]).filter(Boolean));
      }
      const aiProofUrl = data?.aiResult?.proofImageUrl as string | undefined;
      if (aiProofUrl) urls.push(aiProofUrl);
      // Deduplicate
      setChallengeProofImages(Array.from(new Set(urls)));
    } catch (_) {}
    setIsDisputeModalOpen(true);
  };

  const closeDisputeModal = () => {
    setIsDisputeModalOpen(false);
    setSelectedDispute(null);
    setAdminNotes('');
    setResolution('keep-winner');
    setChallengeProofImages([]);
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute || !adminNotes.trim()) {
      alert('Please provide admin notes');
      return;
    }

    setIsResolving(true);
    try {
      // Map UI choice to backend resolution values
      let backendResolution: string = 'resolved'; // keep winner => no distribution
      if (resolution === 'draw') backendResolution = 'refund';
      if (resolution === 'revert-decision') {
        // Flip current winner
        if (challengeWinner === 'challenger') backendResolution = 'opponent_wins';
        else if (challengeWinner === 'opponent') backendResolution = 'challenger_wins';
        else backendResolution = 'refund';
      }

      const response = await apiService.post(`/admin/disputes/${selectedDispute.id}/resolve`, {
        resolution: backendResolution,
        adminNotes,
        resolvedAt: new Date().toISOString()
      });

      if (response.success) {
        const uiResolution = backendResolution === 'challenger_wins' ? 'challenger-wins'
          : backendResolution === 'opponent_wins' ? 'opponent-wins'
          : backendResolution === 'refund' ? 'split-prize'
          : null;

        // Update local state
        setDisputes(prev => prev.map(d => 
          d.id === selectedDispute.id 
            ? { ...d, status: 'resolved', resolution: uiResolution as any, adminNotes, resolvedAt: new Date().toISOString() }
            : d
        ));
        
        closeDisputeModal();
        alert('Dispute resolved successfully');
      } else {
        throw new Error('Failed to resolve dispute');
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert('Failed to resolve dispute');
    } finally {
      setIsResolving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30">Pending</Badge>;
      case 'reviewed':
        return <Badge variant="secondary" className="bg-blue/20 text-blue border-blue/30">Reviewed</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-success/20 text-success border-success/30">Resolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getResolutionText = (resolution: string | null) => {
    switch (resolution) {
      case 'challenger-wins':
        return 'Challenger Wins';
      case 'opponent-wins':
        return 'Opponent Wins';
      case 'split-prize':
        return 'Split Prize';
      default:
        return 'Not Resolved';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Disputes Table */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="font-orbitron text-base sm:text-lg">All Disputes</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Review and resolve user disputes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                  <TableHead className="font-orbitron font-semibold text-xs">Challenge</TableHead>
                  <TableHead className="font-orbitron font-semibold text-xs text-center">Parties</TableHead>
                  <TableHead className="font-orbitron font-semibold text-xs text-center">Reason</TableHead>
                  <TableHead className="font-orbitron font-semibold text-xs text-center">Submitted</TableHead>
                  <TableHead className="font-orbitron font-semibold text-xs text-center">Status</TableHead>
                  <TableHead className="font-orbitron font-semibold text-xs text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground text-sm">Loading disputes...</p>
                    </TableCell>
                  </TableRow>
                ) : disputes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Flag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No disputes found</p>
                      <p className="text-xs text-muted-foreground mt-1">All caught up!</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  disputes.map((dispute) => (
                    <TableRow key={dispute.id} className="hover:bg-secondary/10 transition-colors duration-200">
                      <TableCell>
                        <div className="text-xs font-medium">
                          {dispute.challengeId.slice(0, 8)}...
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Challenger:</span>
                            <span className="ml-1 font-medium">{dispute.challengerUsername}</span>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Opponent:</span>
                            <span className="ml-1 font-medium">{dispute.opponentUsername}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="max-w-xs truncate text-xs">
                          {dispute.reason}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-xs text-muted-foreground">
                          {new Date(dispute.submittedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(dispute.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => openDisputeModal(dispute)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-orbitron font-bold text-xs transition-all duration-300 hover:shadow-neon-orange"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {dispute.status === 'resolved' ? 'View' : 'Review'}
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

      {/* Dispute Review Modal */}
      {selectedDispute && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${isDisputeModalOpen ? 'block' : 'hidden'}`}>
          <div className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Flag className="h-5 w-5 text-orange-500" />
              Review Dispute
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Challenge Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Challenge ID:</span>
                    <span className="ml-2 font-mono">{selectedDispute.challengeId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="ml-2">{new Date(selectedDispute.submittedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Parties</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Challenger:</span>
                    <span className="ml-2 font-medium">{selectedDispute.challengerUsername}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Opponent:</span>
                    <span className="ml-2 font-medium">{selectedDispute.opponentUsername}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Dispute Reason</h4>
                <p className="text-sm bg-secondary/20 p-3 rounded border">
                  {selectedDispute.reason}
                </p>
              </div>

              {challengeProofImages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Challenge Proof</h4>
                  <div className="space-y-2">
                    {challengeProofImages.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i.test(url) && (
                          <img src={url} alt={`challenge-proof-${idx}`} className="h-24 w-auto rounded border" />
                        )}
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">
                          View
                        </a>
                        <a href={url} download className="text-xs underline">
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDispute.evidence && (
                <div>
                  <h4 className="font-medium mb-2">Evidence</h4>
                  <div className="space-y-2">
                    {selectedDispute.evidence.split(/\s*,\s*|\n|\s+/).filter(Boolean).map((url, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        {/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i.test(url) && (
                          <img src={url} alt={`evidence-${idx}`} className="h-24 w-auto rounded border" />
                        )}
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline text-xs">
                          View
                        </a>
                        <a href={url} download className="text-xs underline">
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDispute.status !== 'resolved' ? (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Admin Notes *</h4>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="w-full p-3 border rounded text-sm"
                      rows={3}
                      placeholder="Enter your analysis and reasoning..."
                    />
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Resolution</h4>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as AdminResolutionUI)}
                      className="w-full p-3 border rounded text-sm"
                    >
                      <option value="keep-winner">Keep current winner (no change)</option>
                      <option value="revert-decision">Revert decision (flip winner)</option>
                      <option value="draw">Mark as draw (refund both)</option>
                    </select>
                    {resolution === 'revert-decision' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Current winner: {challengeWinner ? (challengeWinner === 'challenger' ? selectedDispute.challengerUsername : selectedDispute.opponentUsername) : 'Unknown'}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={closeDisputeModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleResolveDispute}
                      disabled={isResolving || !adminNotes.trim()}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {isResolving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Resolving...
                        </>
                      ) : (
                        'Resolve Dispute'
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <div>
                  <h4 className="font-medium mb-2">Resolution</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">Decision:</span>
                      <Badge variant="secondary" className="ml-2">
                        {getResolutionText(selectedDispute.resolution)}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Admin Notes:</span>
                      <p className="text-sm bg-secondary/20 p-3 rounded border mt-1">
                        {selectedDispute.adminNotes}
                      </p>
                    </div>
                    {selectedDispute.resolvedAt && (
                      <div>
                        <span className="text-muted-foreground">Resolved:</span>
                        <span className="ml-2">{new Date(selectedDispute.resolvedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={closeDisputeModal}
                    className="w-full mt-4"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


