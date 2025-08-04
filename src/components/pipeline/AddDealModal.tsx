import React, { useState } from 'react';
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
import { FileText, Upload, Building2 } from 'lucide-react';

interface AddDealModalProps {
  open: boolean;
  onClose: () => void;
  onAddDeal: (dealData: Partial<Deal> & { company_name: string; created_by: string }) => Promise<Deal | undefined>;
  initialStage?: string;
}

export const AddDealModal: React.FC<AddDealModalProps> = ({
  open,
  onClose,
  onAddDeal,
  initialStage = 'sourced'
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    industry: '',
    location: '',
    website: '',
    deal_size: '',
    valuation: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [createdDeal, setCreatedDeal] = useState<Deal | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      toast({
        title: "Error",
        description: "Company name is required",
        variant: "destructive"
      });
      return;
    }

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
        industry: formData.industry || undefined,
        location: formData.location || undefined,
        website: formData.website || undefined,
        deal_size: formData.deal_size ? parseInt(formData.deal_size) : undefined,
        valuation: formData.valuation ? parseInt(formData.valuation) : undefined,
        currency: formData.currency || undefined
      };

      const newDeal = await onAddDeal(dealData);
      
      if (newDeal) {
        setCreatedDeal(newDeal);
        
        // If we have uploaded documents, switch to the documents tab
        if (uploadedDocuments.length > 0) {
          setActiveTab('documents');
        } else {
          // If no documents, move to documents tab for pitch deck upload
          setActiveTab('documents');
        }

        toast({
          title: "Success",
          description: `Deal "${formData.company_name}" created successfully. ${uploadedDocuments.length === 0 ? 'Now upload pitch deck and supporting documents.' : 'Documents uploaded successfully.'}`,
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
      industry: '',
      location: '',
      website: '',
      deal_size: '',
      valuation: '',
      currency: 'USD'
    });
    setCreatedDeal(null);
    setUploadedDocuments([]);
    setActiveTab('basic');
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Info
            </TabsTrigger>
            <TabsTrigger value="documents" disabled={!createdDeal} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Pitch Deck & Documents
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
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        placeholder="e.g. SaaS, Fintech"
                      />
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

                  {/* Website */}
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

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-brand-emerald hover:bg-brand-emerald-dark"
                    >
                      {loading ? 'Creating Deal...' : 'Create Deal & Continue'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upload Pitch Deck & Supporting Documents
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload your pitch deck and other documents. Our AI will automatically analyze them and integrate insights into the deal analysis.
                </p>
              </CardHeader>
              <CardContent>
                {createdDeal ? (
                  <DocumentUpload
                    dealId={createdDeal.id}
                    companyName={createdDeal.company_name}
                    onUploadComplete={handleDocumentUpload}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Create the deal first to upload documents</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {uploadedDocuments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
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
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleComplete} className="bg-brand-emerald hover:bg-brand-emerald-dark">
                Complete & Analyze Deal
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};