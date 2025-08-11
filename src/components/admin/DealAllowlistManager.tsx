import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, X } from 'lucide-react';

interface Deal {
  id: string;
  company_name: string;
  industry: string;
  fund_id: string;
  funds: {
    name: string;
    fund_type: 'venture_capital' | 'private_equity';
  };
}

export function DealAllowlistManager() {
  const [searchTerm, setSearchTerm] = useState('');
  const [availableDeals, setAvailableDeals] = useState<Deal[]>([]);
  const [selectedDeals, setSelectedDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    searchDeals();
  }, [searchTerm]);

  const searchDeals = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('deals')
        .select(`
          id,
          company_name,
          industry,
          fund_id,
          funds!fund_id(name, fund_type)
        `)
        .limit(20);

      if (searchTerm) {
        query = query.ilike('company_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvailableDeals(data || []);
    } catch (error) {
      console.error('Error searching deals:', error);
      toast({
        title: "Search Error",
        description: "Could not search deals",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToSelection = (deal: Deal) => {
    if (selectedDeals.length >= 2) {
      toast({
        title: "Selection Limit",
        description: "Maximum 2 deals allowed for safe mode testing",
        variant: "destructive"
      });
      return;
    }

    if (!selectedDeals.find(d => d.id === deal.id)) {
      setSelectedDeals([...selectedDeals, deal]);
    }
  };

  const removeFromSelection = (dealId: string) => {
    setSelectedDeals(selectedDeals.filter(d => d.id !== dealId));
  };

  const updateAllowlist = async () => {
    if (selectedDeals.length !== 2) {
      toast({
        title: "Invalid Selection",
        description: "Please select exactly 2 deals for the test",
        variant: "destructive"
      });
      return;
    }

    try {
      // Clear existing allowlist
      await supabase
        .from('analysis_allowlist')
        .delete()
        .neq('deal_id', '00000000-0000-0000-0000-000000000000');

      // Add selected deals
      const { error } = await supabase
        .from('analysis_allowlist')
        .insert(selectedDeals.map((deal, index) => ({
          deal_id: deal.id,
          test_phase: 'safe_mode_test',
          notes: `Test Deal ${String.fromCharCode(65 + index)} - ${deal.company_name} (${deal.funds.fund_type})`
        })));

      if (error) throw error;

      // Queue the deals for analysis
      for (const deal of selectedDeals) {
        await supabase.rpc('queue_deal_analysis', {
          deal_id_param: deal.id,
          trigger_reason_param: 'safe_mode_test',
          priority_param: 'high',
          delay_minutes: 0
        });
      }

      toast({
        title: "Allowlist Updated",
        description: `Added ${selectedDeals.length} deals to allowlist and queued for analysis`
      });

      setSelectedDeals([]);
    } catch (error) {
      console.error('Error updating allowlist:', error);
      toast({
        title: "Update Failed",
        description: "Could not update allowlist",
        variant: "destructive"
      });
    }
  };

  // Get one VC and one PE deal if possible
  const getRecommendedSelection = () => {
    const vcDeals = availableDeals.filter(d => d.funds.fund_type === 'venture_capital');
    const peDeals = availableDeals.filter(d => d.funds.fund_type === 'private_equity');
    
    const selected = [];
    if (vcDeals.length > 0) selected.push(vcDeals[0]);
    if (peDeals.length > 0) selected.push(peDeals[0]);
    
    // If we don't have both types, just take the first two
    if (selected.length < 2 && availableDeals.length >= 2) {
      selected.push(...availableDeals.filter(d => !selected.includes(d)).slice(0, 2 - selected.length));
    }
    
    setSelectedDeals(selected);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Allowlist Manager</CardTitle>
        <CardDescription>
          Select exactly 2 deals for controlled safe mode testing (preferably 1 VC + 1 PE)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search deals by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={getRecommendedSelection}
            disabled={availableDeals.length < 2}
          >
            Auto-Select (1 VC + 1 PE)
          </Button>
        </div>

        {/* Selected Deals */}
        {selectedDeals.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected for Testing ({selectedDeals.length}/2)</div>
            <div className="grid gap-2">
              {selectedDeals.map((deal, index) => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded">
                  <div>
                    <div className="font-medium">{deal.company_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {deal.industry} • {deal.funds.name} ({deal.funds.fund_type})
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Deal {String.fromCharCode(65 + index)}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromSelection(deal.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <Button
              onClick={updateAllowlist}
              disabled={selectedDeals.length !== 2}
              className="w-full"
            >
              Update Allowlist & Queue Analysis
            </Button>
          </div>
        )}

        {/* Available Deals */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Available Deals</div>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Searching...</div>
          ) : (
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {availableDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium text-sm">{deal.company_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {deal.industry} • {deal.funds.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={deal.funds.fund_type === 'venture_capital' ? 'default' : 'secondary'}>
                      {deal.funds.fund_type === 'venture_capital' ? 'VC' : 'PE'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToSelection(deal)}
                      disabled={selectedDeals.some(d => d.id === deal.id) || selectedDeals.length >= 2}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {availableDeals.length === 0 && !isLoading && (
                <div className="text-sm text-muted-foreground">No deals found</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}