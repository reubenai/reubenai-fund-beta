import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Deal } from '@/hooks/usePipelineDeals';
import { supabase } from '@/integrations/supabase/client';

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

      await onAddDeal(dealData);
      
      // Reset form
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
      
      onClose();
    } catch (error) {
      console.error('Error adding deal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Add New Deal
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
              {loading ? 'Adding...' : 'Add Deal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};