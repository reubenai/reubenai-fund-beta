import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Brain, Zap, TrendingUp, FileText, Building } from 'lucide-react';
import { useVectorSearch } from '@/hooks/useVectorSearch';

interface VectorSearchInterfaceProps {
  fundId?: string;
  onResultSelect?: (result: any) => void;
}

export const VectorSearchInterface: React.FC<VectorSearchInterfaceProps> = ({ 
  fundId, 
  onResultSelect 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7);
  
  const { 
    isSearching, 
    searchResults, 
    semanticSearch, 
    hybridSearch,
    findSimilarDeals 
  } = useVectorSearch();

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    
    await semanticSearch(searchQuery, {
      contentType: contentTypeFilter || undefined,
      fundId,
      similarityThreshold,
      maxResults: 10
    });
  };

  const handleHybridSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const results = await hybridSearch(searchQuery, {
      contentType: contentTypeFilter || undefined,
      fundId,
      similarityThreshold,
      maxResults: 10
    });
    
    console.log('Hybrid search results:', results);
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'deal':
        return <Building className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'memo':
        return <Brain className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const formatSimilarityScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Vector Search Intelligence
          <Badge variant="outline" className="ml-auto">Beta</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Controls */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter your search query..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
              />
            </div>
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="deal">Deals</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="memo">Memos</SelectItem>
                <SelectItem value="note">Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Similarity:</span>
              <Select 
                value={similarityThreshold.toString()} 
                onValueChange={(value) => setSimilarityThreshold(parseFloat(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">50%</SelectItem>
                  <SelectItem value="0.6">60%</SelectItem>
                  <SelectItem value="0.7">70%</SelectItem>
                  <SelectItem value="0.8">80%</SelectItem>
                  <SelectItem value="0.9">90%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSemanticSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="gap-2"
            >
              <Brain className="w-4 h-4" />
              Semantic Search
            </Button>
            <Button 
              onClick={handleHybridSearch}
              disabled={isSearching || !searchQuery.trim()}
              variant="outline"
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Hybrid Search
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Search Results</h3>
              <Badge variant="secondary">
                {searchResults.length} results
              </Badge>
            </div>

            <div className="space-y-3">
              {searchResults.map((result, index) => (
                <Card 
                  key={`${result.content_id}-${index}`}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onResultSelect?.(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getContentTypeIcon(result.content_type)}
                        <Badge variant="outline" className="text-xs">
                          {result.content_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-sm font-medium text-green-600">
                          {formatSimilarityScore(result.similarity_score)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {result.content_text}
                    </p>
                    
                    {result.metadata && Object.keys(result.metadata).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(result.metadata).slice(0, 3).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="text-xs">
                            {key}: {String(value).substring(0, 20)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">
              Performing semantic search...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && searchResults.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No results found for "{searchQuery}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};