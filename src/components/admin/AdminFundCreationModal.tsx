import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Organization {
  id: string;
  name: string;
  domain?: string;
}

interface Fund {
  id: string;
  name: string;
  organization_id: string;
  fund_type: 'vc' | 'pe';
  target_size: number | null;
  currency: string;
  is_active: boolean;
  created_at: string;
}

interface AdminFundCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizations: Organization[];
  onFundCreated: (fund: Fund) => void;
}

export default function AdminFundCreationModal({
  isOpen,
  onClose,
  organizations,
  onFundCreated
}: AdminFundCreationModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organization_id: '',
    fund_type: 'venture_capital' as 'venture_capital' | 'private_equity',
    target_size: '',
    currency: 'USD',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.organization_id) {
      toast.error('Fund name and organization are required');
      return;
    }

    setLoading(true);
    
    try {
      const fundData: any = {
        name: formData.name,
        organization_id: formData.organization_id,
        fund_type: formData.fund_type,
        currency: formData.currency,
        created_by: user!.id,
        is_active: true,
      };

      if (formData.target_size) {
        fundData.target_size = parseInt(formData.target_size) * 1000000; // Convert millions to actual amount
      }

      if (formData.description) {
        fundData.description = formData.description;
      }

      const { data, error } = await supabase
        .from('funds')
        .insert([fundData])
        .select()
        .single();

      if (error) throw error;

      // Transform the created fund type and add to list
      const transformedFund: Fund = {
        ...data,
        fund_type: data.fund_type === 'venture_capital' ? 'vc' : 'pe'
      };

      onFundCreated(transformedFund);
      
      // Reset form
      setFormData({
        name: '',
        organization_id: '',
        fund_type: 'venture_capital',
        target_size: '',
        currency: 'USD',
        description: ''
      });
      
      toast.success('Fund created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating fund:', error);
      toast.error('Failed to create fund');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      organization_id: '',
      fund_type: 'venture_capital',
      target_size: '',
      currency: 'USD',
      description: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Fund</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fund-name">Fund Name *</Label>
            <Input
              id="fund-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter fund name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization *</Label>
            <Select
              value={formData.organization_id}
              onValueChange={(value) => setFormData({ ...formData, organization_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fund-type">Fund Type</Label>
            <Select
              value={formData.fund_type}
              onValueChange={(value: 'venture_capital' | 'private_equity') => 
                setFormData({ ...formData, fund_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venture_capital">Venture Capital</SelectItem>
                <SelectItem value="private_equity">Private Equity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target-size">Target Size (millions)</Label>
              <Input
                id="target-size"
                type="number"
                value={formData.target_size}
                onChange={(e) => setFormData({ ...formData, target_size: e.target.value })}
                placeholder="e.g., 100"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the fund"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Fund'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}