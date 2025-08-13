import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Deal {
  id: string;
  company_name: string;
  industry?: string;
  location?: string;
  headquarters?: string;
  deal_size?: number;
  valuation?: number;
  currency?: string;
  founder?: string;
  founder_email?: string;
  co_founders?: string[];
  website?: string;
  linkedin_url?: string;
  crunchbase_url?: string;
  description?: string;
  business_model?: string;
  revenue_model?: string;
  target_market?: string;
  company_stage?: string;
  funding_stage?: string;
  founding_year?: number;
  employee_count?: number;
  current_round_size?: number;
  capital_raised_to_date?: number;
  previous_funding_amount?: number;
  countries_of_operation?: string[];
  competitors?: string[];
  key_customers?: string[];
  technology_stack?: string[];
  next_action?: string;
  priority?: string;
}

interface EditDealModalProps {
  deal: Deal | null;
  open: boolean;
  onClose: () => void;
  onUpdateComplete: () => void;
}

export const EditDealModal: React.FC<EditDealModalProps> = ({
  deal,
  open,
  onClose,
  onUpdateComplete
}) => {
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    industry: '',
    location: '',
    headquarters: '',
    website: '',
    linkedin_url: '',
    crunchbase_url: '',
    founder: '',
    founder_email: '',
    co_founders: '',
    business_model: '',
    revenue_model: '',
    target_market: '',
    company_stage: '',
    funding_stage: '',
    founding_year: '',
    employee_count: '',
    current_round_size: '',
    capital_raised_to_date: '',
    previous_funding_amount: '',
    countries_of_operation: '',
    competitors: '',
    key_customers: '',
    technology_stack: '',
    next_action: '',
    priority: 'medium',
    deal_size: '',
    valuation: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Update form data when deal changes
  useEffect(() => {
    if (deal) {
      setFormData({
        company_name: deal.company_name || '',
        description: deal.description || '',
        industry: deal.industry || '',
        location: deal.location || '',
        headquarters: deal.headquarters || '',
        website: deal.website || '',
        linkedin_url: deal.linkedin_url || '',
        crunchbase_url: deal.crunchbase_url || '',
        founder: deal.founder || '',
        founder_email: deal.founder_email || '',
        co_founders: deal.co_founders?.join(', ') || '',
        business_model: deal.business_model || '',
        revenue_model: deal.revenue_model || '',
        target_market: deal.target_market || '',
        company_stage: deal.company_stage || '',
        funding_stage: deal.funding_stage || '',
        founding_year: deal.founding_year?.toString() || '',
        employee_count: deal.employee_count?.toString() || '',
        current_round_size: deal.current_round_size?.toString() || '',
        capital_raised_to_date: deal.capital_raised_to_date?.toString() || '',
        previous_funding_amount: deal.previous_funding_amount?.toString() || '',
        countries_of_operation: deal.countries_of_operation?.join(', ') || '',
        competitors: deal.competitors?.join(', ') || '',
        key_customers: deal.key_customers?.join(', ') || '',
        technology_stack: deal.technology_stack?.join(', ') || '',
        next_action: deal.next_action || '',
        priority: deal.priority || 'medium',
        deal_size: deal.deal_size?.toString() || '',
        valuation: deal.valuation?.toString() || '',
        currency: deal.currency || 'USD'
      });
    }
  }, [deal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deal) return;
    
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
      const updateData = {
        company_name: formData.company_name,
        description: formData.description || null,
        industry: formData.industry || null,
        location: formData.location || null,
        headquarters: formData.headquarters || null,
        website: formData.website || null,
        linkedin_url: formData.linkedin_url || null,
        crunchbase_url: formData.crunchbase_url || null,
        founder: formData.founder || null,
        founder_email: formData.founder_email || null,
        co_founders: formData.co_founders ? formData.co_founders.split(',').map(s => s.trim()).filter(s => s) : null,
        business_model: formData.business_model || null,
        revenue_model: formData.revenue_model || null,
        target_market: formData.target_market || null,
        company_stage: formData.company_stage || null,
        funding_stage: formData.funding_stage || null,
        founding_year: formData.founding_year ? parseInt(formData.founding_year) : null,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : null,
        current_round_size: formData.current_round_size ? parseInt(formData.current_round_size) : null,
        capital_raised_to_date: formData.capital_raised_to_date ? parseInt(formData.capital_raised_to_date) : null,
        previous_funding_amount: formData.previous_funding_amount ? parseInt(formData.previous_funding_amount) : null,
        countries_of_operation: formData.countries_of_operation ? formData.countries_of_operation.split(',').map(s => s.trim()).filter(s => s) : null,
        competitors: formData.competitors ? formData.competitors.split(',').map(s => s.trim()).filter(s => s) : null,
        key_customers: formData.key_customers ? formData.key_customers.split(',').map(s => s.trim()).filter(s => s) : null,
        technology_stack: formData.technology_stack ? formData.technology_stack.split(',').map(s => s.trim()).filter(s => s) : null,
        next_action: formData.next_action || null,
        priority: formData.priority || null,
        deal_size: formData.deal_size ? parseInt(formData.deal_size) : null,
        valuation: formData.valuation ? parseInt(formData.valuation) : null,
        currency: formData.currency || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('deals')
        .update(updateData)
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Deal updated successfully",
      });

      onUpdateComplete();
      onClose();
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: "Error",
        description: "Failed to update deal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!deal) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Edit Deal - {deal.company_name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Company Information</h3>
            
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

            {/* Headquarters & Target Market */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="headquarters">Headquarters</Label>
                <Input
                  id="headquarters"
                  value={formData.headquarters}
                  onChange={(e) => handleInputChange('headquarters', e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
              <div>
                <Label htmlFor="target_market">Target Market</Label>
                <Input
                  id="target_market"
                  value={formData.target_market}
                  onChange={(e) => handleInputChange('target_market', e.target.value)}
                  placeholder="e.g. SMB, Enterprise"
                />
              </div>
            </div>

            {/* Company Stage & Founding Year */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="company_stage">Company Stage</Label>
                <Select value={formData.company_stage} onValueChange={(value) => handleInputChange('company_stage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idea">Idea</SelectItem>
                    <SelectItem value="mvp">MVP</SelectItem>
                    <SelectItem value="early_revenue">Early Revenue</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="founding_year">Founding Year</Label>
                <Input
                  id="founding_year"
                  type="number"
                  value={formData.founding_year}
                  onChange={(e) => handleInputChange('founding_year', e.target.value)}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
              <div>
                <Label htmlFor="employee_count">Employee Count</Label>
                <Input
                  id="employee_count"
                  type="number"
                  value={formData.employee_count}
                  onChange={(e) => handleInputChange('employee_count', e.target.value)}
                  placeholder="50"
                  min="1"
                />
              </div>
            </div>

            {/* Business & Revenue Model */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="business_model">Business Model</Label>
                <Input
                  id="business_model"
                  value={formData.business_model}
                  onChange={(e) => handleInputChange('business_model', e.target.value)}
                  placeholder="e.g. B2B SaaS, Marketplace"
                />
              </div>
              <div>
                <Label htmlFor="revenue_model">Revenue Model</Label>
                <Input
                  id="revenue_model"
                  value={formData.revenue_model}
                  onChange={(e) => handleInputChange('revenue_model', e.target.value)}
                  placeholder="e.g. Subscription, Commission"
                />
              </div>
            </div>

            {/* Multi-value fields */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="countries_of_operation">Countries of Operation</Label>
                <Input
                  id="countries_of_operation"
                  value={formData.countries_of_operation}
                  onChange={(e) => handleInputChange('countries_of_operation', e.target.value)}
                  placeholder="USA, UK, Germany (comma-separated)"
                />
              </div>
              <div>
                <Label htmlFor="competitors">Competitors</Label>
                <Input
                  id="competitors"
                  value={formData.competitors}
                  onChange={(e) => handleInputChange('competitors', e.target.value)}
                  placeholder="Competitor A, Competitor B (comma-separated)"
                />
              </div>
              <div>
                <Label htmlFor="key_customers">Key Customers</Label>
                <Input
                  id="key_customers"
                  value={formData.key_customers}
                  onChange={(e) => handleInputChange('key_customers', e.target.value)}
                  placeholder="Customer A, Customer B (comma-separated)"
                />
              </div>
              <div>
                <Label htmlFor="technology_stack">Technology Stack</Label>
                <Input
                  id="technology_stack"
                  value={formData.technology_stack}
                  onChange={(e) => handleInputChange('technology_stack', e.target.value)}
                  placeholder="React, Node.js, AWS (comma-separated)"
                />
              </div>
            </div>
          </div>

          {/* Team Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Team Information</h3>
            
            {/* Founder & Founder Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="founder">Founder</Label>
                <Input
                  id="founder"
                  value={formData.founder}
                  onChange={(e) => handleInputChange('founder', e.target.value)}
                  placeholder="Enter founder name"
                />
              </div>
              <div>
                <Label htmlFor="founder_email">Founder Email</Label>
                <Input
                  id="founder_email"
                  type="email"
                  value={formData.founder_email}
                  onChange={(e) => handleInputChange('founder_email', e.target.value)}
                  placeholder="founder@company.com"
                />
              </div>
            </div>

            {/* Co-founders */}
            <div>
              <Label htmlFor="co_founders">Co-founders</Label>
              <Input
                id="co_founders"
                value={formData.co_founders}
                onChange={(e) => handleInputChange('co_founders', e.target.value)}
                placeholder="Co-founder A, Co-founder B (comma-separated)"
              />
            </div>
          </div>

          {/* Financial Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Financial Information</h3>
            
            {/* Deal Size & Currency */}
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
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                      <SelectItem value="HKD">HKD</SelectItem>
                    </SelectContent>
                </Select>
              </div>
            </div>

            {/* Valuation & Funding Stage */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valuation">Valuation</Label>
                <NumberInput
                  value={formData.valuation ? parseInt(formData.valuation) : undefined}
                  onChange={(value) => handleInputChange('valuation', value?.toString() || '')}
                  placeholder="10,000,000"
                />
              </div>
              <div>
                <Label htmlFor="funding_stage">Funding Stage</Label>
                <Select value={formData.funding_stage} onValueChange={(value) => handleInputChange('funding_stage', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select funding stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_seed">Pre-seed</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="series_a">Series A</SelectItem>
                    <SelectItem value="series_b">Series B</SelectItem>
                    <SelectItem value="series_c">Series C</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Financial amounts */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="current_round_size">Current Round Size</Label>
                <NumberInput
                  value={formData.current_round_size ? parseInt(formData.current_round_size) : undefined}
                  onChange={(value) => handleInputChange('current_round_size', value?.toString() || '')}
                  placeholder="5,000,000"
                />
              </div>
              <div>
                <Label htmlFor="capital_raised_to_date">Capital Raised to Date</Label>
                <NumberInput
                  value={formData.capital_raised_to_date ? parseInt(formData.capital_raised_to_date) : undefined}
                  onChange={(value) => handleInputChange('capital_raised_to_date', value?.toString() || '')}
                  placeholder="2,000,000"
                />
              </div>
              <div>
                <Label htmlFor="previous_funding_amount">Previous Funding Amount</Label>
                <NumberInput
                  value={formData.previous_funding_amount ? parseInt(formData.previous_funding_amount) : undefined}
                  onChange={(value) => handleInputChange('previous_funding_amount', value?.toString() || '')}
                  placeholder="1,000,000"
                />
              </div>
            </div>
          </div>

          {/* Online Presence Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Online Presence</h3>
            
            <div className="space-y-3">
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
          </div>

          {/* Action Items Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">Action Items</h3>
            
            {/* Priority & Next Action */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="next_action">Next Action</Label>
                <Textarea
                  id="next_action"
                  value={formData.next_action}
                  onChange={(e) => handleInputChange('next_action', e.target.value)}
                  placeholder="What's the next step for this deal?"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? 'Updating...' : 'Update Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};