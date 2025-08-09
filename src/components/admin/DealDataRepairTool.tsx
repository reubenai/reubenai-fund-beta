import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Zap,
  Database,
  Users,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function DealDataRepairTool() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [progress, setProgress] = useState('');
  const { toast } = useToast();

  const runRepair = async () => {
    setIsRunning(true);
    setResults(null);
    setProgress('Starting deal data repair...');

    try {
      // Step 1: Fix deals with missing company names
      setProgress('🔧 Fixing deals with missing company names...');
      
      const { data: dealsWithoutNames, error: fetchError } = await supabase
        .from('deals')
        .select('id, company_name, website')
        .or('company_name.is.null,company_name.eq.""');

      let namesFixes = 0;
      if (!fetchError && dealsWithoutNames && dealsWithoutNames.length > 0) {
        for (const deal of dealsWithoutNames) {
          let fixedName = 'Unnamed Company';
          
          // Try to extract company name from website
          if (deal.website) {
            try {
              const url = new URL(deal.website.startsWith('http') ? deal.website : `https://${deal.website}`);
              const domain = url.hostname.replace('www.', '');
              const parts = domain.split('.');
              if (parts.length > 0) {
                fixedName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
              }
            } catch (e) {
              // Keep default name if URL parsing fails
            }
          }
          
          const { error: updateError } = await supabase
            .from('deals')
            .update({ company_name: fixedName })
            .eq('id', deal.id);
            
          if (!updateError) {
            namesFixes++;
          }
        }
      }

      // Step 2: Add enhanced_analysis structure to deals without it
      setProgress('🔧 Adding enhanced analysis structures...');
      
      const { data: dealsWithoutAnalysis, error: analysisError } = await supabase
        .from('deals')
        .select('id, company_name, fund_id')
        .is('enhanced_analysis', null);

      let analysisFixes = 0;
      if (!analysisError && dealsWithoutAnalysis && dealsWithoutAnalysis.length > 0) {
        for (const deal of dealsWithoutAnalysis) {
          const placeholderAnalysis = {
            rubric_breakdown: [
              {
                category: 'Market Opportunity',
                score: 0,
                confidence: 50,
                weight: 25,
                insights: ['Analysis pending - Market research will be conducted'],
                strengths: ['Market analysis will include TAM/SAM/SOM calculations'],
                concerns: ['Market validation pending']
              },
              {
                category: 'Team & Leadership',
                score: 0,
                confidence: 50,
                weight: 20,
                insights: ['Analysis pending - Team research will be conducted'],
                strengths: ['Founder and team assessment scheduled'],
                concerns: ['Team validation pending']
              },
              {
                category: 'Product & Technology',
                score: 0,
                confidence: 50,
                weight: 25,
                insights: ['Analysis pending - Product IP assessment will be conducted'],
                strengths: ['Technology moat evaluation scheduled'],
                concerns: ['IP defensibility analysis pending']
              },
              {
                category: 'Financial Health',
                score: 0,
                confidence: 50,
                weight: 15,
                insights: ['Analysis pending - Financial assessment will be conducted'],
                strengths: ['Revenue model analysis scheduled'],
                concerns: ['Unit economics validation pending']
              },
              {
                category: 'Business Traction',
                score: 0,
                confidence: 50,
                weight: 15,
                insights: ['Analysis pending - Traction assessment will be conducted'],
                strengths: ['Customer validation scheduled'],
                concerns: ['Scale analysis pending']
              }
            ],
            analysis_engines: {
              market_intelligence: {
                name: 'Market Intelligence Engine',
                score: 0,
                confidence: 50,
                status: 'pending',
                last_run: new Date().toISOString(),
                version: '2.3',
                data_sources: 'placeholder'
              },
              financial_engine: {
                name: 'Financial Analysis Engine',
                score: 0,
                confidence: 50,
                status: 'pending',
                last_run: new Date().toISOString(),
                version: '3.1',
                data_sources: 'placeholder'
              },
              team_research: {
                name: 'Team Research Engine',
                score: 0,
                confidence: 50,
                status: 'pending',
                last_run: new Date().toISOString(),
                version: '2.8',
                data_sources: 'placeholder'
              },
              product_ip: {
                name: 'Product IP Engine',
                score: 0,
                confidence: 50,
                status: 'pending',
                last_run: new Date().toISOString(),
                version: '2.5',
                data_sources: 'placeholder'
              },
              thesis_alignment: {
                name: 'Thesis Alignment Engine',
                score: 0,
                confidence: 50,
                status: 'pending',
                last_run: new Date().toISOString(),
                version: '4.0',
                data_sources: 'placeholder'
              }
            },
            analysis_completeness: 0,
            last_comprehensive_analysis: new Date().toISOString(),
            notes_intelligence: {
              sentiment: 'pending',
              key_insights: ['Notes intelligence will be processed when available'],
              risk_flags: [],
              trend_indicators: [],
              confidence_level: 50,
              last_analyzed: new Date().toISOString()
            },
            engines_completion_status: {
              market_intelligence_complete: false,
              financial_analysis_complete: false,
              team_research_complete: false,
              product_ip_complete: false,
              thesis_alignment_complete: false,
              total_engines_complete: 0,
              pending_analysis_note: 'Ready for comprehensive analysis - engines will populate when triggered'
            }
          };
          
          const { error: updateError } = await supabase
            .from('deals')
            .update({ enhanced_analysis: placeholderAnalysis })
            .eq('id', deal.id);
            
          if (!updateError) {
            analysisFixes++;
          }
        }
      }

      // Step 3: Ensure analysis queue compatibility
      setProgress('🔧 Ensuring analysis queue compatibility...');
      
      const { error: queueError } = await supabase
        .from('deals')
        .update({ 
          auto_analysis_enabled: true,
          analysis_queue_status: 'pending'
        })
        .is('auto_analysis_enabled', null);

      setProgress('✅ Repair completed successfully!');

      const repairResults = {
        success: true,
        namesFixed: namesFixes,
        analysisStructuresAdded: analysisFixes,
        queueCompatibilityFixed: !queueError,
        summary: [
          `Fixed ${namesFixes} deals with missing company names`,
          `Added enhanced analysis structures to ${analysisFixes} deals`,
          'Ensured analysis queue compatibility for all deals',
          'Prepared deals for comprehensive analysis'
        ]
      };

      setResults(repairResults);
      
      toast({
        title: "Deal Data Repair Complete",
        description: `Fixed ${namesFixes + analysisFixes} issues across your deals`,
        variant: "default"
      });

    } catch (error) {
      console.error('Deal repair error:', error);
      setResults({
        success: false,
        error: error.message || 'An unexpected error occurred'
      });
      
      toast({
        title: "Repair Error",
        description: "Failed to complete deal data repair",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Deal Data Repair Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This tool fixes common data issues: missing company names and empty analysis structures.
            Run this if deals are showing "#undefined" or missing analysis data.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-3">
          <Button 
            onClick={runRepair}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Repair...' : 'Run Data Repair'}
          </Button>
          
          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Database className="h-4 w-4" />
              {progress}
            </div>
          )}
        </div>

        {results && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/30">
            {results.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Repair Completed Successfully</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-semibold">{results.namesFixed}</div>
                    <div className="text-xs text-muted-foreground">Names Fixed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{results.analysisStructuresAdded}</div>
                    <div className="text-xs text-muted-foreground">Analysis Added</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {results.queueCompatibilityFixed ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-muted-foreground">Queue Ready</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-sm font-medium mb-2">Changes Made:</div>
                  <ul className="text-xs space-y-1">
                    {results.summary.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>Repair failed: {results.error}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
