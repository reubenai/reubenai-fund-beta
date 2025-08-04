import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Brain, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Eye,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedDocumentErrorHandler, DocumentErrors } from './EnhancedDocumentErrorHandler';

interface DocumentAnalysisIntegrationProps {
  dealId: string;
  documents: any[];
  onAnalysisTrigger?: () => void;
}

export const DocumentAnalysisIntegration: React.FC<DocumentAnalysisIntegrationProps> = ({
  dealId,
  documents,
  onAnalysisTrigger
}) => {
  const { toast } = useToast();
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'running' | 'complete' | 'error'>('idle');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [analysisError, setAnalysisError] = useState<any | null>(null);

  useEffect(() => {
    checkAnalysisStatus();
  }, [dealId]);

  const checkAnalysisStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('deal_analyses')
        .select('*')
        .eq('deal_id', dealId)
        .order('analyzed_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setAnalysisResults(data[0]);
        setLastAnalysisTime(new Date(data[0].analyzed_at));
        setAnalysisStatus('complete');
      }
    } catch (error) {
      console.error('Error checking analysis status:', error);
    }
  };

  const triggerDocumentAnalysis = async () => {
    if (documents.length === 0) {
      toast({
        title: "No Documents",
        description: "Upload documents first to enable AI analysis.",
        variant: "destructive",
      });
      return;
    }

    setAnalysisStatus('running');
    try {
      const { data, error } = await supabase.functions.invoke('reuben-orchestrator', {
        body: { 
          dealId,
          analysisType: 'comprehensive',
          includeDocuments: true,
          documentIds: documents.map(doc => doc.id)
        }
      });

      if (error) throw error;

      toast({
        title: "Analysis Started",
        description: "Reuben AI is now analyzing your documents and generating insights.",
      });

      onAnalysisTrigger?.();
      
      // Poll for completion with longer timeout for comprehensive analysis
      setTimeout(() => {
        checkAnalysisStatus();
      }, 10000);

    } catch (error) {
      console.error('Failed to trigger analysis:', error);
      setAnalysisStatus('error');
      
      // Create specific error for analysis failure
      if (error instanceof Error) {
        if (error.message.includes('no documents')) {
          setAnalysisError(DocumentErrors.integrationError(
            'No documents found for analysis. Please ensure documents are properly uploaded and try again.'
          ));
        } else if (error.message.includes('permission')) {
          setAnalysisError(DocumentErrors.permissionDenied(
            'You do not have permission to trigger AI analysis for this deal.',
            'ANALYSIS_PERMISSION_DENIED'
          ));
        } else {
          setAnalysisError(DocumentErrors.analysisFailed(
            error.message,
            'ANALYSIS_TRIGGER_FAILED'
          ));
        }
      } else {
        setAnalysisError(DocumentErrors.analysisFailed(
          'Unknown error occurred while starting analysis',
          'UNKNOWN_ANALYSIS_ERROR'
        ));
      }
    }
  };

  const getDocumentTypeIcon = (category: string) => {
    switch (category) {
      case 'financial_statement': return BarChart3;
      case 'pitch_deck': return FileText;
      case 'legal_document': return FileText;
      case 'business_plan': return FileText;
      default: return FileText;
    }
  };

  const getAnalysisStatusBadge = () => {
    switch (analysisStatus) {
      case 'running':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Analyzing</Badge>;
      case 'complete':
        return <Badge variant="default" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Complete</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Document Analysis Integration
          </div>
          {getAnalysisStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Summary */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Uploaded Documents ({documents.length})</h4>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => {
                const IconComponent = getDocumentTypeIcon(doc.document_category);
                return (
                  <div key={doc.id} className="flex items-center gap-3 p-2 bg-muted rounded">
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{doc.name}</span>
                      <div className="text-xs text-muted-foreground">
                        {doc.document_category.replace('_', ' ')} • {doc.document_type || 'No type specified'}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      ✓ Ready
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Analysis Engines */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">AI Analysis Engines</h4>
          <div className="grid grid-cols-1 gap-2">
            {[
              { name: 'Financial Engine', description: 'Analyzes financial documents and projections', icon: BarChart3 },
              { name: 'Product IP Engine', description: 'Evaluates product and IP documentation', icon: Zap },
              { name: 'Team Research Engine', description: 'Researches team backgrounds and credentials', icon: Brain },
              { name: 'Market Intelligence', description: 'Analyzes market research and competitive data', icon: Eye },
              { name: 'Thesis Alignment', description: 'Aligns deal with investment strategy', icon: CheckCircle }
            ].map((engine) => {
              const IconComponent = engine.icon;
              return (
                <div key={engine.name} className="flex items-center gap-3 p-2 bg-background border rounded">
                  <IconComponent className="w-4 h-4 text-primary" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{engine.name}</span>
                    <div className="text-xs text-muted-foreground">{engine.description}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {documents.length > 0 ? 'Ready' : 'Waiting'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Analysis Results Preview */}
        {analysisResults && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Latest Analysis Results</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded">
                <div className="text-lg font-bold">{analysisResults.financial_score || 'N/A'}/100</div>
                <div className="text-xs text-muted-foreground">Financial Score</div>
              </div>
              <div className="text-center p-3 bg-muted rounded">
                <div className="text-lg font-bold">{analysisResults.product_score || 'N/A'}/100</div>
                <div className="text-xs text-muted-foreground">Product Score</div>
              </div>
              <div className="text-center p-3 bg-muted rounded">
                <div className="text-lg font-bold">{analysisResults.leadership_score || 'N/A'}/100</div>
                <div className="text-xs text-muted-foreground">Team Score</div>
              </div>
              <div className="text-center p-3 bg-muted rounded">
                <div className="text-lg font-bold">{analysisResults.market_score || 'N/A'}/100</div>
                <div className="text-xs text-muted-foreground">Market Score</div>
              </div>
            </div>
            {lastAnalysisTime && (
              <p className="text-xs text-muted-foreground text-center">
                Last analyzed: {lastAnalysisTime.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={triggerDocumentAnalysis}
          disabled={analysisStatus === 'running' || documents.length === 0}
          className="w-full"
        >
          {analysisStatus === 'running' ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Brain className="w-4 h-4 mr-2" />
          )}
          {analysisStatus === 'running' 
            ? 'Analysis in Progress...' 
            : documents.length === 0 
              ? 'Upload Documents to Analyze'
              : 'Run AI Analysis'
          }
        </Button>

        {documents.length === 0 && (
          analysisError ? (
            <EnhancedDocumentErrorHandler
              error={analysisError}
              onRetry={() => {
                setAnalysisError(null);
                setAnalysisStatus('idle');
              }}
              onDismiss={() => setAnalysisError(null)}
            />
          ) : (
            <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                📄 Upload documents to unlock comprehensive AI analysis across all engines
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Financial statements, pitch decks, and business plans will be automatically processed
              </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};