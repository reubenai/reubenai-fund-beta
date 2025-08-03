import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Download, 
  Edit3, 
  Eye, 
  Save,
  Loader2,
  Brain,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  Target,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Deal {
  id: string;
  company_name: string;
  founder?: string;
  deal_size?: number;
  valuation?: number;
  status?: string;
  industry?: string;
  location?: string;
  description?: string;
  overall_score?: number;
  rag_status?: string;
}

interface MemoContent {
  executive_summary?: string;
  company_overview?: string;
  market_opportunity?: string;
  product_service?: string;
  business_model?: string;
  competitive_landscape?: string;
  management_team?: string;
  financial_analysis?: string;
  investment_terms?: string;
  risks_mitigants?: string;
  exit_strategy?: string;
  recommendation?: string;
}

interface MemoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  fundId: string;
}

const MEMO_SECTIONS = [
  { key: 'executive_summary', title: 'Executive Summary', icon: FileText, description: 'High-level overview and investment recommendation' },
  { key: 'company_overview', title: 'Company Overview', icon: Target, description: 'Company background, mission, and core business' },
  { key: 'market_opportunity', title: 'Market Opportunity', icon: TrendingUp, description: 'Market size, dynamics, and growth potential' },
  { key: 'product_service', title: 'Product & Service', icon: Target, description: 'Product offering, technology, and competitive advantages' },
  { key: 'business_model', title: 'Business Model', icon: DollarSign, description: 'Revenue model, unit economics, and scalability' },
  { key: 'competitive_landscape', title: 'Competitive Landscape', icon: Shield, description: 'Competitive positioning and differentiation' },
  { key: 'management_team', title: 'Management Team', icon: Users, description: 'Leadership team assessment and capabilities' },
  { key: 'financial_analysis', title: 'Financial Analysis', icon: DollarSign, description: 'Financial performance, projections, and metrics' },
  { key: 'investment_terms', title: 'Investment Terms', icon: FileText, description: 'Deal structure, valuation, and terms' },
  { key: 'risks_mitigants', title: 'Risks & Mitigants', icon: Shield, description: 'Key risks and mitigation strategies' },
  { key: 'exit_strategy', title: 'Exit Strategy', icon: TrendingUp, description: 'Potential exit paths and timeline' },
  { key: 'recommendation', title: 'Investment Recommendation', icon: Target, description: 'Final investment recommendation and rationale' }
];

