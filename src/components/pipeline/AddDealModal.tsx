import React, { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';
import { useAnalysisIntegration } from '@/hooks/useAnalysisIntegration';
import { Building2 } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { STANDARDIZED_SECTORS, sectorsToString } from '@/constants/sectors';
import { LOCATION_OPTIONS, locationsToString, stringToLocations } from '@/constants/locations';

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
  onAddDeal: (dealData: Partial<Deal> & { company_name: string; created_by: string }) => Promise<Deal | undefined>;
  initialStage?: string;
}

export const AddDealModal = React.memo<AddDealModalProps>(({
  open,
  onClose,
  onAddDeal,
  initialStage = 'sourced'
}) => {
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    industry: [] as string[], // Changed to array for multi-select
    location: [] as string[], // Changed to array for multi-select
    website: '',
    linkedin_url: '',
    crunchbase_url: '',
    deal_size: '',
    valuation: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { triggerDealAnalysis } = useAnalysisIntegration();
  
  // Ref to prevent duplicate submissions
  const submissionInProgress = useRef(false);

  // Memoize form validation to prevent unnecessary re-renders
  const isFormValid = useMemo(() => {
    return formData.company_name.trim().length > 0;
  }, [formData.company_name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (submissionInProgress.current) {
      return;
    }
    
    if (!formData.company_name.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive"
      });
      return;
    }

    // Set submission guard and loading state immediately
    submissionInProgress.current = true;
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add deals",
          variant: "destructive"
        });
        return;
      }

      const dealData = {
        company_name: formData.company_name,
        created_by: user.id,
        description: formData.description || undefined,
        industry: formData.industry.length > 0 ? sectorsToString(formData.industry) : undefined, // Convert array to string
        location: formData.location.length > 0 ? locationsToString(formData.location) : undefined, // Convert array to string
        website: formData.website || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        crunchbase_url: formData.crunchbase_url || undefined,
        deal_size: formData.deal_size ? parseInt(formData.deal_size) : undefined,
        valuation: formData.valuation ? parseInt(formData.valuation) : undefined,
        currency: formData.currency || undefined
      };

      // Fallback to original method first, then enhance
      const newDeal = await onAddDeal(dealData);
      
      if (newDeal) {
        // Now process through universal processor for enhancement
        try {
          const { data: processedResult, error: processingError } = await supabase.functions.invoke('universal-deal-processor', {
            body: {
              dealId: newDeal.id,
              source: 'single_upload',
              fundId: newDeal.fund_id,
              options: {
                priority: 'high',
                metadata: { singleUpload: true }
              }
            }
          });

          if (processingError) {
            console.warn('Universal processing failed:', processingError);
          } else {
            console.log('Deal enhanced successfully via universal processor');
          }
        } catch (error) {
          console.warn('Enhancement failed but deal created:', error);
        }

        // Trigger initial analysis with enforcement
        await triggerDealAnalysis(newDeal.id, 'initial', newDeal.fund_id);

        toast({
          title: "Success",
          description: `Deal "${formData.company_name}" created successfully!`,
        });

        // Close modal immediately after successful creation
        handleComplete();
      }
    } catch (error) {
      console.error('Error adding deal:', error);
      toast({
        title: "Error",
        description: "Failed to create deal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      submissionInProgress.current = false;
    }
  };


  const handleComplete = () => {
    // Reset form and state
    setFormData({
      company_name: '',
      description: '',
      industry: [], // Reset to empty array
      location: [], // Reset to empty array
      website: '',
      linkedin_url: '',
      crunchbase_url: '',
      deal_size: '',
      valuation: '',
      currency: 'USD'
    });
    submissionInProgress.current = false;
    onClose();
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Add New Deal
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Name */}
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the company"
                  rows={3}
                />
              </div>

              {/* Industry & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry / Sectors</Label>
                  <MultiSelect
                    options={STANDARDIZED_SECTORS}
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange('industry', value)}
                    placeholder="Select industries..."
                    searchPlaceholder="Search sectors..."
                    maxDisplay={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Select multiple sectors that best describe the company
                  </p>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <MultiSelect
                    options={LOCATION_OPTIONS}
                    value={formData.location}
                    onValueChange={(value) => handleInputChange('location', value)}
                    placeholder="Select locations..."
                    searchPlaceholder="Search countries and ecosystems..."
                    maxDisplay={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Select countries or startup ecosystems
                  </p>
                </div>
              </div>

              {/* Website & Social URLs */}
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://company.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="linkedin_url">Company LinkedIn Profile</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
                <div>
                  <Label htmlFor="crunchbase_url">Crunchbase URL</Label>
                  <Input
                    id="crunchbase_url"
                    type="url"
                    value={formData.crunchbase_url}
                    onChange={(e) => handleInputChange('crunchbase_url', e.target.value)}
                    placeholder="https://crunchbase.com/organization/..."
                  />
                </div>
              </div>

              {/* Financial Info */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="deal_size">Deal Size</Label>
                  <NumberInput
                    value={formData.deal_size ? parseInt(formData.deal_size) : undefined}
                    onChange={(value) => handleInputChange('deal_size', value?.toString() || '')}
                    placeholder="1,000,000"
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Valuation */}
              <div>
                <Label htmlFor="valuation">Valuation</Label>
                <NumberInput
                  value={formData.valuation ? parseInt(formData.valuation) : undefined}
                  onChange={(value) => handleInputChange('valuation', value?.toString() || '')}
                  placeholder="10,000,000"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !isFormValid}
                  className="bg-brand-emerald hover:bg-brand-emerald-dark"
                >
                  {loading ? 'Creating Deal...' : 'Create Deal'}
                </Button>
              </div>

              {/* Note for document uploads */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Once a deal is created, you can upload pitch decks and other documents via the deal card tabs.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
});