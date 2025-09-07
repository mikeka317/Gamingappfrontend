import { useState } from 'react';
import { Wallet, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WithdrawalModal } from '@/components/ui/withdrawal-modal';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavbarProps {
  onMenuClick: () => void;
  walletBalance?: number;
  onWalletUpdate?: (newBalance: number) => void;
}

export const Navbar = ({ onMenuClick, walletBalance, onWalletUpdate }: NavbarProps) => {
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);

  const handleWithdrawal = (withdrawalData: any) => {
    // In real app, this would call your Stripe Connect API
    console.log('Withdrawal requested:', withdrawalData);
    
    // Update wallet balance (deduct withdrawal amount)
    if (onWalletUpdate) {
      const currentBalance = walletBalance || 0;
      onWalletUpdate(currentBalance - withdrawalData.amount);
    }
    
    // Close modal
    setWithdrawalModalOpen(false);
  };

  return (
    <>
      <nav className="h-14 sm:h-16 bg-card border-b border-border flex items-center justify-between px-3 sm:px-4 lg:px-6 backdrop-blur-xl bg-card/80">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="lg:hidden hover:bg-secondary/80 hover:shadow-neon-orange transition-all duration-300 w-8 h-8 sm:w-10 sm:h-10"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          
          {/* Logo and title removed */}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Wallet Balance - Clickable */}
          <Button
            variant="ghost"
            onClick={() => setWithdrawalModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 bg-secondary/50 rounded-lg px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 border border-border/50 hover:shadow-neon-green hover:bg-secondary/70 transition-all duration-300 cursor-pointer"
          >
            <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
            <span className="font-inter font-semibold text-success text-sm sm:text-base">
              ${(walletBalance || 0).toFixed(2)}
            </span>
          </Button>
        </div>
      </nav>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        walletBalance={walletBalance || 0}
        onWithdraw={handleWithdrawal}
      />
    </>
  );
};