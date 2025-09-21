import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminGames from './admin/AdminGames';
import AdminDisputes from './AdminDisputes';
import AdminDashboard from './admin/AdminDashboard';
import AdminTransactions from './admin/AdminTransactions';
import TournamentTypes from './admin/TournamentTypes';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function AdminPortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');

  useEffect(() => {
    // additional runtime guard fallback
    const isAdmin = Boolean((user as any)?.isAdmin) || user?.username?.toLowerCase() === 'admin' || (user as any)?.role === 'admin';
    if (!isAdmin) {
      navigate('/not-found', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen p-4">
      <Card className="max-w-7xl mx-auto">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Admin Portal</CardTitle>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={logout}>Logout</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="disputes">Manage Disputes</TabsTrigger>
              <TabsTrigger value="games">Games Management</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="tournament-types">Tournament Types</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <AdminDashboard />
            </TabsContent>

            <TabsContent value="disputes">
              <AdminDisputes />
            </TabsContent>

            <TabsContent value="games">
              <AdminGames />
            </TabsContent>

            <TabsContent value="transactions">
              <AdminTransactions />
            </TabsContent>

            <TabsContent value="tournament-types">
              <TournamentTypes />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


