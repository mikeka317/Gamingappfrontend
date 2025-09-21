import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Trophy,
  CreditCard,
  X,
  Gamepad2,
  User,
  LogOut,
  Target,
  Bot,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const sidebarItems = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Lobby', path: '/lobby' },
  { icon: Crown, label: 'Tournament', path: '/tournament' },
  { icon: Trophy, label: 'My Challenges', path: '/my-challenges' },
  { icon: Target, label: 'Challenges For Me', path: '/challenges-for-me' },
  { icon: CreditCard, label: 'Transactions', path: '/transactions' },
  
  { icon: User, label: 'Profile', path: '/profile' },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-glass z-50 transform transition-transform duration-300 ease-in-out flex flex-col",
        "w-64 sm:w-72 lg:w-60 xl:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:sticky lg:top-0"
      )}>
        {/* Header */}
        <div className="flex-shrink-0 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-gaming rounded-lg flex items-center justify-center shadow-neon-orange">
              <Gamepad2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            </div>
            <span className="font-orbitron font-bold text-base sm:text-lg bg-gradient-gaming bg-clip-text text-transparent">
              GC Pro
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden hover:bg-secondary/80 w-8 h-8 sm:w-10 sm:h-10"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Navigation - Flex grow to take available space */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-300 group",
                  isActive
                    ? "bg-primary/20 text-primary shadow-neon-orange border border-primary/30"
                    : "hover:bg-secondary/50 hover:shadow-neon-cyan text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-300 flex-shrink-0",
                  isActive ? "text-primary" : "group-hover:text-accent"
                )} />
                <span className="font-inter font-medium text-sm sm:text-base truncate">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary shadow-neon-orange flex-shrink-0" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer - Fixed at bottom with proper spacing */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-border/50 space-y-3">
          {/* Status Card */}
          <div className="bg-gradient-glow rounded-lg p-3 sm:p-4 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs sm:text-sm font-inter font-medium text-success">Online</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ready to challenge opponents
            </p>
          </div>
          
          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full bg-destructive/10 hover:bg-destructive/20 border-destructive/30 hover:border-destructive/50 text-destructive hover:text-destructive transition-all duration-300"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </aside>
    </>
  );
};