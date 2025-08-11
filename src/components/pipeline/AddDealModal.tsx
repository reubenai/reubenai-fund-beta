import React, { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { useAnalysisIntegration } from '@/hooks/useAnalysisIntegration';
import { FileText, Upload, Building2 } from 'lucide-react';
import { MultiSelect } from '@/components/ui/multi-select';
import { STANDARDIZED_SECTORS, sectorsToString, sectorsFromString } from '@/constants/sectors';

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
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    industry: [] as string[], // Changed to array for multi-select
    location: '',
    website: '',
    linkedin_url: '',
    crunchbase_url: '',
    deal_size: '',
    valuation: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [createdDeal, setCreatedDeal] = useState<Deal | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
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
        location: formData.location || undefined,
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

        setCreatedDeal(newDeal);
        
        // Trigger initial analysis with enforcement
        await triggerDealAnalysis(newDeal.id, 'initial', newDeal.fund_id);
        
        // Auto-navigate to documents tab for pitch deck upload
        setActiveTab('documents');

        toast({
          title: "Success",
          description: `Deal "${formData.company_name}" created successfully. Please upload pitch deck and supporting documents for AI analysis.`,
        });
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

  const handleDocumentUpload = async (document: any) => {
    setUploadedDocuments(prev => [...prev, document]);
    
    // Trigger comprehensive analysis if this is a pitch deck
    if (document.document_category === 'pitch_deck' && createdDeal) {
      try {
        console.log('Triggering comprehensive analysis for pitch deck upload...');
        
        // Trigger the Reuben Orchestrator for comprehensive analysis
        await supabase.functions.invoke('reuben-orchestrator', {
          body: {
            dealId: createdDeal.id,
            trigger: 'pitch_deck_uploaded',
            engines: [
              'enhanced-deal-analysis',
              'financial-engine',
              'market-research-engine', 
              'thesis-alignment-engine',
              'rag-calculation-engine',
              'ai-memo-generator'
            ],
            metadata: {
              document_id: document.id,
              document_name: document.name,
              document_category: document.document_category
            }
          }
        });

        toast({
          title: "Analysis Triggered",
          description: "Comprehensive AI analysis started for the uploaded pitch deck. Results will be available shortly.",
        });
      } catch (error) {
        console.error('Failed to trigger analysis:', error);
        toast({
          title: "Warning",
          description: "Document uploaded but analysis trigger failed. You can manually trigger analysis later.",
          variant: "destructive"
        });
      }
    }
  };

  const handleComplete = () => {
    // Reset form and state
    setFormData({
      company_name: '',
      description: '',
      industry: [], // Reset to empty array
      location: '',
      website: '',
      linkedin_url: '',
      crunchbase_url: '',
      deal_size: '',
      valuation: '',
      currency: 'USD'
    });
    setCreatedDeal(null);
    setUploadedDocuments([]);
    setActiveTab('basic');
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Create Deal & Upload Pitch Deck
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
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
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                      />
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
                      <Label htmlFor="linkedin_url">LinkedIn URL</Label>
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
                      <Input
                        id="deal_size"
                        type="number"
                        value={formData.deal_size}
                        onChange={(e) => handleInputChange('deal_size', e.target.value)}
                        placeholder="1000000"
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
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Valuation */}
                  <div>
                    <Label htmlFor="valuation">Valuation</Label>
                    <Input
                      id="valuation"
                      type="number"
                      value={formData.valuation}
                      onChange={(e) => handleInputChange('valuation', e.target.value)}
                      placeholder="10000000"
                    />
                  </div>

                  {/* Pitch Deck Upload Section */}
                  {createdDeal && (
                    <div className="space-y-4 pt-6 border-t border-border">
                      <div className="flex items-center gap-2 text-lg font-medium">
                        <FileText className="h-5 w-5" />
                        Upload Pitch Deck
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload your pitch deck to trigger comprehensive AI analysis. Our system will automatically analyze all aspects of your company.
                      </p>
                      <DocumentUpload
                        dealId={createdDeal.id}
                        companyName={createdDeal.company_name}
                        onUploadComplete={handleDocumentUpload}
                      />
                      
                      {uploadedDocuments.length > 0 && (
                        <div className="space-y-2 pt-4">
                          <h4 className="font-medium">Uploaded Documents</h4>
                          {uploadedDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                              <FileText className="h-5 w-5 text-green-600" />
                              <div className="flex-1">
                                <p className="font-medium">{doc.name}</p>
                                <p className="text-sm text-muted-foreground">{doc.document_category}</p>
                              </div>
                              <div className="text-sm text-green-600">✓ Uploaded</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    {!createdDeal ? (
                      <Button 
                        type="submit" 
                        disabled={loading || !isFormValid}
                        className="bg-brand-emerald hover:bg-brand-emerald-dark"
                      >
                        {loading ? 'Creating Deal...' : 'Create Deal'}
                      </Button>
                    ) : (
                      <Button onClick={handleComplete} className="bg-brand-emerald hover:bg-brand-emerald-dark">
                        Complete & Analyze Deal
                      </Button>
                    )}
                  </div>

                  {/* Note for document uploads */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> once a deal is created, you can upload pitch decks and other Deal documents via the Deal card tabs
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
});