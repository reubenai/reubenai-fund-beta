import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDealDataIntegration } from '@/hooks/useDealDataIntegration';
import { toTemplateFundType, type AnyFundType } from '@/utils/fundTypeConversion';
import { 
  Database, 
  Play, 
  Square, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  RotateCcw
} from 'lucide-react';

interface Deal {
  id: string;
  company_name: string;
  fund_id: string;
  organization_id: string;
  fund_name: string;
  fund_type: AnyFundType;
  created_at: string;
  datapoints_status?: 'complete' | 'partial' | 'missing';
  last_integration?: string;
  completeness_score?: number;
}

interface ProcessingResult {
  dealId: string;
  companyName: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  completenessScore?: number;
  dataPointsCreated?: number;
  processedSources?: string[];
}

export function DealDataProcessingTool() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [fundFilter, setFundFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [processingResults, setProcessingResults] = useState<Map<string, ProcessingResult>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { integrateDealData, isIntegrating, getIntegrationStatus } = useDealDataIntegration();

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    setLoading(true);
    try {
      // Fetch deals with fund information
      const { data: dealsData, error } = await supabase
        .from('deals')
        .select(`
          id,
          company_name,
          fund_id,
          organization_id,
          created_at,
          funds!inner(
            name,
            fund_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data and check datapoints status
      const transformedDeals: Deal[] = await Promise.all(
        (dealsData || []).map(async (deal) => {
          const fund = Array.isArray(deal.funds) ? deal.funds[0] : deal.funds;
          const fundType = fund.fund_type as AnyFundType;
          
          // Check datapoints status
          const status = await checkDatapointsStatus(deal.id, fundType);
          
          return {
            id: deal.id,
            company_name: deal.company_name,
            fund_id: deal.fund_id,
            organization_id: deal.organization_id,
            fund_name: fund.name,
            fund_type: fundType,
            created_at: deal.created_at,
            ...status
          };
        })
      );

      setDeals(transformedDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast.error('Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  const checkDatapointsStatus = async (dealId: string, fundType: AnyFundType) => {
    try {
      const templateFundType = toTemplateFundType(fundType);
      const tableName = templateFundType === 'vc' ? 'deal_analysis_datapoints_vc' : 'deal_analysis_datapoints_pe';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('data_completeness_score, source_engines, updated_at')
        .eq('deal_id', dealId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking status:', error);
        return { datapoints_status: 'missing' as const };
      }

      if (!data) {
        return { datapoints_status: 'missing' as const };
      }

      const completenessScore = data.data_completeness_score || 0;
      const status = completenessScore >= 80 ? 'complete' : completenessScore > 0 ? 'partial' : 'missing';
      
      return {
        datapoints_status: status as 'complete' | 'partial' | 'missing',
        completeness_score: completenessScore,
        last_integration: data.updated_at
      };
    } catch (error) {
      console.error('Error checking datapoints status:', error);
      return { datapoints_status: 'missing' as const };
    }
  };

  const processSelectedDeals = async () => {
    if (selectedDeals.size === 0) {
      toast.error('Please select at least one deal to process');
      return;
    }

    setIsProcessing(true);
    const results = new Map<string, ProcessingResult>();
    
    // Initialize processing results
    selectedDeals.forEach(dealId => {
      const deal = deals.find(d => d.id === dealId)!;
      results.set(dealId, {
        dealId,
        companyName: deal.company_name,
        status: 'processing'
      });
    });
    setProcessingResults(new Map(results));

    try {
      // Process deals in batches of 3 to avoid overwhelming the system
      const dealsList = Array.from(selectedDeals);
      const batchSize = 3;
      
      for (let i = 0; i < dealsList.length; i += batchSize) {
        const batch = dealsList.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (dealId) => {
          const deal = deals.find(d => d.id === dealId)!;
          
          try {
            const result = await integrateDealData(
              dealId,
              deal.fund_id,
              deal.organization_id,
              deal.fund_type,
              { 
                triggerReason: 'manual_refresh',
                showToast: false 
              }
            );

            const updatedResult: ProcessingResult = {
              dealId,
              companyName: deal.company_name,
              status: result.success ? 'completed' : 'failed',
              result,
              error: result.error,
              completenessScore: result.completenessScore,
              dataPointsCreated: result.dataPointsCreated,
              processedSources: result.processedSources
            };

            results.set(dealId, updatedResult);
            setProcessingResults(new Map(results));
            
            return updatedResult;
          } catch (error) {
            const errorResult: ProcessingResult = {
              dealId,
              companyName: deal.company_name,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            };

            results.set(dealId, errorResult);
            setProcessingResults(new Map(results));
            
            return errorResult;
          }
        });

        await Promise.all(batchPromises);
      }

      // Show summary
      const completed = Array.from(results.values()).filter(r => r.status === 'completed').length;
      const failed = Array.from(results.values()).filter(r => r.status === 'failed').length;
      
      toast.success(`Processing complete: ${completed} succeeded, ${failed} failed`);
      
      // Refresh deals data to show updated status
      await fetchDeals();
      
    } catch (error) {
      console.error('Batch processing error:', error);
      toast.error('Failed to process deals');
    } finally {
      setIsProcessing(false);
    }
  };

  const processSingleDeal = async (deal: Deal) => {
    const results = new Map(processingResults);
    results.set(deal.id, {
      dealId: deal.id,
      companyName: deal.company_name,
      status: 'processing'
    });
    setProcessingResults(results);

    try {
      const result = await integrateDealData(
        deal.id,
        deal.fund_id,
        deal.organization_id,
        deal.fund_type,
        { 
          triggerReason: 'manual_refresh',
          showToast: true 
        }
      );

      const updatedResult: ProcessingResult = {
        dealId: deal.id,
        companyName: deal.company_name,
        status: result.success ? 'completed' : 'failed',
        result,
        error: result.error,
        completenessScore: result.completenessScore,
        dataPointsCreated: result.dataPointsCreated,
        processedSources: result.processedSources
      };

      results.set(deal.id, updatedResult);
      setProcessingResults(results);
      
      // Refresh deals data
      await fetchDeals();
      
    } catch (error) {
      const errorResult: ProcessingResult = {
        dealId: deal.id,
        companyName: deal.company_name,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      results.set(deal.id, errorResult);
      setProcessingResults(results);
    }
  };

  const toggleDealSelection = (dealId: string) => {
    const newSelected = new Set(selectedDeals);
    if (newSelected.has(dealId)) {
      newSelected.delete(dealId);
    } else {
      newSelected.add(dealId);
    }
    setSelectedDeals(newSelected);
  };

  const selectAllVisible = () => {
    const visibleDeals = filteredDeals.map(d => d.id);
    setSelectedDeals(new Set(visibleDeals));
  };

  const clearSelection = () => {
    setSelectedDeals(new Set());
  };

  const clearResults = () => {
    setProcessingResults(new Map());
  };

  // Filter deals based on search and filters
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFund = fundFilter === 'all' || deal.fund_name === fundFilter;
    const matchesStatus = statusFilter === 'all' || deal.datapoints_status === statusFilter;
    
    return matchesSearch && matchesFund && matchesStatus;
  });

  // Get unique fund names for filter
  const fundNames = Array.from(new Set(deals.map(d => d.fund_name)));

  const getStatusBadge = (status?: 'complete' | 'partial' | 'missing') => {
    switch (status) {
      case 'complete':
        return <Badge variant="default" className="bg-success text-success-foreground">Complete</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial</Badge>;
      case 'missing':
        return <Badge variant="destructive">Missing</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getProcessingIcon = (status: 'processing' | 'completed' | 'failed') => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Deal Data Processing Tool
        </CardTitle>
        <CardDescription>
          Directly integrate enrichment data into datapoints tables, bypassing the analysis queue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={fundFilter}
            onChange={(e) => setFundFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md"
          >
            <option value="all">All Funds</option>
            {fundNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md"
          >
            <option value="all">All Status</option>
            <option value="complete">Complete</option>
            <option value="partial">Partial</option>
            <option value="missing">Missing</option>
          </select>
          
          <Button
            onClick={fetchDeals}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Batch Actions */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            onClick={selectAllVisible}
            variant="outline"
            size="sm"
          >
            Select All ({filteredDeals.length})
          </Button>
          <Button
            onClick={clearSelection}
            variant="outline"
            size="sm"
            disabled={selectedDeals.size === 0}
          >
            Clear Selection
          </Button>
          <Button
            onClick={processSelectedDeals}
            disabled={selectedDeals.size === 0 || isProcessing}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Processing {selectedDeals.size}...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Process Selected ({selectedDeals.size})
              </>
            )}
          </Button>
          {processingResults.size > 0 && (
            <Button
              onClick={clearResults}
              variant="outline"
              size="sm"
            >
              Clear Results
            </Button>
          )}
        </div>

        {/* Processing Results Summary */}
        {processingResults.size > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-muted-foreground">
                  {Array.from(processingResults.values()).filter(r => r.status === 'processing').length}
                </div>
                <p className="text-sm text-muted-foreground">Processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-success">
                  {Array.from(processingResults.values()).filter(r => r.status === 'completed').length}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-destructive">
                  {Array.from(processingResults.values()).filter(r => r.status === 'failed').length}
                </div>
                <p className="text-sm text-muted-foreground">Failed</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Deals Table */}
        <div className="border rounded-lg">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium">
                    <Checkbox
                      checked={selectedDeals.size === filteredDeals.length && filteredDeals.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllVisible();
                        } else {
                          clearSelection();
                        }
                      }}
                    />
                  </th>
                  <th className="text-left p-3 font-medium">Company</th>
                  <th className="text-left p-3 font-medium">Fund</th>
                  <th className="text-left p-3 font-medium">Type</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Score</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => {
                  const result = processingResults.get(deal.id);
                  return (
                    <tr key={deal.id} className="border-t hover:bg-muted/25">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedDeals.has(deal.id)}
                          onCheckedChange={() => toggleDealSelection(deal.id)}
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{deal.company_name}</div>
                          {deal.last_integration && (
                            <div className="text-xs text-muted-foreground">
                              Last: {new Date(deal.last_integration).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">{deal.fund_name}</td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {toTemplateFundType(deal.fund_type).toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {result ? (
                          <div className="flex items-center gap-2">
                            {getProcessingIcon(result.status)}
                            <span className="capitalize">{result.status}</span>
                          </div>
                        ) : (
                          getStatusBadge(deal.datapoints_status)
                        )}
                      </td>
                      <td className="p-3">
                        {result?.completenessScore !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Progress value={result.completenessScore} className="w-16" />
                            <span className="text-xs">{result.completenessScore}%</span>
                          </div>
                        ) : deal.completeness_score !== undefined ? (
                          <div className="flex items-center gap-2">
                            <Progress value={deal.completeness_score} className="w-16" />
                            <span className="text-xs">{deal.completeness_score}%</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processSingleDeal(deal)}
                          disabled={isIntegrating || result?.status === 'processing'}
                        >
                          {result?.status === 'processing' ? (
                            <Clock className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Details */}
        {processingResults.size > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Processing Results</h4>
            {Array.from(processingResults.values()).map((result) => (
              <div key={result.dealId} className="flex items-center justify-between p-3 bg-muted/25 rounded-lg">
                <div className="flex items-center gap-3">
                  {getProcessingIcon(result.status)}
                  <div>
                    <div className="font-medium">{result.companyName}</div>
                    {result.error && (
                      <div className="text-xs text-destructive">{result.error}</div>
                    )}
                    {result.processedSources && (
                      <div className="text-xs text-muted-foreground">
                        Sources: {result.processedSources.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {result.dataPointsCreated !== undefined && (
                    <div className="text-sm">{result.dataPointsCreated} datapoints</div>
                  )}
                  {result.completenessScore !== undefined && (
                    <div className="text-xs text-muted-foreground">{result.completenessScore}% complete</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading deals...</p>
          </div>
        )}

        {!loading && filteredDeals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No deals found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}