import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Gamepad2, Zap, Trophy, Users, Play } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const Index = () => {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen bg-background p-8 relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      <div className="max-w-6xl mx-auto text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-gaming rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-neon-orange">
            <Gamepad2 className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-gaming bg-clip-text text-transparent mb-4 font-orbitron">
            GameChallenge
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Challenge players worldwide, stake your skills, and dominate the competition in your favorite games.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button asChild size="lg" className="bg-gradient-gaming hover:bg-gradient-gaming-hover px-8 py-6 text-lg shadow-neon-orange hover:shadow-neon-orange-hover transition-all duration-300">
            <Link to="/register">
              <Zap className="h-5 w-5 mr-2" />
              Get Started
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-primary/50 hover:bg-primary/10 px-8 py-6 text-lg transition-all duration-300">
            <Link to="/login">
              Sign In
            </Link>
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-neon-orange transition-all duration-300">
            <Trophy className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Compete & Win</h3>
            <p className="text-muted-foreground">Challenge players and earn real money from your gaming skills</p>
          </div>
          <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-neon-orange transition-all duration-300">
            <Users className="h-8 w-8 text-accent mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Global Players</h3>
            <p className="text-muted-foreground">Connect with gamers from around the world in real-time</p>
          </div>
          <div className="p-6 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 hover:shadow-neon-orange transition-all duration-300">
            <Zap className="h-8 w-8 text-success mx-auto mb-3" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Instant Matches</h3>
            <p className="text-muted-foreground">Quick matchmaking and instant proof verification</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 p-8 mb-12 hover:shadow-neon-orange transition-all duration-300">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Platform Statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
              <p className="text-muted-foreground">Total Challenges</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">50,000+</div>
              <p className="text-muted-foreground">Active Players</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success mb-2">10+</div>
              <p className="text-muted-foreground">Games Supported</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning mb-2">$1M+</div>
              <p className="text-muted-foreground">Verified Earnings</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Dominate?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
            Join thousands of players already earning on GameChallenge. Your next victory could be just one challenge away.
          </p>
          <Button asChild size="lg" className="bg-gradient-gaming hover:bg-gradient-gaming-hover px-10 py-6 text-lg shadow-neon-orange hover:shadow-neon-orange-hover transition-all duration-300">
            <Link to="/register">
              <Trophy className="h-5 w-5 mr-2" />
              Start Challenging
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
