import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  RefreshCw,
  X,
  AlertTriangle,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useMemoCache } from '@/hooks/useMemoCache';
import { useEnhancedToast } from '@/hooks/useEnhancedToast';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useMemoVersions } from '@/hooks/useMemoVersions';
import { useMemoProgressTracking } from '@/hooks/useMemoProgressTracking';
import { useContentValidation } from '@/hooks/useContentValidation';
import { DataQualityIndicator } from '@/components/ui/data-quality-indicator';
import MemoVersionHistoryModal from './MemoVersionHistoryModal';
import { MemoPublishingControls } from './MemoPublishingControls';
import { supabase } from '@/integrations/supabase/client';
import { exportMemoToPDF, openMemoPrintPreview } from '@/utils/pdfClient';
import { usePermissions } from '@/hooks/usePermissions';

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

interface EnhancedMemoPreviewModalProps {
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
  { key: 'investment_recommendation', title: 'Investment Recommendation', icon: Target, description: 'Final investment recommendation and rationale' }
];

export const EnhancedMemoPreviewModal: React.FC<EnhancedMemoPreviewModalProps> = ({
  isOpen,
  onClose,
  deal,
  fundId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // Server (Pro PDF)
  const [isClientDownloading, setIsClientDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('executive_summary');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showDataQuality, setShowDataQuality] = useState(false);
  const [serverPdfHealthy, setServerPdfHealthy] = useState<'unknown' | 'ok' | 'down'>('unknown');
  
  const { memoState, loadMemo, generateMemo, cancelGeneration, updateContent } = useMemoCache(deal.id, fundId);
  const { versionState, loadVersions, saveVersion, restoreVersion } = useMemoVersions(deal.id, fundId);
  const { 
    showToast,
    showMemoGenerationToast, 
    showAnalysisOutdatedToast, 
    showMemoErrorToast, 
    showLoadingToast,
    dismiss 
  } = useEnhancedToast();
  const { validateMemoContent } = useContentValidation();
  const { canEditICMemos } = usePermissions();

  // Validate memo content for quality and fabrication prevention
  const currentContent = (memoState.content as any)?.sections || memoState.content || {};
  const hasContent = Object.keys(currentContent).length > 0;
  
  const contentValidation = hasContent ? validateMemoContent(
    Object.entries(currentContent).map(([key, content]) => ({
      key,
      content: content as string,
      title: MEMO_SECTIONS.find(s => s.key === key)?.title || key,
      confidence: (memoState.content as any)?.confidence || 75
    }))
  ) : null;

  // Auto-save functionality
  const { isAutoSaveEnabled } = useAutoSave(memoState.content, {
    onSave: async () => {
      if (memoState.existsInDb && Object.keys(memoState.content).length > 0) {
        await handleSaveMemo();
      }
    },
    delay: 5000, // Auto-save every 5 seconds
    enabled: isEditing && memoState.existsInDb
  });

  useEffect(() => {
    if (isOpen && deal.id) {
      loadMemo();
      loadVersions();
    }
  }, [isOpen, deal.id, loadMemo, loadVersions]);

  const handleGenerateMemo = async () => {
    const loadingToast = showLoadingToast(
      "Generating IC Memo",
      `Creating professional memo for ${deal.company_name}...`,
      cancelGeneration
    );

    try {
      await generateMemo();
      loadingToast.dismiss();
      showMemoGenerationToast(deal.company_name, () => {
        // Toast is already showing the memo, no navigation needed
      });
    } catch (error) {
      loadingToast.dismiss();
      showMemoErrorToast(
        error instanceof Error ? error.message : 'Failed to generate memo. Please try again.',
        () => handleGenerateMemo()
      );
    }
  };

  const handleSaveMemo = async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase.from('ic_memos').upsert({
        deal_id: deal.id,
        fund_id: fundId,
        title: `IC Memo - ${deal.company_name}`,
        memo_content: memoState.content as any,
        status: 'draft',
        is_published: false,
        overall_score: deal.overall_score,
        rag_status: deal.rag_status,
        created_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      // Save version after successful save (simplified)
      try {
        await saveVersion(memoState.content, 'Manual save');
      } catch (versionError) {
        console.warn('Failed to save version:', versionError);
      }

      showMemoGenerationToast(deal.company_name, () => {});
    } catch (error) {
      showMemoErrorToast(
        'Failed to save memo. Please try again.',
        () => handleSaveMemo()
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getSections = () => {
    const content: Record<string, string> = (memoState.content as any)?.sections || (memoState.content as any) || {};
    return MEMO_SECTIONS.map((s) => ({
      title: s.title,
      content: (content as any)[s.key] || ''
    }));
  };

  const handlePreviewClient = async () => {
    if (!hasContent) {
      showToast({
        title: 'No memo content yet',
        description: 'Generate the memo first to preview or export.',
      });
      return;
    }
    try {
      setIsPreviewing(true);
      openMemoPrintPreview({ companyName: deal.company_name, sections: getSections(), autoPrint: true });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownloadClient = async () => {
    if (!hasContent) {
      showToast({
        title: 'No memo content yet',
        description: 'Generate the memo first to preview or export.',
      });
      return;
    }
    try {
      setIsClientDownloading(true);
      await exportMemoToPDF({ companyName: deal.company_name, sections: getSections() });
    } finally {
      setIsClientDownloading(false);
    }
  };
  
  const handleExportPDF = async () => {
    if (!memoState.id && !hasContent) {
      showToast({
        title: 'No memo to export',
        description: 'Please generate or save the memo before exporting.',
      });
      return;
    }
    const loadingToast = showLoadingToast(
      'Generating Pro PDF',
      `Rendering high-quality PDF for ${deal.company_name}...`
    );
    try {
      setIsExporting(true);
      const payload: any = memoState.id
        ? { memoId: memoState.id }
        : {
            dealId: deal.id,
            fundId,
            memoContent: currentContent,
            dealData: {
              company_name: deal.company_name,
              industry: deal.industry,
              deal_size: deal.deal_size,
              valuation: deal.valuation,
            },
          };

      const response: any = await withTimeout(
        supabase.functions.invoke('ic-memo-pdf-exporter', {
          body: payload,
        }) as any,
        15000
      );
      const { data, error } = response;

      if (error || !data?.success || !data?.pdfUrl) {
        throw new Error((error as any)?.message || 'Server PDF generation failed');
      }

      const link = document.createElement('a');
      link.href = data.pdfUrl;
      link.download = data.fileName || `IC_Memo_${deal.company_name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      // Fallback: client-side export
      if (!hasContent) {
        showToast({ title: 'Export failed', description: 'No content available. Generate memo first.' });
      } else {
        await exportMemoToPDF({
          companyName: deal.company_name,
          sections: getSections(),
          fileName: `IC_Memo_${deal.company_name.replace(/\s+/g, '_')}.pdf`,
        });
      }
    } finally {
      loadingToast.dismiss();
      setIsExporting(false);
    }
  };
  
  const withTimeout = async <T,>(p: Promise<T>, ms = 4000): Promise<T> => {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)) as Promise<T>,
    ]);
  };


  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const { data }: any = await withTimeout(
          supabase.functions.invoke('ic-memo-pdf-exporter', { body: { test: true } }) as any,
          2000
        );
        if (!cancelled) setServerPdfHealthy(data?.ok ? 'ok' : 'down');
      } catch {
        if (!cancelled) setServerPdfHealthy('down');
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  const handleRefreshAnalysis = async () => {
    if (memoState.needsRefresh) {
      showAnalysisOutdatedToast(deal.company_name, () => {
        handleGenerateMemo();
      });
    }
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
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-xl font-semibold">
                Investment Committee Memo
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {deal.company_name}
                </Badge>
                {getStatusBadge()}
                {deal.overall_score && (
                  <Badge variant="outline">
                    Score: {deal.overall_score}/100
                  </Badge>
                )}
                {memoState.needsRefresh && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Outdated
                  </Badge>
                )}
                {isAutoSaveEnabled && isEditing && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Auto-save enabled
                  </Badge>
                )}
                {versionState.versions.length > 0 && (
                  <Badge variant="outline">
                    v{versionState.currentVersion}
                  </Badge>
                 )}
                 
                 {/* Memo Publishing Controls */}
                 {memoState.existsInDb && (
                 <MemoPublishingControls
                     memoId={memoState.id || ''}
                     currentStatus={memoState.status || 'draft'}
                     isPublished={memoState.isPublished || false}
                     dealName={deal.company_name}
                     onStatusUpdate={() => {
                       // Refresh memo state after status update
                       loadMemo();
                     }}
                   />
                 )}
               </div>
             </div>
             
              <div className="flex items-center gap-2 flex-wrap">
              {memoState.isGenerating && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelGeneration}
                  className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
              
              {canEditICMemos && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={memoState.isGenerating}
                >
                  {isEditing ? <Eye className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                  {isEditing ? 'Preview' : 'Edit'}
                </Button>
              )}
              
              {canEditICMemos && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (memoState.existsInDb && Object.keys(memoState.content).length > 0) {
                      if (confirm('Regenerating will overwrite your current memo content. Are you sure you want to continue?')) {
                        handleGenerateMemo();
                      }
                    } else {
                      handleGenerateMemo();
                    }
                  }}
                  disabled={memoState.isGenerating || isSaving}
                >
                  {memoState.isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {memoState.existsInDb ? 'Regenerate' : 'Generate'} with AI
                </Button>
              )}
              
              {canEditICMemos && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveMemo}
                  disabled={isSaving || memoState.isGenerating}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                Save
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionHistory(true)}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                History ({versionState.versions.length})
              </Button>
              
              {contentValidation && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDataQuality(!showDataQuality)}
                  className={contentValidation.fabricationRisk === 'high' ? 'border-destructive text-destructive' : ''}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Quality ({contentValidation.score}/100)
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewClient}
                disabled={isPreviewing || memoState.isGenerating}
                className="gap-2"
              >
                {isPreviewing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Preview (Print View)
              </Button>
              
              <Button
                size="sm"
                onClick={handleDownloadClient}
                disabled={isClientDownloading || memoState.isGenerating}
                className="gap-2"
              >
                {isClientDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Quick Download (Client)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting || memoState.isGenerating || serverPdfHealthy === 'down'}
                className="gap-2"
                title={serverPdfHealthy === 'down' ? 'Server PDF unavailable, use Quick Download' : 'Generate server-rendered PDF'}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Pro PDF (Server){serverPdfHealthy === 'down' ? ' – Unavailable' : ''}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar Navigation */}
          <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto flex-shrink-0">
            <h3 className="font-semibold text-sm text-muted-foreground mb-4 uppercase tracking-wide">
              Memo Sections
            </h3>
            <div className="space-y-2">
              {MEMO_SECTIONS.map((section) => {
                const IconComponent = section.icon;
                const isActive = activeSection === section.key;
                const hasContent = memoState.content[section.key as keyof typeof memoState.content];
                
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
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
            {/* Collapsible Data Quality Indicator */}
            {contentValidation && (
              <Collapsible open={showDataQuality} onOpenChange={setShowDataQuality}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-4 border-b bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Data Quality Assessment</span>
                      <Badge variant="outline" className={
                        contentValidation.fabricationRisk === 'high' ? 'border-destructive text-destructive' :
                        contentValidation.fabricationRisk === 'medium' ? 'border-warning text-warning' :
                        'border-success text-success'
                      }>
                        {contentValidation.score}/100
                      </Badge>
                      {contentValidation.fabricationRisk === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          High Risk
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {showDataQuality ? 'Hide' : 'Show'} Details
                      </span>
                      {showDataQuality ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 border-b bg-muted/10">
                    <DataQualityIndicator 
                      validationResult={contentValidation}
                      title="Detailed Quality Analysis"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            {memoState.isGenerating ? (
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
              <div className="p-6 overflow-y-auto flex-1 min-h-0">
                {MEMO_SECTIONS.map((section) => {
                  if (activeSection !== section.key) return null;
                  
                  const IconComponent = section.icon;
                  const content = memoState.content[section.key as keyof typeof memoState.content] || '';
                  
                  return (
                    <div key={section.key} className="space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <div>
                          <h2 className="text-2xl font-bold">{section.title}</h2>
                          <p className="text-muted-foreground">{section.description}</p>
                        </div>
                      </div>
                      
                      {canEditICMemos && isEditing ? (
                        <Textarea
                          value={content}
                          onChange={(e) => updateContent(section.key, e.target.value)}
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
                                <FileText className="h-12 w-12 mx-auto mb-4" />
                                <p>No content available for this section</p>
                                <p className="text-xs mt-2">
                                  Generate a memo to populate this section with AI analysis
                                </p>
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

      <MemoVersionHistoryModal
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        versions={versionState.versions}
        currentVersion={versionState.currentVersion}
        isLoading={versionState.isLoading}
        onRestoreVersion={restoreVersion}
        dealName={deal.company_name}
      />
    </Dialog>
  );
};