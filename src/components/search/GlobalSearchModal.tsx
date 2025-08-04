import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Building2, FileText, Users, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFund } from '@/contexts/FundContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  type: 'deal' | 'company' | 'memo' | 'document';
  title: string;
  subtitle?: string;
  content?: string;
  score?: number;
  metadata?: Record<string, any>;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectedFund } = useFund();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length >= 2) {
      const delayedSearch = setTimeout(() => {
        performSearch(query.trim());
      }, 300);
      return () => clearTimeout(delayedSearch);
    } else {
      setResults([]);
    }
  }, [query, selectedFund]);

  const performSearch = async (searchQuery: string) => {
    if (!selectedFund) return;

    setIsSearching(true);
    try {
      const searchResults: SearchResult[] = [];

      // Search deals
      const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('id, company_name, description, status, overall_score, deal_size, industry')
        .eq('fund_id', selectedFund.id)
        .or(`company_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,industry.ilike.%${searchQuery}%`)
        .limit(10);

      if (!dealsError && deals) {
        deals.forEach(deal => {
          searchResults.push({
            id: deal.id,
            type: 'deal',
            title: deal.company_name,
            subtitle: deal.description || deal.industry,
            score: deal.overall_score,
            metadata: { 
              status: deal.status, 
              deal_size: deal.deal_size,
              industry: deal.industry 
            }
          });
        });
      }

      // Search memos
      const { data: memos, error: memosError } = await supabase
        .from('ic_memos')
        .select('id, title, status, deal_id, deals(company_name)')
        .eq('fund_id', selectedFund.id)
        .or(`title.ilike.%${searchQuery}%`)
        .limit(5);

      if (!memosError && memos) {
        memos.forEach(memo => {
          searchResults.push({
            id: memo.id,
            type: 'memo',
            title: memo.title,
            subtitle: `Memo for ${(memo.deals as any)?.company_name || 'Unknown Company'}`,
            metadata: { 
              status: memo.status,
              deal_id: memo.deal_id
            }
          });
        });
      }

      // Search documents
      const { data: documents, error: documentsError } = await supabase
        .from('deal_documents')
        .select('id, name, content_type, deal_id, deals(company_name)')
        .eq('deals.fund_id', selectedFund.id)
        .or(`name.ilike.%${searchQuery}%,content_type.ilike.%${searchQuery}%`)
        .limit(5);

      if (!documentsError && documents) {
        documents.forEach(doc => {
          searchResults.push({
            id: doc.id,
            type: 'document',
            title: doc.name,
            subtitle: `${doc.content_type} - ${(doc.deals as any)?.company_name || 'Unknown Company'}`,
            metadata: { 
              type: doc.content_type,
              deal_id: doc.deal_id
            }
          });
        });
      }

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleResultClick(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'deal':
        navigate(`/pipeline?deal=${result.id}`);
        break;
      case 'memo':
        navigate(`/ic?memo=${result.id}`);
        break;
      case 'document':
        navigate(`/pipeline?deal=${result.metadata?.deal_id}&document=${result.id}`);
        break;
      default:
        break;
    }
    onClose();
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'deal':
        return <Building2 className="h-4 w-4" />;
      case 'memo':
        return <FileText className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: amount >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 top-[20%] translate-y-0">
        <div className="border-b">
          <div className="flex items-center gap-3 p-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder={`Search ${selectedFund?.name || 'your fund'}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 focus-visible:ring-0 text-base"
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.length < 2 && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Type at least 2 characters to search</p>
              <p className="text-sm mt-2">Search across deals, memos, and documents</p>
            </div>
          )}

          {query.length >= 2 && results.length === 0 && !isSearching && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">Try different keywords or check spelling</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    index === selectedIndex 
                      ? 'bg-accent text-accent-foreground' 
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded ${
                      index === selectedIndex ? 'bg-background/20' : 'bg-muted'
                    }`}>
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{result.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                        {result.type === 'deal' && result.score && (
                          <Badge variant="outline" className="text-xs">
                            {result.score}/100
                          </Badge>
                        )}
                      </div>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                      {result.metadata && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {result.metadata.status && (
                            <span>Status: {result.metadata.status}</span>
                          )}
                          {result.metadata.deal_size && (
                            <span>Size: {formatAmount(result.metadata.deal_size)}</span>
                          )}
                          {result.metadata.industry && (
                            <span>Industry: {result.metadata.industry}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-3 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}