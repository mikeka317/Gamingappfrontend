import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  CreditCard, 
  Banknote, 
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  onWithdraw: (withdrawalData: WithdrawalData) => void;
}

interface WithdrawalData {
  amount: number;
  bankAccountId: string;
  bankAccountName: string;
  bankAccountLast4: string;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountType: string;
  last4: string;
  accountName: string;
  isDefault: boolean;
}

// Mock bank accounts - in real app, these would come from Stripe Connect
const mockBankAccounts: BankAccount[] = [
  {
    id: 'ba_1',
    bankName: 'Chase Bank',
    accountType: 'Checking',
    last4: '1234',
    accountName: 'John Doe',
    isDefault: true,
  },
  {
    id: 'ba_2',
    bankName: 'Bank of America',
    accountType: 'Savings',
    last4: '5678',
    accountName: 'John Doe',
    isDefault: false,
  },
  {
    id: 'ba_3',
    bankName: 'Wells Fargo',
    accountType: 'Checking',
    last4: '9012',
    accountName: 'John Doe',
    isDefault: false,
  },
];

export function WithdrawalModal({ isOpen, onClose, walletBalance, onWithdraw }: WithdrawalModalProps) {
  const [amount, setAmount] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'amount' | 'confirmation' | 'processing' | 'success'>('amount');
  const [withdrawalFee, setWithdrawalFee] = useState(0);
  const [netAmount, setNetAmount] = useState(0);

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setAmount(value);
    
    // Calculate withdrawal fee (2.9% + $0.30 for Stripe)
    const fee = Math.max(0.30, numValue * 0.029);
    setWithdrawalFee(fee);
    setNetAmount(numValue - fee);
  };

  const handleBankAccountSelect = (bankAccountId: string) => {
    setSelectedBankAccount(bankAccountId);
  };

  const getSelectedBankAccount = () => {
    return mockBankAccounts.find(account => account.id === selectedBankAccount);
  };

  const handleContinue = () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!selectedBankAccount) {
      alert('Please select a bank account');
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    
    // Check if withdrawal amount exceeds available balance
    if (withdrawalAmount > walletBalance) {
      alert(`Insufficient funds. You can only withdraw up to $${walletBalance.toFixed(2)}`);
      return;
    }

    if (withdrawalAmount < 10) {
      alert('Minimum withdrawal amount is $10');
      return;
    }

    setStep('confirmation');
  };

  const handleConfirmWithdrawal = () => {
    setStep('processing');
    setIsProcessing(true);

    // Simulate Stripe Connect API call
    setTimeout(() => {
      const selectedAccount = getSelectedBankAccount();
      if (selectedAccount) {
        onWithdraw({
          amount: parseFloat(amount),
          bankAccountId: selectedAccount.id,
          bankAccountName: selectedAccount.accountName,
          bankAccountLast4: selectedAccount.last4,
        });
      }
      
      setStep('success');
      setIsProcessing(false);
    }, 3000);
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setAmount('');
    setSelectedBankAccount('');
    setStep('amount');
    setWithdrawalFee(0);
    setNetAmount(0);
  };

  const renderAmountStep = () => (
    <div className="space-y-6">
      {/* Available Balance */}
      <Card className="bg-gradient-glow border-success/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-inter font-medium text-success">Available Balance</p>
                <p className="text-sm text-success/70">Amount you can withdraw</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-orbitron font-bold text-2xl text-success">
                ${walletBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Amount */}
      <div className="space-y-3">
        <Label htmlFor="amount" className="font-inter font-medium">
          Withdrawal Amount
        </Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
                            className="pl-10 bg-secondary/30 border-border/50 focus:border-primary/50 focus:shadow-neon-orange transition-all duration-300"
            min="10"
            max={walletBalance}
            step="0.01"
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Min: $10.00</span>
          <span className="text-muted-foreground">Max: ${walletBalance.toFixed(2)}</span>
        </div>
      </div>

      {/* Fee Breakdown */}
      {parseFloat(amount) > 0 && (
        <Card className="bg-secondary/20 border-border/30">
          <CardContent className="p-4 space-y-3">
            <h4 className="font-inter font-semibold text-sm">Fee Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Withdrawal Amount:</span>
                <span>${parseFloat(amount) || 0}</span>
              </div>
              <div className="flex justify-between text-warning">
                <span>Stripe Fee (2.9% + $0.30):</span>
                <span>-${withdrawalFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-border/30 pt-2">
                <div className="flex justify-between font-semibold">
                  <span>You'll Receive:</span>
                  <span className="text-success">${netAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Account Selection */}
      <div className="space-y-3">
        <Label className="font-inter font-medium">Select Bank Account</Label>
        <Select value={selectedBankAccount} onValueChange={handleBankAccountSelect}>
          <SelectTrigger className="bg-secondary/30 border-border/50 focus:border-primary/50">
            <SelectValue placeholder="Choose your bank account" />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
            {mockBankAccounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{account.bankName}</span>
                      {account.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {account.accountType} •••• {account.last4}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          onClick={() => {
            alert('In a real application, this would redirect to Stripe Connect onboarding to securely add your bank account details. For now, you can use the existing mock accounts above.');
          }}
          variant="outline"
          className="w-full border-dashed border-border/50 hover:border-primary/50 hover:bg-primary/5"
        >
          <Banknote className="h-4 w-4 mr-2" />
          Add New Bank Account
        </Button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!amount || !selectedBankAccount || parseFloat(amount) <= 0 || parseFloat(amount) > walletBalance}
          className="bg-gradient-gaming hover:shadow-neon-orange transition-all duration-300 font-inter font-semibold"
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => {
    const selectedAccount = getSelectedBankAccount();
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowUpRight className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-orbitron text-xl mb-2">Confirm Withdrawal</h3>
          <p className="text-muted-foreground">Please review your withdrawal details</p>
        </div>

        {/* Withdrawal Summary */}
        <Card className="bg-gradient-glow border-primary/30">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-inter font-medium">Amount:</span>
              <span className="font-orbitron font-bold text-lg">${parseFloat(amount)}</span>
            </div>
            <div className="flex justify-between items-center text-warning">
              <span className="font-inter font-medium">Fee:</span>
              <span>${withdrawalFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-border/30 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-inter font-semibold">You'll Receive:</span>
                <span className="font-orbitron font-bold text-xl text-success">${netAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Details */}
        <Card className="bg-secondary/20 border-border/30">
          <CardContent className="p-4">
            <h4 className="font-inter font-semibold mb-3">Bank Account Details</h4>
            {selectedAccount && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank:</span>
                  <span>{selectedAccount.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Type:</span>
                  <span>{selectedAccount.accountType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Number:</span>
                  <span>•••• {selectedAccount.last4}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account Holder:</span>
                  <span>{selectedAccount.accountName}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Time Info */}
        <div className="flex items-start gap-3 p-3 bg-info/10 border border-info/30 rounded-lg">
          <Info className="h-5 w-5 text-info mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-info">Processing Time</p>
            <p className="text-info/70">Funds will be transferred to your bank account within 2-3 business days via Stripe Connect.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setStep('amount')}>
            Back
          </Button>
          <Button
            onClick={handleConfirmWithdrawal}
            className="bg-gradient-gaming hover:shadow-neon-orange transition-all duration-300 font-inter font-semibold"
          >
            Confirm Withdrawal
        </Button>
        </div>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
      <div>
        <h3 className="font-orbitron text-xl mb-2">Processing Withdrawal</h3>
        <p className="text-muted-foreground">Please wait while we process your withdrawal request...</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>Connecting to Stripe Connect</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>Verifying bank account details</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>Initiating transfer</span>
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-8 w-8 text-success" />
      </div>
      <div>
        <h3 className="font-orbitron text-xl mb-2 text-success">Withdrawal Successful!</h3>
        <p className="text-muted-foreground">Your withdrawal request has been processed successfully.</p>
      </div>
      
      <Card className="bg-success/10 border-success/30">
        <CardContent className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span>${parseFloat(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee:</span>
              <span className="text-warning">${withdrawalFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-success/30 pt-2">
              <div className="flex justify-between font-semibold text-success">
                <span>You'll Receive:</span>
                <span>${netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 p-3 bg-info/10 border border-info/30 rounded-lg">
        <Info className="h-5 w-5 text-info mt-0.5" />
        <div className="text-sm text-left">
          <p className="font-medium text-info">What happens next?</p>
          <p className="text-info/70">Funds will be transferred to your bank account within 2-3 business days. You'll receive an email confirmation from Stripe.</p>
        </div>
      </div>

              <Button onClick={handleClose} className="w-full bg-gradient-gaming hover:shadow-neon-orange">
        Done
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-xl bg-gradient-gaming bg-clip-text text-transparent">
            Withdraw Funds
          </DialogTitle>
          <DialogDescription className="font-inter text-muted-foreground">
            Transfer your winnings to your bank account via Stripe Connect
          </DialogDescription>
        </DialogHeader>

        {step === 'amount' && renderAmountStep()}
        {step === 'confirmation' && renderConfirmationStep()}
        {step === 'processing' && renderProcessingStep()}
        {step === 'success' && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  );
}
