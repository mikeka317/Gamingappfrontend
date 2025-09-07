import { useEffect, useMemo, useState } from 'react';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Gamepad2, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';

type AdminWallet = {
  balance: number;
  currency: string;
  totalFees?: number;
};

type UserLite = {
  uid: string;
  username: string;
  email: string;
  lastActive?: number;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [refetching, setRefetching] = useState(false);

  const [totalGames, setTotalGames] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [adminWallet, setAdminWallet] = useState<AdminWallet | null>(null);
  const [totalDisputes, setTotalDisputes] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const activeWindowMinutes = 10; // users active within last 10 minutes

  const loadAll = async () => {
    try {
      setLoading(true);
      const [gamesRes, usersList, adminWalletRes, disputesRes] = await Promise.all([
        apiService.get<any[]>('/games'),
        // Dedicated helper loads users list
        apiService.getUsers().catch((e) => {
          console.warn('Users fetch failed via getUsers()', e);
          return [] as UserLite[];
        }),
        apiService.get<AdminWallet>('/admin/wallet'),
        apiService.get<any[]>('/admin/disputes'),
      ]);

      if (gamesRes?.success && Array.isArray(gamesRes.data)) setTotalGames(gamesRes.data.length);
      const now = Date.now();
      const users = Array.isArray(usersList) ? usersList : [];
      setTotalUsers(users.length);
      setActiveUsers(
        users.filter((u) => {
          const ts = typeof u.lastActive === 'number' ? u.lastActive : 0;
          return ts && now - ts <= activeWindowMinutes * 60 * 1000;
        }).length
      );
      if (adminWalletRes?.success && adminWalletRes.data) setAdminWallet(adminWalletRes.data);
      if (disputesRes?.success && Array.isArray(disputesRes.data)) setTotalDisputes(disputesRes.data.length);
      setLastUpdated(Date.now());
    } catch (e: any) {
      toast({ title: 'Failed to load dashboard', description: e?.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRefresh = async () => {
    try {
      setRefetching(true);
      await loadAll();
    } finally {
      setRefetching(false);
    }
  };

  const formattedBalance = useMemo(() => {
    if (!adminWallet) return '$0.00';
    const amount = Number(adminWallet.balance || 0);
    return `${adminWallet.currency === 'USD' ? '$' : ''}${amount.toFixed(2)}`;
  }, [adminWallet]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-orbitron text-xl">Overview</h2>
          <p className="text-xs text-muted-foreground">Key metrics at a glance</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading || refetching}>
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${refetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> Total Games</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-orbitron">{loading ? '—' : totalGames}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Registered Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-orbitron">{loading ? '—' : totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-orbitron">{loading ? '—' : activeUsers}</div>
            <div className="text-[10px] text-muted-foreground">in last {activeWindowMinutes} min</div>
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" /> Admin Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-orbitron">{loading ? '—' : formattedBalance}</div>
            {adminWallet?.totalFees != null && (
              <div className="text-[10px] text-muted-foreground">Total Fees: {adminWallet.totalFees.toFixed(2)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/60 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Total Disputes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-orbitron">{loading ? '—' : totalDisputes}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/60 border-border/50">
        <CardHeader>
          <CardTitle className="text-sm">System Status</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground flex flex-col gap-1">
          <div>
            API Health: <Badge variant="secondary" className="text-[10px]">OK</Badge>
          </div>
          <div>
            Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


