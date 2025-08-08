import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Target, Building2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFund } from '@/contexts/FundContext';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';

interface FundCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FundData {
  name: string;
  description: string;
  fund_type: 'venture_capital' | 'private_equity';
  target_size: number;
  currency: string;
}

const FUND_TYPES = [
  { value: 'venture_capital', label: 'Venture Capital', description: 'Early-stage equity investments in startups' },
  { value: 'private_equity', label: 'Private Equity', description: 'Growth capital and buyout investments' }
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export function FundCreationWizard({ isOpen, onClose }: FundCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { funds, setSelectedFund } = useFund();
  const { canCreateFunds } = usePermissions();

  // Don't render if user doesn't have permission
  if (!canCreateFunds) {
    return null;
  }
  
  const [fundData, setFundData] = useState<FundData>({
    name: '',
    description: '',
    fund_type: 'venture_capital',
    target_size: 10000000,
    currency: 'USD'
  });

  const steps = [
    {
      title: 'Fund Basics',
      description: 'Name and description for your fund'
    },
    {
      title: 'Fund Type',
      description: 'Choose your investment strategy type'
    },
    {
      title: 'Fund Size',
      description: 'Set your target fund size'
    },
    {
      title: 'Activate Fund',
      description: 'Review and activate your fund'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateFund = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's profile to get organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.organization_id) {
        toast.error('Organization not found');
        return;
      }

      // Create the fund
      const { data: newFund, error } = await supabase
        .from('funds')
        .insert({
          name: fundData.name,
          description: fundData.description,
          fund_type: fundData.fund_type,
          target_size: fundData.target_size,
          currency: fundData.currency,
          organization_id: profile.organization_id,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Set as selected fund
      setSelectedFund(newFund);
      
      toast.success('Fund created successfully!');
      onClose();
      
      // Reset form
      setFundData({
        name: '',
        description: '',
        fund_type: 'venture_capital',
        target_size: 10000000,
        currency: 'USD'
      });
      setCurrentStep(0);
    } catch (error) {
      console.error('Error creating fund:', error);
      toast.error('Failed to create fund');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return fundData.name.trim() && fundData.description.trim();
      case 1:
        return fundData.fund_type;
      case 2:
        return fundData.target_size > 0;
      default:
        return true;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Create New Fund
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{steps[currentStep].title}</h3>
              <p className="text-muted-foreground">{steps[currentStep].description}</p>
            </div>

            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Fund Name *</Label>
                  <Input
                    id="name"
                    value={fundData.name}
                    onChange={(e) => setFundData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Acme Ventures Fund I"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Fund Description *</Label>
                  <Textarea
                    id="description"
                    value={fundData.description}
                    onChange={(e) => setFundData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your fund's investment focus and strategy..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <Label>Select Fund Type *</Label>
                <div className="grid grid-cols-1 gap-4">
                  {FUND_TYPES.map((type) => (
                    <div
                      key={type.value}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        fundData.fund_type === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setFundData(prev => ({ ...prev, fund_type: type.value as 'venture_capital' | 'private_equity' }))}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{type.label}</h4>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </div>
                        {fundData.fund_type === type.value && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target_size">Target Fund Size *</Label>
                    <Input
                      id="target_size"
                      type="number"
                      value={fundData.target_size}
                      onChange={(e) => setFundData(prev => ({ ...prev, target_size: parseInt(e.target.value) || 0 }))}
                      placeholder="10000000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ${(fundData.target_size / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency *</Label>
                    <Select value={fundData.currency} onValueChange={(value) => setFundData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Fund Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{fundData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">
                        {FUND_TYPES.find(t => t.value === fundData.fund_type)?.label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target Size:</span>
                      <span className="font-medium">${(fundData.target_size / 1000000).toFixed(1)}M {fundData.currency}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm text-primary/80">
                    <CheckCircle className="h-4 w-4 inline mr-1" />
                    Your fund will be created and activated. You can then configure your investment strategy and start managing deals.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCreateFund}
                disabled={loading || !isStepValid()}
                className="gap-2"
              >
                {loading ? 'Creating...' : 'Create Fund'}
                <Target className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}