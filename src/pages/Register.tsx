import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Gamepad2, Zap, Monitor, Play, Gamepad, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const platforms = [
  { value: 'pc', label: 'PC', icon: Monitor },
  { value: 'ps', label: 'PlayStation', icon: Play },
  { value: 'xbox', label: 'Xbox', icon: Gamepad },
  { value: 'nintendo', label: 'Nintendo Switch', icon: Gamepad2 },
  { value: 'mobile', label: 'Mobile', icon: Monitor },
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    platforms: [] as Array<{ platform: string; onlineUserId: string }>,
  });
  const [isLoading, setIsLoading] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.platforms.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one gaming platform",
        variant: "destructive",
      });
      return;
    }

    // Check if all selected platforms have online user IDs
    const platformsWithoutIds = formData.platforms.filter(p => !p.onlineUserId.trim());
    if (platformsWithoutIds.length > 0) {
      const platformNames = platformsWithoutIds.map(p => getPlatformLabel(p.platform)).join(', ');
      toast({
        title: "Error",
        description: `Please provide online user IDs for: ${platformNames}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        platforms: formData.platforms,
      });
      
      toast({
        title: "Success",
        description: "Account created successfully! Welcome to Cyber Duel Grid!",
      });
      
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlatformToggle = (platformValue: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.some(p => p.platform === platformValue)
        ? prev.platforms.filter(p => p.platform !== platformValue)
        : [...prev.platforms, { platform: platformValue, onlineUserId: '' }]
    }));
  };

  const removePlatform = (platformValue: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.filter(p => p.platform !== platformValue)
    }));
  };

  const handleOnlineUserIdChange = (platform: string, onlineUserId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.map(p => 
        p.platform === platform ? { ...p, onlineUserId } : p
      )
    }));
  };

  const getPlatformLabel = (value: string) => {
    return platforms.find(p => p.value === value)?.label || value;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/10 rounded-full animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-success/10 rounded-full animate-pulse delay-500" />
      </div>

      <Card className="w-full max-w-sm sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 shadow-glass relative z-10">
        <CardHeader className="text-center space-y-3 sm:space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-gaming rounded-2xl flex items-center justify-center shadow-neon-orange">
              <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
          </div>
          
          <div>
            <CardTitle className="text-xl sm:text-2xl font-orbitron font-bold bg-gradient-gaming bg-clip-text text-transparent">
              Join GameChallenge
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs sm:text-sm">
              Create your account and start challenging players
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs sm:text-sm font-inter font-medium">
                Username
              </Label>
                              <Input
                  id="username"
                  type="text"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300 text-sm sm:text-base"
                  required
                />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs sm:text-sm font-inter font-medium">
                Email
              </Label>
                              <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300 text-sm sm:text-base"
                  required
                />
            </div>

            {/* Gaming Platforms Selection */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-xs sm:text-sm font-inter font-medium">
                Gaming Platforms
              </Label>
              <div className="space-y-1.5 sm:space-y-2">
                {platforms.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = formData.platforms.some(p => p.platform === platform.value);
                  const platformData = formData.platforms.find(p => p.platform === platform.value);
                  
                  return (
                    <div key={platform.value} className="space-y-2">
                      <div
                        className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? 'bg-primary/20 border-primary/50 shadow-neon-orange'
                            : 'bg-input/50 border-border/50 hover:border-primary/30 hover:bg-primary/5'
                        }`}
                        onClick={() => handlePlatformToggle(platform.value)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handlePlatformToggle(platform.value)}
                          className="rounded border-border/50 focus:ring-primary w-3.5 h-3.5 sm:w-4 sm:h-4"
                        />
                        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`font-inter font-medium text-xs sm:text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {platform.label}
                        </span>
                      </div>
                      
                      {/* Online User ID Input - Only show when platform is selected */}
                      {isSelected && (
                        <div className="ml-8 space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Your {platform.label} Username/ID
                          </Label>
                          <Input
                            type="text"
                            placeholder={`Enter your ${platform.label} username or ID`}
                            value={platformData?.onlineUserId || ''}
                            onChange={(e) => handleOnlineUserIdChange(platform.value, e.target.value)}
                            className="bg-input/30 border-border/30 focus:border-primary/50 focus:shadow-neon-orange/30 transition-all duration-300 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Selected Platforms Display */}
              {formData.platforms.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm font-inter font-medium text-muted-foreground">
                    Selected Platforms ({formData.platforms.length})
                  </Label>
                  <div className="space-y-2">
                    {formData.platforms.map((platformData) => (
                      <div key={platformData.platform} className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 text-xs"
                        >
                          <div className="flex items-center gap-1">
                            {getPlatformLabel(platformData.platform)}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePlatform(platformData.platform);
                              }}
                              className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                            >
                              <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </button>
                          </div>
                        </Badge>
                        {platformData.onlineUserId && (
                          <span className="text-xs text-muted-foreground">
                            ID: {platformData.onlineUserId}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm font-inter font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300 pr-10 text-sm sm:text-base"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-2 sm:px-3 hover:bg-transparent w-8 h-8 sm:w-10 sm:h-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-inter font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="bg-input/50 border-border/50 focus:border-primary focus:shadow-neon-orange transition-all duration-300 pr-10 text-sm sm:text-base"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-2 sm:px-3 hover:bg-transparent w-8 h-8 sm:w-10 sm:h-10"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-gaming hover:shadow-neon-orange transition-all duration-300 font-inter font-semibold text-sm sm:text-base py-2.5 sm:py-3"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span className="text-xs sm:text-sm">Creating account...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Create Account</span>
                </div>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground text-xs">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-primary hover:text-accent transition-colors duration-300 font-inter font-medium text-xs sm:text-sm"
              >
                Sign in instead
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}