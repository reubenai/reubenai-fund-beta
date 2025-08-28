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
import { COMPREHENSIVE_INDUSTRY_OPTIONS } from '@/constants/enhancedIndustries';
import { LOCATION_OPTIONS, locationsToString, stringToLocations } from '@/constants/locations';
import { sanitizeUrl } from '@/hooks/useValidation';
import { useLinkedInProfileEnrichment } from '@/hooks/useLinkedInProfileEnrichment';
import { usePerplexityFounderEnrichment } from '@/hooks/usePerplexityFounderEnrichment';
import { usePerplexityMarketEnrichment } from '@/hooks/usePerplexityMarketEnrichment';

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
    industry: [] as string[], // Array for hierarchical industry selection
    specialized_sectors: [] as string[], // Array for specialized sectors
    location: [] as string[], // Changed to array for multi-select
    website: '',
    linkedin_url: '',
    crunchbase_url: '',
    current_round_size: '',
    valuation: '',
    currency: 'USD',
    founder_name: '',
    founder_email: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { triggerDealAnalysis } = useAnalysisIntegration();
  const { triggerProfileEnrichment } = useLinkedInProfileEnrichment();
  const { triggerFounderEnrichment } = usePerplexityFounderEnrichment();
  const { triggerMarketEnrichment } = usePerplexityMarketEnrichment();
  
  // Ref to prevent duplicate submissions
  const submissionInProgress = useRef(false);

  // Memoize form validation to prevent unnecessary re-renders
  const isFormValid = useMemo(() => {
    return (
      formData.company_name.trim().length > 0 &&
      formData.industry.length > 0 &&
      formData.specialized_sectors.length > 0 &&
      formData.location.length > 0 &&
      formData.founder_name.trim().length > 0 &&
      formData.founder_email.trim().length > 0 &&
      formData.website.trim().length > 0
    );
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (submissionInProgress.current) {
      return;
    }
    
    // Validate required fields
    const requiredFields = [
      { field: 'company_name', label: 'Company name' },
      { field: 'industry', label: 'Primary industries' },
      { field: 'specialized_sectors', label: 'Specialized sectors' },
      { field: 'location', label: 'Location' },
      { field: 'founder_name', label: 'Founder name' },
      { field: 'founder_email', label: 'Founder email' },
      { field: 'website', label: 'Company website' }
    ];

    for (const { field, label } of requiredFields) {
      const value = formData[field as keyof typeof formData];
      if (Array.isArray(value) ? value.length === 0 : !value?.toString().trim()) {
        toast({
          title: "Error",
          description: `${label} is required`,
          variant: "destructive"
        });
        return;
      }
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

      // Sanitize form data to remove malformed objects
      const sanitizeValue = (value: any) => {
        if (value && typeof value === 'object' && value._type === 'undefined') {
          return undefined;
        }
        return value || undefined;
      };

      const dealData = {
        company_name: formData.company_name,
        created_by: user.id,
        description: sanitizeValue(formData.description),
        industry: formData.industry.length > 0 ? formData.industry.join(';') : undefined,
        primary_industry: formData.industry.length > 0 ? formData.industry[0] : undefined,
        specialized_sectors: formData.specialized_sectors.length > 0 ? formData.specialized_sectors : undefined,
        location: formData.location.length > 0 ? locationsToString(formData.location) : undefined,
        website: sanitizeValue(formData.website),
        linkedin_url: sanitizeValue(formData.linkedin_url) ? sanitizeUrl(sanitizeValue(formData.linkedin_url)) : undefined,
        crunchbase_url: sanitizeValue(formData.crunchbase_url),
        current_round_size: sanitizeValue(formData.current_round_size) ? parseInt(sanitizeValue(formData.current_round_size)) : undefined,
        valuation: sanitizeValue(formData.valuation) ? parseInt(sanitizeValue(formData.valuation)) : undefined,
        currency: formData.currency || 'USD',
        founder_name: sanitizeValue(formData.founder_name),
        founder_email: sanitizeValue(formData.founder_email)
      };

      // Create deal first, then enhance (enhancement failures shouldn't block deal creation)
      const newDeal = await onAddDeal(dealData);
      
      if (newDeal) {
        console.log('✅ Deal created successfully:', newDeal.company_name);
        
        // Start background enrichment processes (non-blocking)
        try {
          console.log('🚀 Starting independent background enrichment processes...');
          
          let enrichmentProcesses = 0;

          // 1. LinkedIn Company Enrichment (if LinkedIn URL available)
          if (formData.linkedin_url) {
            enrichmentProcesses++;
            console.log('📤 Starting LinkedIn company enrichment...');
            supabase.functions.invoke('brightdata-linkedin-enrichment', {
              body: {
                dealId: newDeal.id,
                companyName: formData.company_name,
                linkedinUrl: formData.linkedin_url
              }
            }).then(({ data, error }) => {
              if (error) {
                console.error('❌ LinkedIn company enrichment failed:', error);
              } else {
                console.log('✅ LinkedIn company enrichment completed:', data);
              }
            }).catch(err => {
              console.error('💥 LinkedIn company enrichment error:', err);
            });
          }

          // 2. Crunchbase Enrichment (if Crunchbase URL available)
          if (formData.crunchbase_url) {
            enrichmentProcesses++;
            console.log('📤 Starting Crunchbase enrichment...');
            supabase.functions.invoke('company-enrichment-engine', {
              body: {
                dealId: newDeal.id,
                companyName: formData.company_name,
                crunchbaseUrl: formData.crunchbase_url
              }
            }).then(({ data, error }) => {
              if (error) {
                console.error('❌ Crunchbase enrichment failed:', error);
              } else {
                console.log('✅ Crunchbase enrichment completed:', data);
              }
            }).catch(err => {
              console.error('💥 Crunchbase enrichment error:', err);
            });
          }

          // 3. LinkedIn Profile Enrichment (if founder name available)
          if (formData.founder_name) {
            enrichmentProcesses++;
            console.log('📤 Starting LinkedIn profile enrichment...');
            supabase.functions.invoke('brightdata-linkedin-profile-enrichment', {
              body: {
                dealId: newDeal.id,
                firstName: formData.founder_name.split(' ')[0],
                lastName: formData.founder_name.split(' ').slice(1).join(' ')
              }
            }).then(({ data, error }) => {
              if (error) {
                console.error('❌ LinkedIn profile enrichment failed:', error);
              } else {
                console.log('✅ LinkedIn profile enrichment completed:', data);
              }
            }).catch(err => {
              console.error('💥 LinkedIn profile enrichment error:', err);
            });
          }

          // 4. Perplexity Founder Enrichment (if founder name available)
          if (formData.founder_name && formData.company_name) {
            enrichmentProcesses++;
            console.log('📤 Starting Perplexity founder enrichment...');
            supabase.functions.invoke('perplexity-founder-enrichment', {
              body: {
                dealId: newDeal.id,
                founderName: formData.founder_name,
                companyName: formData.company_name,
                companyWebsite: formData.website,
                linkedinUrl: formData.linkedin_url,
                crunchbaseUrl: formData.crunchbase_url
              }
            }).then(({ data, error }) => {
              if (error) {
                console.error('❌ Perplexity founder enrichment failed:', error);
              } else {
                console.log('✅ Perplexity founder enrichment completed:', data);
              }
            }).catch(err => {
              console.error('💥 Perplexity founder enrichment error:', err);
            });
          }

          // 5. Perplexity Company Enrichment (if company name available)
          if (formData.company_name) {
            enrichmentProcesses++;
            console.log('📤 Starting Perplexity company enrichment...');
            supabase.functions.invoke('perplexity-company-enrichment', {
              body: {
                dealId: newDeal.id,
                companyName: formData.company_name,
                additionalContext: {
                  industry: formData.industry.length > 0 ? formData.industry.join(';') : undefined,
                  website: formData.website,
                  description: formData.description
                }
              }
            }).then(({ data, error }) => {
              if (error) {
                console.error('❌ Perplexity company enrichment failed:', error);
              } else {
                console.log('✅ Perplexity company enrichment completed:', data);
              }
            }).catch(err => {
              console.error('💥 Perplexity company enrichment error:', err);
            });
          }

          // 6. Perplexity Market Enrichment (if industry and location available)
          if (formData.industry.length > 0 && formData.location.length > 0) {
            enrichmentProcesses++;
            console.log('📤 Starting Perplexity market enrichment...');
            supabase.functions.invoke('perplexity-market-enrichment', {
              body: {
                dealId: newDeal.id,
                primaryIndustry: formData.industry[0],
                location: formData.location[0]
              }
            }).then(({ data, error }) => {
              if (error) {
                console.error('❌ Perplexity market enrichment failed:', error);
              } else {
                console.log('✅ Perplexity market enrichment completed:', data);
              }
            }).catch(err => {
              console.error('💥 Perplexity market enrichment error:', err);
            });
          }

          console.log(`🔄 ${enrichmentProcesses} independent enrichment processes started for: ${formData.company_name}`);
          
        } catch (error) {
          console.error('💥 Background enrichment initiation error:', error);
          // Show warning toast but don't block deal creation
          toast({
            title: "Warning",
            description: `Deal created successfully but enrichment failed: ${error.message}`,
            variant: "destructive"
          });
        }

        toast({
          title: "Success",
          description: `Deal "${formData.company_name}" added successfully! Enrichment processes are running in the background.`,
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
      specialized_sectors: [], // Reset specialized sectors
      location: [], // Reset to empty array
      website: '',
      linkedin_url: '',
      crunchbase_url: '',
      current_round_size: '',
      valuation: '',
      currency: 'USD',
      founder_name: '',
      founder_email: ''
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
                  <Label htmlFor="industry">Primary Industries *</Label>
                  <MultiSelect
                    options={COMPREHENSIVE_INDUSTRY_OPTIONS.filter(opt => !opt.value.includes('_sector_'))}
                    value={formData.industry}
                    onValueChange={(value) => handleInputChange('industry', value)}
                    placeholder="Select primary industries..."
                    searchPlaceholder="Search industries..."
                    maxDisplay={2}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Select primary industries (e.g., Technology, Healthcare)
                  </p>
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
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

              {/* Specialized Sectors */}
              <div>
                <Label htmlFor="specialized_sectors">Specialized Sectors *</Label>
                <MultiSelect
                  options={COMPREHENSIVE_INDUSTRY_OPTIONS.filter(opt => opt.value.includes('_sector_'))}
                  value={formData.specialized_sectors}
                  onValueChange={(value) => handleInputChange('specialized_sectors', value)}
                  placeholder="Select specialized sectors..."
                  searchPlaceholder="Search specialized sectors..."
                  maxDisplay={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Select specific sectors (e.g., SaaS & Cloud Software, Digital Health)
                </p>
              </div>

              {/* Founder Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="founder_name">Founder Name *</Label>
                  <Input
                    id="founder_name"
                    value={formData.founder_name}
                    onChange={(e) => handleInputChange('founder_name', e.target.value)}
                    placeholder="Enter founder's name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="founder_email">Founder Email *</Label>
                  <Input
                    id="founder_email"
                    type="email"
                    value={formData.founder_email}
                    onChange={(e) => handleInputChange('founder_email', e.target.value)}
                    placeholder="founder@company.com"
                    required
                  />
                </div>
              </div>

              {/* Website & Social URLs */}
              <div>
                <Label htmlFor="website">Company Website *</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://company.com"
                  required
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
                  <Label htmlFor="current_round_size">Current Round Size</Label>
                  <NumberInput
                    value={formData.current_round_size && formData.current_round_size.trim() !== '' ? parseInt(formData.current_round_size) : undefined}
                    onChange={(value) => handleInputChange('current_round_size', value?.toString() || '')}
                    placeholder="Enter current round size"
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
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                      <SelectItem value="HKD">HKD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Valuation */}
              <div>
                <Label htmlFor="valuation">Valuation</Label>
                <NumberInput
                  value={formData.valuation && formData.valuation.trim() !== '' ? parseInt(formData.valuation) : undefined}
                  onChange={(value) => handleInputChange('valuation', value?.toString() || '')}
                  placeholder="Enter valuation"
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