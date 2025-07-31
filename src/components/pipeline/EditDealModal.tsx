import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  deal_size?: number;
  valuation?: number;
  currency?: string;
  founder?: string;
  website?: string;
  linkedin_url?: string;
  crunchbase_url?: string;
  description?: string;
  business_model?: string;
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
    website: '',
    linkedin_url: '',
    crunchbase_url: '',
    founder: '',
    business_model: '',
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
        website: deal.website || '',
        linkedin_url: deal.linkedin_url || '',
        crunchbase_url: deal.crunchbase_url || '',
        founder: deal.founder || '',
        business_model: deal.business_model || '',
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
        website: formData.website || null,
        linkedin_url: formData.linkedin_url || null,
        crunchbase_url: formData.crunchbase_url || null,
        founder: formData.founder || null,
        business_model: formData.business_model || null,
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Edit Deal - {deal.company_name}
          </DialogTitle>
        </DialogHeader>

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

          {/* Founder */}
          <div>
            <Label htmlFor="founder">Founder</Label>
            <Input
              id="founder"
              value={formData.founder}
              onChange={(e) => handleInputChange('founder', e.target.value)}
              placeholder="Enter founder name"
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

          {/* URLs */}
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

          {/* Business Model & Next Action */}
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
          </div>

          {/* Next Action */}
          <div>
            <Label htmlFor="next_action">Next Action</Label>
            <Textarea
              id="next_action"
              value={formData.next_action}
              onChange={(e) => handleInputChange('next_action', e.target.value)}
              placeholder="What's the next step for this deal?"
              rows={2}
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