export const MemoPreviewModal: React.FC<MemoPreviewModalProps> = ({
  isOpen,
  onClose,
  deal,
  fundId
}) => {
  const [memoContent, setMemoContent] = useState<MemoContent>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeSection, setActiveSection] = useState('executive_summary');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && deal.id) {
      loadOrGenerateMemo();
    }
  }, [isOpen, deal.id, fundId]);

  const loadOrGenerateMemo = async () => {
    try {
      setIsGenerating(true);
      
      // First check if memo already exists
      const { data: existingMemo } = await supabase
        .from('ic_memos')
        .select('*')
        .eq('deal_id', deal.id)
        .eq('fund_id', fundId)
        .single();

      if (existingMemo?.memo_content) {
        const memoContent = existingMemo.memo_content as any;
        if (memoContent?.sections) {
          setMemoContent(memoContent.sections as MemoContent);
        } else {
          setMemoContent(memoContent as MemoContent);
        }
        toast({
          title: "Memo Loaded",
          description: "Existing memo loaded for preview and editing",
        });
      } else {
        // Generate new memo using AI
        await generateMemoWithAI();
      }
    } catch (error) {
      console.error('Error loading memo:', error);
      // Try to generate new memo if loading fails
      await generateMemoWithAI();
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMemoWithAI = async () => {
    try {
      setIsGenerating(true);
      
      if (!deal?.id || !fundId) {
        throw new Error('Missing required parameters: deal ID or fund ID');
      }
      
      console.log('Generating memo for deal:', deal.id, 'fund:', fundId);
      
      const { data, error } = await supabase.functions.invoke('ai-memo-generator', {
        body: { 
          dealId: deal.id,
          fundId: fundId
        }
      });

      if (error) {
        console.error('AI memo generation error:', error);
        throw error;
      }

      if (data?.success && data?.memo?.memo_content?.sections) {
        setMemoContent(data.memo.memo_content.sections);
        toast({
          title: "AI Memo Generated",
          description: `Institutional-grade memo generated for ${deal.company_name}`,
        });
      } else {
        console.error('Memo generation failed:', data);
        throw new Error(data?.error || 'Failed to generate memo content');
      }
    } catch (error) {
      console.error('Error generating memo:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate memo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveMemo = async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase.from('ic_memos').upsert({
        deal_id: deal.id,
        fund_id: fundId,
        title: `IC Memo - ${deal.company_name}`,
        memo_content: memoContent as any,
        status: 'draft',
        overall_score: deal.overall_score,
        rag_status: deal.rag_status,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      toast({
        title: "Memo Saved",
        description: "Investment memo saved successfully",
      });
    } catch (error) {
      console.error('Error saving memo:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save memo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      // First ensure memo is saved
      await handleSaveMemo();
      
      if (!deal?.id || !fundId) {
        throw new Error('Missing required parameters for PDF export');
      }
      
      console.log('Exporting PDF for deal:', deal.id, 'fund:', fundId);
      
      const { data, error } = await supabase.functions.invoke('ic-memo-pdf-exporter', {
        body: { 
          dealId: deal.id,
          fundId: fundId,
          memoContent: memoContent,
          dealData: deal
        }
      });

      if (error) throw error;

      if (data.success && data.pdfUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.download = data.fileName || `IC_Memo_${deal.company_name}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "PDF Exported",
          description: "Professional IC memo downloaded to your device",
        });
      } else {
        throw new Error('Failed to export PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed", 
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const updateSectionContent = (sectionKey: string, content: string) => {
    setMemoContent(prev => ({
      ...prev,
      [sectionKey]: content
    }));
  };

  const getStatusBadge = () => {
    if (deal.overall_score && deal.overall_score >= 85) {
      return <Badge className="bg-green-50 text-green-700 border-green-200">Exciting</Badge>;
    } else if (deal.overall_score && deal.overall_score >= 70) {
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Promising</Badge>;
    } else if (deal.overall_score && deal.overall_score >= 50) {
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Needs Development</Badge>;
    } else {
      return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Pending Analysis</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-xl font-semibold">
                Investment Committee Memo
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {deal.company_name}
                </Badge>
                {getStatusBadge()}
                {deal.overall_score && (
                  <Badge variant="outline">
                    Score: {deal.overall_score}/100
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isGenerating}
              >
                {isEditing ? <Eye className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={generateMemoWithAI}
                disabled={isGenerating || isSaving}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Regenerate with AI
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveMemo}
                disabled={isSaving || isGenerating}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              
              <Button
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting || isGenerating}
                className="gap-2"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-full">
          {/* Sidebar Navigation */}
          <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
            <h3 className="font-semibold text-sm text-muted-foreground mb-4 uppercase tracking-wide">
              Memo Sections
            </h3>
            <div className="space-y-2">
              {MEMO_SECTIONS.map((section) => {
                const IconComponent = section.icon;
                const isActive = activeSection === section.key;
                const hasContent = memoContent[section.key as keyof MemoContent];
                
                return (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'hover:bg-background border border-transparent hover:border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>
                          {section.title}
                        </div>
                        <div className={`text-xs ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'} truncate`}>
                          {section.description}
                        </div>
                      </div>
                      {hasContent && (
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary-foreground' : 'bg-green-500'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Brain className="w-12 h-12 mx-auto text-primary mb-4 animate-pulse" />
                  <h3 className="text-lg font-semibold mb-2">Generating Institutional-Grade Memo</h3>
                  <p className="text-muted-foreground mb-4">
                    Our AI is analyzing {deal.company_name} using the Reuben Orchestrator...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    This may take a few moments
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {MEMO_SECTIONS.map((section) => {
                  if (activeSection !== section.key) return null;
                  
                  const IconComponent = section.icon;
                  const content = memoContent[section.key as keyof MemoContent] || '';
                  
                  return (
                    <div key={section.key} className="space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <div>
                          <h2 className="text-2xl font-bold">{section.title}</h2>
                          <p className="text-muted-foreground">{section.description}</p>
                        </div>
                      </div>
                      
                      {isEditing ? (
                        <Textarea
                          value={content}
                          onChange={(e) => updateSectionContent(section.key, e.target.value)}
                          className="min-h-[500px] font-mono text-sm"
                          placeholder={`Enter ${section.title.toLowerCase()} content...`}
                        />
                      ) : (
                        <Card>
                          <CardContent className="p-6">
                            {content ? (
                              <div className="prose max-w-none">
                                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                  {content}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-12 text-muted-foreground">
                                <IconComponent className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                <p>No content generated for this section yet.</p>
                                <p className="text-xs mt-1">Click "Regenerate with AI" to generate content.</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};