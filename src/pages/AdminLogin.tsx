import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as any)?.from?.pathname || '/admin_portal_management_control';

  const isAdmin = Boolean((user as any)?.isAdmin) || user?.username?.toLowerCase() === 'admin' || (user as any)?.role === 'admin';

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin_portal_management_control', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      await login({ email, password });
      toast({ title: 'Success', description: 'Welcome, Admin!' });
      navigate(from, { replace: true });
    } catch (error) {
      let errorMessage = 'Login failed.';
      if (error instanceof Error) errorMessage = error.message;
      toast({ title: 'Login Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <Card className="w-full max-w-sm bg-card/95 backdrop-blur-xl border-border/50 shadow-glass relative z-10">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Admin Portal Login</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">Restricted access</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-4">
          {isAuthenticated && !isAdmin && (
            <div className="mb-4 text-xs text-red-500">
              You are signed in as a non-admin user. Please sign out and log in with an admin account.
              <div className="mt-2">
                <Button variant="destructive" onClick={logout}>
                  Sign out
                </Button>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium">Admin Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-input/50 border-border/50 text-sm" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-input/50 border-border/50 pr-10 text-sm" required />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-2 hover:bg-transparent w-8 h-8" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


