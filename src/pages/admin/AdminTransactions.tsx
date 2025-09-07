import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';

type Txn = {
  id?: string;
  userId: string;
  username: string;
  type: string;
  amount: number;
  description?: string;
  status?: string;
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: string | number | Date;
};

const TYPES = ['all','deposit','withdrawal','challenge_reward','refund','admin_fee','challenge_deduction'];

export default function AdminTransactions() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [limit, setLimit] = useState(200);
  const [type, setType] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [txns, setTxns] = useState<Txn[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.get<Txn[]>(`/wallet/all?limit=${limit}`);
      if (!res.success || !Array.isArray(res.data)) throw new Error(res.message || 'Failed to fetch transactions');
      setTxns(res.data);
    } catch (e: any) {
      toast({ title: 'Failed to load transactions', description: e?.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [limit]);

  const handleRefresh = async () => {
    try { setRefetching(true); await load(); } finally { setRefetching(false); }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txns.filter(t => {
      if (type !== 'all' && t.type !== type) return false;
      if (!q) return true;
      return (
        (t.username || '').toLowerCase().includes(q) ||
        (t.reference || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    });
  }, [txns, type, query]);

  const totals = useMemo(() => {
    const sum = (kind: string) => filtered.filter(t => t.type === kind).reduce((acc, t) => acc + Number(t.amount || 0), 0);
    return {
      deposits: sum('deposit'),
      withdrawals: sum('withdrawal'),
      rewards: sum('challenge_reward'),
      refunds: sum('refund'),
      adminFees: sum('admin_fee'),
      deductions: sum('challenge_deduction'),
    };
  }, [filtered]);

  const formatAmt = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(Number(n || 0)).toFixed(2)}`;
  const formatDate = (d: any) => new Date(typeof d === 'string' || typeof d === 'number' ? d : Date.now()).toLocaleString();

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-xl">All Transactions</h2>
          <p className="text-xs text-muted-foreground">Across all users</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(limit)} onValueChange={(v) => setLimit(parseInt(v))}>
            <SelectTrigger className="h-8 w-[90px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[100,200,500,1000].map(n => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || refetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${refetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      <Card className="bg-card/60 border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <Badge variant="secondary" className="justify-between"><span>Deposits</span><span className="ml-2 font-semibold">{formatAmt(totals.deposits)}</span></Badge>
          <Badge variant="secondary" className="justify-between"><span>Withdrawals</span><span className="ml-2 font-semibold">{formatAmt(totals.withdrawals)}</span></Badge>
          <Badge variant="secondary" className="justify-between"><span>Rewards</span><span className="ml-2 font-semibold">{formatAmt(totals.rewards)}</span></Badge>
          <Badge variant="secondary" className="justify-between"><span>Refunds</span><span className="ml-2 font-semibold">{formatAmt(totals.refunds)}</span></Badge>
          <Badge variant="secondary" className="justify-between"><span>Admin Fees</span><span className="ml-2 font-semibold">{formatAmt(totals.adminFees)}</span></Badge>
          <Badge variant="secondary" className="justify-between"><span>Deductions</span><span className="ml-2 font-semibold">{formatAmt(totals.deductions)}</span></Badge>
        </CardContent>
      </Card>

      <Card className="bg-card/60 border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="flex-1">
              <Input placeholder="Search by user, reference, description" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map(t => (<SelectItem key={t} value={t}>{t === 'all' ? 'All types' : t}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>No transactions</TableCell></TableRow>
                ) : (
                  filtered.map((t, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="whitespace-nowrap">{formatDate(t.createdAt)}</TableCell>
                      <TableCell className="whitespace-nowrap">{t.username || t.userId}</TableCell>
                      <TableCell className="whitespace-nowrap"><Badge variant="secondary" className="text-[10px] capitalize">{t.type}</Badge></TableCell>
                      <TableCell className={`whitespace-nowrap ${Number(t.amount) >= 0 ? 'text-success' : 'text-destructive'}`}>{formatAmt(Number(t.amount))}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{t.status || 'completed'}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{t.reference || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


