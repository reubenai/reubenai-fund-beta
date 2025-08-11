import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  DollarSign,
  Calendar,
  MoreHorizontal,
  ArrowUpRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  company_name: string;
  industry?: string;
  deal_size?: number;
  valuation?: number;
  overall_score?: number;
  rag_status?: string;
  status: string;
  created_at: string;
  updated_at: string;
  currency?: string;
  priority?: string;
  next_action?: string;
  analysis_queue_status?: string;
}

interface RoleBasedDealPipelineProps {
  fundId: string;
  onDealSelect: (dealId: string) => void;
  onCreateMemo: (dealId: string) => void;
}

export const RoleBasedDealPipeline: React.FC<RoleBasedDealPipelineProps> = ({
  fundId,
  onDealSelect,
  onCreateMemo
}) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ragFilter, setRAGFilter] = useState<string>('all');
  
  const { role, isSuperAdmin } = useUserRole();
  const { canCreateICMemos, canReviewMemos, canVoteOnDeals } = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    if (fundId) {
      fetchDeals();
    }
  }, [fundId, role]);

  useEffect(() => {
    applyFilters();
  }, [deals, searchTerm, statusFilter, ragFilter]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      
      // Get role-relevant deal statuses
      const relevantStatuses = getRoleRelevantStatuses();
      
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('fund_id', fundId)
        .in('status', relevantStatuses as any)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
      
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: "Error",
        description: "Failed to load deal pipeline",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleRelevantStatuses = () => {
    // Super admins and admins see everything
    if (isSuperAdmin || role === 'admin') {
      return ['investment_committee', 'due_diligence', 'approved', 'screening'] as const;
    }
    
    // Fund managers see IC-ready and beyond
    if (role === 'fund_manager') {
      return ['investment_committee', 'due_diligence', 'approved'] as const;
    }
    
    // Analysts see deals they need to prepare
    if (role === 'analyst') {
      return ['screening', 'investment_committee'] as const;
    }
    
    // Viewers see deals in IC phase
    return ['investment_committee', 'approved'] as const;
  };

  const applyFilters = () => {
    let filtered = deals;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(deal => deal.status === statusFilter);
    }

    // RAG filter
    if (ragFilter !== 'all') {
      filtered = filtered.filter(deal => deal.rag_status === ragFilter);
    }

    setFilteredDeals(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'screening': { label: 'Screening', variant: 'secondary' as const, color: 'bg-blue-50 text-blue-700' },
      'investment_committee': { label: 'IC Ready', variant: 'default' as const, color: 'bg-purple-50 text-purple-700' },
      'due_diligence': { label: 'Due Diligence', variant: 'default' as const, color: 'bg-orange-50 text-orange-700' },
      'approved': { label: 'Approved', variant: 'default' as const, color: 'bg-green-50 text-green-700' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const, color: 'bg-gray-50 text-gray-700' };
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getRAGBadge = (ragStatus?: string) => {
    if (!ragStatus) return null;
    
    const ragConfig = {
      'exciting': { label: '🚀 Exciting', color: 'bg-green-50 text-green-700 border-green-200' },
      'promising': { label: '📈 Promising', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      'needs_development': { label: '🔧 Needs Development', color: 'bg-amber-50 text-amber-700 border-amber-200' }
    };
    
    const config = ragConfig[ragStatus as keyof typeof ragConfig];
    if (!config) return null;
    
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getRoleActionButtons = (deal: Deal) => {
    const buttons = [];

    // Create IC Memo (Analysts and Fund Managers)
    if (canCreateICMemos && deal.status === 'investment_committee') {
      buttons.push(
        <Button
          key="memo"
          variant="outline"
          size="sm"
          onClick={() => onCreateMemo(deal.id)}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Create Memo
        </Button>
      );
    }

    return buttons;
  };

  const formatCurrency = (amount?: number, currency = 'USD') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-amber-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-300';
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Deal Pipeline ({filteredDeals.length})
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {role.replace('_', ' ').toUpperCase()} VIEW
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="investment_committee">IC Ready</SelectItem>
                <SelectItem value="due_diligence">Due Diligence</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ragFilter} onValueChange={setRAGFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="RAG Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All RAG</SelectItem>
                <SelectItem value="exciting">Exciting</SelectItem>
                <SelectItem value="promising">Promising</SelectItem>
                <SelectItem value="needs_development">Needs Development</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchDeals}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deal List */}
      <div className="space-y-3">
        {filteredDeals.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No deals found matching your current filters and role permissions.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDeals.map((deal) => (
            <Card key={deal.id} className={`border-l-4 ${getPriorityColor(deal.priority)} hover:shadow-md transition-shadow`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">{deal.company_name}</h3>
                      {getStatusBadge(deal.status)}
                      {getRAGBadge(deal.rag_status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {deal.industry && (
                        <span>Industry: {deal.industry}</span>
                      )}
                      {deal.deal_size && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span>{formatCurrency(deal.deal_size, deal.currency)}</span>
                        </div>
                      )}
                      {deal.overall_score && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>Score: {deal.overall_score}/100</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Updated: {new Date(deal.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {deal.next_action && (
                      <div className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        Next: {deal.next_action}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {getRoleActionButtons(deal)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};