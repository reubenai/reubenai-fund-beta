import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Zap, 
  FileText, 
  Search, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function VectorDatabasePanel() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    documentsWithText: 0,
    totalEmbeddings: 0,
    needsProcessing: 0
  });
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { toast } = useToast();

  const refreshStats = async () => {
    try {
      // Get document statistics
      const { data: docStats } = await supabase
        .from('deal_documents')
        .select('id, extracted_text', { count: 'exact' });

      const { data: embeddingStats } = await supabase
        .from('vector_embeddings')
        .select('id', { count: 'exact' });

      const totalDocs = docStats?.length || 0;
      const docsWithText = docStats?.filter(d => d.extracted_text && d.extracted_text.trim().length > 0).length || 0;
      const totalEmbeddings = embeddingStats?.length || 0;

      setStats({
        totalDocuments: totalDocs,
        documentsWithText: docsWithText,
        totalEmbeddings,
        needsProcessing: docsWithText - totalEmbeddings
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      toast({
        title: "Error",
        description: "Failed to refresh vector database statistics",
        variant: "destructive",
      });
    }
  };

  const triggerBatchEmbedding = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('batch-embed-documents', {
        body: { batchSize: 20 }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Batch Processing Started",
        description: `Processing ${data.processed || 0} documents for vector embeddings`,
      });

      // Refresh stats after processing
      setTimeout(() => {
        refreshStats();
      }, 2000);

    } catch (error) {
      console.error('Batch embedding failed:', error);
      toast({
        title: "Error",
        description: `Failed to process batch embeddings: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const testVectorSearch = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('hybrid-retrieval-engine', {
        body: {
          query: 'company analysis',
          context_budget: 5,
          namespaces: ['deal_corpus']
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Vector Search Test",
        description: `Found ${data.retrieved_chunks?.length || 0} relevant chunks`,
      });

    } catch (error) {
      console.error('Vector search test failed:', error);
      toast({
        title: "Search Test Failed",
        description: `Vector search test failed: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    refreshStats();
  }, []);

  const healthScore = stats.totalEmbeddings > 0 ? 
    Math.round((stats.totalEmbeddings / Math.max(stats.documentsWithText, 1)) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Vector Database Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-blue-600">{stats.totalDocuments}</div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-green-600">{stats.documentsWithText}</div>
            <div className="text-sm text-gray-600">With Extracted Text</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-purple-600">{stats.totalEmbeddings}</div>
            <div className="text-sm text-gray-600">Vector Embeddings</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-orange-600">{stats.needsProcessing}</div>
            <div className="text-sm text-gray-600">Need Processing</div>
          </div>
        </div>

        {/* Health Status */}
        <Alert className={healthScore > 80 ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
          <Activity className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Vector Database Health: {healthScore}%</span>
            <Badge variant={healthScore > 80 ? "default" : "secondary"}>
              {healthScore > 80 ? "Healthy" : "Needs Attention"}
            </Badge>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={triggerBatchEmbedding}
            disabled={isProcessing || stats.needsProcessing === 0}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Process Documents ({stats.needsProcessing})
          </Button>

          <Button
            variant="outline"
            onClick={testVectorSearch}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Test Vector Search
          </Button>

          <Button
            variant="outline"
            onClick={refreshStats}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Stats
          </Button>
        </div>

        {/* Status Information */}
        {lastRefresh && (
          <div className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        )}

        {/* Processing Status */}
        {stats.needsProcessing > 0 && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              {stats.needsProcessing} documents with extracted text are ready for vector embedding processing.
              Click "Process Documents" to generate embeddings for semantic search.
            </AlertDescription>
          </Alert>
        )}

        {stats.totalEmbeddings > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Vector database is operational with {stats.totalEmbeddings} embeddings ready for semantic search and AI analysis.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}