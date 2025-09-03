import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  ChevronUp,
  MoreHorizontal,
  Mail,
  Calendar,
  Plus,
  Clock
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
import { MemoWorkflowControls } from './MemoWorkflowControls';
import { supabase } from '@/integrations/supabase/client';
import { exportMemoToPDF, openMemoPrintPreview } from '@/utils/pdfClient';
import { usePermissions } from '@/hooks/usePermissions';
import { MemoPreviewRenderer } from './MemoPreviewRenderer';
import { ICReviewWorkflow } from './ICReviewWorkflow';
import { icMemoService } from '@/services/ICMemoService';

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

// VC-focused memo sections
const VC_MEMO_SECTIONS = [
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

// PE-focused memo sections
const PE_MEMO_SECTIONS = [
  { key: 'executive_summary', title: 'Executive Summary', icon: FileText, description: 'High-level overview and investment recommendation' },
  { key: 'company_overview', title: 'Company Overview', icon: Target, description: 'Company background, mission, and core business' },
  { key: 'financial_performance', title: 'Financial Performance Assessment', icon: DollarSign, description: 'Financial health, performance metrics, and projections' },
  { key: 'market_position', title: 'Market Position Analysis', icon: TrendingUp, description: 'Market positioning, competitive advantages, and dynamics' },
  { key: 'operational_excellence', title: 'Operational Excellence Review', icon: Target, description: 'Operational efficiency, processes, and capabilities' },
  { key: 'management_leadership', title: 'Management & Leadership Evaluation', icon: Users, description: 'Leadership assessment, track record, and capabilities' },
  { key: 'growth_value_creation', title: 'Growth & Value Creation Strategy', icon: TrendingUp, description: 'Growth initiatives and value creation opportunities' },
  { key: 'risk_assessment', title: 'Risk Assessment & Mitigation', icon: Shield, description: 'Comprehensive risk analysis and mitigation strategies' },
  { key: 'strategic_timing', title: 'Strategic Timing Analysis', icon: Clock, description: 'Investment timing and market conditions assessment' },
  { key: 'investment_terms', title: 'Investment Terms & Structure', icon: FileText, description: 'Deal structure, terms, and governance' },
  { key: 'exit_value_realization', title: 'Exit Strategy & Value Realization', icon: TrendingUp, description: 'Exit strategy and value realization potential' },
  { key: 'investment_recommendation', title: 'Investment Recommendation', icon: Target, description: 'Final investment recommendation and rationale' }
];

// Function to get memo sections based on fund type
const getMemoSections = (fundType?: string) => {
  return fundType === 'private_equity' ? PE_MEMO_SECTIONS : VC_MEMO_SECTIONS;
};

export const EnhancedMemoPreviewModal: React.FC<EnhancedMemoPreviewModalProps> = ({
  isOpen,
  onClose,
  deal,
  fundId
}) => {
  const [isEditing, setIsEditing] = useState(true); // Start in edit mode immediately
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fundType, setFundType] = useState<string>('');
  
  // Get dynamic memo sections based on fund type
  const MEMO_SECTIONS = getMemoSections(fundType);

  // Handle close with confirmation
  const handleClose = () => {
    if (hasUnsavedChanges && isEditing) {
      if (confirm('You have unsaved changes. Do you want to save before closing?')) {
        handleSaveMemo().then(() => onClose());
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };
  const [isExporting, setIsExporting] = useState(false); // Server (Pro PDF)
  const [isClientDownloading, setIsClientDownloading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('executive_summary');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showDataQuality, setShowDataQuality] = useState(false);
  const [serverPdfHealthy, setServerPdfHealthy] = useState<'unknown' | 'ok' | 'down'>('unknown');
  const [customSections, setCustomSections] = useState<Array<{key: string, title: string, content?: string}>>([]);
  const [isCapturingData, setIsCapturingData] = useState(false);
  
  const { memoState, loadMemo, generateMemo, cancelGeneration, updateContent } = useMemoCache(deal.id, fundId);
  const { versionState, loadVersions, saveVersion, restoreVersion } = useMemoVersions(deal.id, fundId);
  const [localMemoState, setLocalMemoState] = useState(memoState);
  const { 
    showToast,
    showMemoGenerationToast,
    showMemoSaveToast,
    showAnalysisOutdatedToast, 
    showMemoErrorToast, 
    showLoadingToast,
    dismiss 
  } = useEnhancedToast();
  const { validateMemoContent } = useContentValidation();
  const { canEditICMemos, canSubmitForReview, canReviewMemos } = usePermissions();

  // Track changes to show unsaved confirmation
  useEffect(() => {
    const hasChanges = Object.keys(memoState.content || {}).length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [memoState.content, customSections]);

  // Validate memo content for quality and fabrication prevention
  const currentContent = (memoState.content as any)?.sections || memoState.content || {};
  const hasContent = Object.keys(currentContent).length > 0;
  
  // Debug logging for content detection
  console.log('🔍 Content detection:', { 
    hasContent, 
    currentContentKeys: Object.keys(currentContent),
    memoStateContent: memoState.content,
    existsInDb: memoState.existsInDb,
    fundType,
    dealId: deal.id
  });
  
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
      loadMemo(false); // Don't auto-generate
      loadVersions();
      loadCustomSections();
      loadFundType();
    }
  }, [isOpen, deal.id, loadMemo, loadVersions]);

  const loadFundType = async () => {
    try {
      const { data: fund, error } = await supabase
        .from('funds')
        .select('fund_type')
        .eq('id', fundId)
        .single();

      if (error) throw error;
      setFundType(fund?.fund_type || '');
    } catch (error) {
      console.error('Error loading fund type:', error);
      setFundType(''); // Default to VC sections
    }
  };

  const loadCustomSections = async () => {
    try {
      const { data: memo, error } = await supabase
        .from('ic_memos')
        .select('custom_sections')
        .eq('deal_id', deal.id)
        .eq('fund_id', fundId)
        .maybeSingle();

      if (error) throw error;

      if (memo?.custom_sections && Array.isArray(memo.custom_sections)) {
        const sections = memo.custom_sections as Array<{key: string, title: string, content?: string}>;
        setCustomSections(sections);
      }
    } catch (error) {
      console.error('Error loading custom sections:', error);
    }
  };

  // Disabled AI memo generation
  const handleGenerateMemo = async () => {
    // AI generation disabled - users should manually create memos
    return;
  };

  // Create mapping from section titles to database keys
  const createSectionMapping = (fundType: string) => {
    const vcMapping: Record<string, string> = {
      'Executive Summary': 'executive_summary',
      'Company Overview': 'company_overview', 
      'Market Opportunity': 'market_opportunity',
      'Product & Service': 'product_service',
      'Business Model': 'business_model',
      'Competitive Landscape': 'competitive_landscape',
      'Management Team': 'management_team',
      'Financial Analysis': 'financial_analysis',
      'Investment Terms': 'investment_terms',
      'Risks & Mitigants': 'risks_mitigants',
      'Exit Strategy': 'exit_strategy',
      'Investment Recommendation': 'investment_recommendation'
    };

    const peMapping: Record<string, string> = {
      'Executive Summary': 'executive_summary',
      'Company Overview': 'company_overview',
      'Financial Performance Assessment': 'financial_performance',
      'Market Position Analysis': 'market_position',
      'Operational Excellence Review': 'operational_excellence',
      'Management & Leadership Evaluation': 'management_leadership',
      'Growth & Value Creation Strategy': 'growth_value_creation',
      'Risk Assessment & Mitigation': 'risk_assessment',
      'Strategic Timing Analysis': 'strategic_timing',
      'Investment Terms & Structure': 'investment_terms',
      'Exit Strategy & Value Realization': 'exit_value_realization',
      'Investment Recommendation': 'investment_recommendation'
    };

    return fundType === 'private_equity' ? peMapping : vcMapping;
  };

  // Transform sections array to flat key-value structure
  const transformSectionsToContent = (sections: any[], fundType: string) => {
    const mapping = createSectionMapping(fundType);
    const content: Record<string, string> = {};
    
    console.log('🔄 Transforming sections:', { sections, mapping });
    
    sections.forEach(section => {
      const key = mapping[section.title];
      if (key && section.content) {
        content[key] = section.content;
        console.log(`✅ Mapped "${section.title}" -> "${key}"`);
      } else {
        console.warn(`⚠️ No mapping found for section: "${section.title}"`);
      }
    });
    
    console.log('🎯 Final transformed content:', content);
    return content;
  };

  // Function to capture data from ic-memo-drafter
  const handleCaptureData = async () => {
    try {
      setIsCapturingData(true);
      
      console.log('🎬 Starting memo data capture for deal:', deal.id);
      console.log('🔍 Current fund type:', fundType);
      
      const result = await icMemoService.generateMemo(deal.id);
      
      console.log('📨 Raw API response success:', result.success);
      console.log('📨 Raw API result structure:', {
        has_memo: !!result.memo,
        memo_keys: result.memo ? Object.keys(result.memo) : [],
        error: result.error
      });
      
      if (result.success && result.memo) {
        console.log('📥 Raw memo result full structure:', result.memo);
        
        // Access the sections array from the memo (ic-memo-drafter returns different structure than ICMemo interface)
        const memoData = result.memo as any;
        const sections = memoData.sections;
        
        console.log('🔍 Memo data structure analysis:', {
          memo_type: typeof memoData,
          has_sections: !!sections,
          sections_is_array: Array.isArray(sections),
          sections_length: Array.isArray(sections) ? sections.length : 'N/A',
          sections_preview: Array.isArray(sections) ? sections.slice(0, 3).map(s => ({ title: s.title, content_length: s.content?.length })) : 'N/A'
        });
        
        if (sections && Array.isArray(sections)) {
          console.log('📋 All section titles received:', sections.map(s => s.title));
          
          // Transform sections array to flat key-value structure
          const transformedContent = transformSectionsToContent(sections, fundType);
          
          console.log('🔄 Transformation result:', {
            transformed_keys: Object.keys(transformedContent),
            content_lengths: Object.entries(transformedContent).map(([key, content]) => 
              ({ key, length: typeof content === 'string' ? content.length : 0 }))
          });
          
          // Update each section with the captured content
          Object.entries(transformedContent).forEach(([key, content]) => {
            if (content && typeof content === 'string') {
              console.log(`🔄 Updating section "${key}" with content length: ${content.length}`);
              updateContent(key, content);
            } else {
              console.warn(`⚠️ Skipping section "${key}" - invalid content type:`, typeof content);
            }
          });
          
          showToast({
            title: "Data Captured Successfully", 
            description: `Investment memo data captured for ${deal.company_name} (${Object.keys(transformedContent).length} sections)`,
            variant: "default"
          });
          
          // Refresh the memo to show updated content
          await loadMemo(false);
        } else {
          throw new Error('No sections found in memo data');
        }
      } else {
        showMemoErrorToast(
          result.error || 'Failed to capture memo data',
          () => handleCaptureData()
        );
      }
    } catch (error) {
      console.error('💥 Error in handleCaptureData:', error);
      showMemoErrorToast(
        `Error capturing data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        () => handleCaptureData()
      );
    } finally {
      setIsCapturingData(false);
    }
  };

  const handleSaveMemo = async () => {
    try {
      setIsSaving(true);
      
      const { error } = await supabase.from('ic_memos')
        .update({
          title: `IC Memo - ${deal.company_name}`,
          memo_content: memoState.content as any,
          custom_sections: customSections,
          status: memoState.status || 'draft',
          is_published: false,
          overall_score: deal.overall_score,
          rag_status: deal.rag_status,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('deal_id', deal.id)
        .eq('fund_id', fundId);

      if (error) throw error;

      // Save version after successful save (simplified)
      try {
        await saveVersion(memoState.content, 'Manual save');
      } catch (versionError) {
        console.warn('Failed to save version:', versionError);
      }

      showMemoSaveToast(deal.company_name);
      setHasUnsavedChanges(false);
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
    const allSections = [...MEMO_SECTIONS, ...customSections.map(s => ({ ...s, icon: FileText, description: 'Custom section' }))];
    return allSections.map((s) => ({
      title: s.title,
      content: s.key.startsWith('custom_') ? (s as any).content || '' : (content as any)[s.key] || ''
    }));
  };

  const addCustomSection = async () => {
    const sectionNumber = customSections.length + 1;
    const newSection = {
      key: `custom_section_${Date.now()}`,
      title: `Custom Section ${sectionNumber}`,
      content: ''
    };
    
    const updatedSections = [...customSections, newSection];
    setCustomSections(updatedSections);
    setActiveSection(newSection.key);
    
    // Auto-save custom sections to database
    try {
      await supabase.from('ic_memos')
        .update({
          title: `IC Memo - ${deal.company_name}`,
          memo_content: memoState.content as any,
          custom_sections: updatedSections,
          status: memoState.status || 'draft',
          is_published: false,
          overall_score: deal.overall_score,
          rag_status: deal.rag_status,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('deal_id', deal.id)
        .eq('fund_id', fundId);
    } catch (error) {
      console.error('Error saving custom section:', error);
    }
  };

  const updateCustomSection = async (key: string, updates: { title?: string; content?: string }) => {
    const updatedSections = customSections.map(section =>
      section.key === key ? { ...section, ...updates } : section
    );
    setCustomSections(updatedSections);
    
    // Auto-save to database
    try {
      await supabase.from('ic_memos')
        .update({
          title: `IC Memo - ${deal.company_name}`,
          memo_content: memoState.content as any,
          custom_sections: updatedSections,
          status: memoState.status || 'draft',
          is_published: false,
          overall_score: deal.overall_score,
          rag_status: deal.rag_status,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('deal_id', deal.id)
        .eq('fund_id', fundId);
    } catch (error) {
      console.error('Error updating custom section:', error);
    }
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
        supabase.functions.invoke('enhanced-pdf-generator', {
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
          supabase.functions.invoke('enhanced-pdf-generator', { body: { test: true } }) as any,
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
    // Use RAG status first, then fall back to score-based badges
    if (deal.rag_status === 'exciting') {
      return <Badge className="bg-green-50 text-green-700 border-green-200">Exciting</Badge>;
    } else if (deal.rag_status === 'promising') {
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Promising</Badge>;
    } else if (deal.rag_status === 'needs_development') {
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Needs Development</Badge>;
    } else if (deal.overall_score && deal.overall_score >= 85) {
      return <Badge className="bg-green-50 text-green-700 border-green-200">Exciting</Badge>;
    } else if (deal.overall_score && deal.overall_score >= 70) {
      return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Promising</Badge>;
    } else if (deal.overall_score && deal.overall_score >= 50) {
      return <Badge className="bg-amber-50 text-amber-700 border-amber-200">Needs Development</Badge>;
    } else {
      return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Pending Analysis</Badge>;
    }
  };

  const getWorkflowStatusDisplay = () => {
    const status = memoState.status || 'draft';
    const isLocked = ['review', 'approved', 'published'].includes(status);
    
    const statusConfig = {
      draft: { label: 'Draft', color: 'bg-gray-50 text-gray-700', icon: '📝' },
      review: { label: 'Under Review', color: 'bg-amber-50 text-amber-700', icon: '👀' },
      approved: { label: 'Approved', color: 'bg-green-50 text-green-700', icon: '✅' },
      published: { label: 'Published', color: 'bg-blue-50 text-blue-700', icon: '📋' },
      rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700', icon: '❌' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <div className="flex items-center gap-2">
        <Badge className={`${config.color} border`}>
          {config.icon} {config.label}
        </Badge>
        {isLocked && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            🔒 Editing Locked
          </Badge>
        )}
      </div>
    );
  };

  const canEditMemo = () => {
    if (!canEditICMemos) return false;
    const status = memoState.status || 'draft';
    return !['review', 'submitted', 'approved', 'published'].includes(status);
  };

  return (
    <>
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
                {getWorkflowStatusDisplay()}
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
                 
                    {/* IC Review Workflow */}
                     {memoState.existsInDb && (
                       <ICReviewWorkflow
                         memoId={memoState.id || ''}
                         dealName={deal.company_name}
                         currentStatus={memoState.workflow_state || 'draft'}
                         onStatusChange={(workflow_state) => {
                           setLocalMemoState(prev => ({ ...prev, workflow_state }));
                           // Also update the main memo state
                           loadMemo();
                         }}
                         onViewMemo={() => setShowPreview(true)}
                         onSubmissionSuccess={onClose}
                       />
                     )}
                  
                  {/* Memo Publishing Controls */}
                  {memoState.existsInDb && memoState.workflow_state === 'approved' && (
                  <MemoPublishingControls
                      memoId={memoState.id || ''}
                      currentStatus={memoState.status || 'draft'}
                      isPublished={memoState.isPublished || false}
                      dealName={deal.company_name}
                      onStatusUpdate={() => {
                        loadMemo();
                      }}
                      onSubmissionSuccess={onClose}
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
              
              {canEditMemo() && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    disabled={memoState.isGenerating}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCaptureData}
                    disabled={isCapturingData || memoState.isGenerating}
                  >
                    {isCapturingData ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="w-4 h-4 mr-2" />
                    )}
                    Capture Data
                  </Button>
                  
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
                </>
              )}
              
              {!canEditMemo() && canEditICMemos && (
                <div className="text-sm text-muted-foreground px-3 py-2 bg-amber-50 rounded border">
                  Memo is {memoState.status || 'draft'} - editing is locked
                </div>
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={true}
                    className="gap-2"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    Quick Actions
                    <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Mail className="w-4 h-4 mr-2" />
                    Email Memo
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Calendar className="w-4 h-4 mr-2" />
                    Add to IC Meeting
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar Navigation */}
          <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Memo Sections
              </h3>
              {canEditMemo() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addCustomSection}
                  className="gap-2 text-xs"
                >
                  <Plus className="w-3 h-3" />
                  Add Section
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {[...MEMO_SECTIONS, ...customSections].map((section) => {
                const IconComponent = 'icon' in section ? section.icon : FileText;
                const isActive = activeSection === section.key;
                const hasContent = section.key.startsWith('custom_') 
                  ? customSections.find(s => s.key === section.key)?.content || ''
                  : memoState.content[section.key as keyof typeof memoState.content];
                
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
                          {'description' in section ? section.description : 'Custom section'}
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
                {[...MEMO_SECTIONS, ...customSections].map((section) => {
                  if (activeSection !== section.key) return null;
                  
                  const IconComponent = 'icon' in section ? section.icon : FileText;
                  const isCustom = section.key.startsWith('custom_');
                  const content = isCustom 
                    ? customSections.find(s => s.key === section.key)?.content || ''
                    : memoState.content[section.key as keyof typeof memoState.content] || '';
                  
                  return (
                    <div key={section.key} className="space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b">
                        <IconComponent className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          {canEditICMemos && isEditing && isCustom ? (
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => updateCustomSection(section.key, { title: e.target.value })}
                              className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
                            />
                          ) : (
                            <h2 className="text-2xl font-bold">{section.title}</h2>
                          )}
                          <p className="text-muted-foreground">
                            {'description' in section ? section.description : 'Custom section'}
                          </p>
                        </div>
                      </div>
                      
                      {canEditICMemos && isEditing ? (
                        <Textarea
                          value={content}
                          onChange={(e) => {
                            if (isCustom) {
                              updateCustomSection(section.key, { content: e.target.value });
                            } else {
                              updateContent(section.key, e.target.value);
                            }
                            setHasUnsavedChanges(true);
                          }}
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
                                   Enter content for this section
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

      <MemoPreviewRenderer 
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        deal={deal}
        sections={getSections()}
      />
    </Dialog>
    </>
  );
};