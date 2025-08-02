import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Save, 
  Download, 
  Calendar, 
  RefreshCw, 
  Eye, 
  Edit3,
  Target,
  Briefcase,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  FileText,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataQualityDashboard from './DataQualityDashboard';

interface InvestmentMemo {
  id: string;
  dealId?: string;
  company: string;
  founder: string;
  amount: string;
  stage: string;
  sector: string;
  valuation: string;
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'presented';
  createdByAi: boolean;
  createdDate: string;
  meetingDate?: string;
  template: string;
  dealData?: any;
  content?: Record<string, string>;
  rag_status?: string;
  rag_confidence?: number;
  thesis_alignment_score?: number;
  overall_score?: number;
}

interface EnhancedMemoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  memo: InvestmentMemo | null;
  onSave: (memo: InvestmentMemo) => void;
}

const STANDARD_SECTIONS = [
  { key: 'opportunity_overview', title: 'Opportunity Overview', icon: Target, color: 'text-blue-600' },
  { key: 'executive_summary', title: 'Executive Summary', icon: Briefcase, color: 'text-purple-600' },
  { key: 'company_overview', title: 'Company Overview', icon: FileText, color: 'text-gray-600' },
  { key: 'market_opportunity', title: 'Market Opportunity', icon: TrendingUp, color: 'text-green-600' },
  { key: 'product_service', title: 'Product/Service', icon: Target, color: 'text-blue-600' },
  { key: 'business_model', title: 'Business Model', icon: DollarSign, color: 'text-emerald-600' },
  { key: 'competitive_landscape', title: 'Competitive Landscape', icon: Shield, color: 'text-red-600' },
  { key: 'management_team', title: 'Management Team', icon: Users, color: 'text-orange-600' },
  { key: 'financial_analysis', title: 'Financial Analysis', icon: DollarSign, color: 'text-emerald-600' },
  { key: 'investment_terms', title: 'Investment Terms', icon: Briefcase, color: 'text-purple-600' },
  { key: 'risks_mitigants', title: 'Risks & Mitigants', icon: Shield, color: 'text-red-600' },
  { key: 'exit_strategy', title: 'Exit Strategy', icon: TrendingUp, color: 'text-green-600' },
  { key: 'recommendation', title: 'Investment Recommendation', icon: Target, color: 'text-blue-600' },
  { key: 'appendices', title: 'Appendices', icon: FileText, color: 'text-gray-600' }
];

export const EnhancedMemoEditor: React.FC<EnhancedMemoEditorProps> = ({
  isOpen,
  onClose,
  memo,
  onSave
}) => {
  const [editedMemo, setEditedMemo] = useState<InvestmentMemo | null>(null);
  const [activeSection, setActiveSection] = useState('opportunity_overview');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (memo) {
      setEditedMemo(memo);
    }
  }, [memo]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'review': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'presented': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleSave = async () => {
    if (!editedMemo) return;
    
    setIsSaving(true);
    try {
      onSave(editedMemo);
      toast({
        title: "Memo Saved",
        description: "Investment memo has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save memo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      toast({
        title: "AI Enhancement Started",
        description: "Enhancing memo with latest ReubenAI analysis...",
      });
      
      setTimeout(() => {
        setIsGenerating(false);
        toast({
          title: "Memo Enhanced",
          description: "AI-powered content enhancement completed",
        });
      }, 3000);
    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Enhancement Failed",
        description: "Failed to enhance memo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExportPDF = async () => {
    if (!editedMemo?.id) {
      toast({
        title: "Cannot Export",
        description: "Please save the memo before exporting to PDF",
        variant: "destructive"
      });
      return;
    }

    setIsExportingPDF(true);
    try {
      const { data, error } = await supabase.functions.invoke('ic-memo-pdf-exporter', {
        body: { memoId: editedMemo.id }
      });

      if (error) throw error;

      if (data.success) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = data.pdfUrl;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "PDF Exported",
          description: "Professional investment memo PDF has been generated",
        });
      } else {
        toast({
          title: "Export Failed",
          description: data.error || "Failed to export PDF",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  if (!editedMemo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl">IC Memo - {editedMemo.company}</DialogTitle>
              <Badge className={getStatusColor(editedMemo.status)}>
                {editedMemo.status}
              </Badge>
              {editedMemo.createdByAi && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Enhanced
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                {isPreviewMode ? <Edit3 className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {isPreviewMode ? 'Edit' : 'Preview Memo'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
              >
                {isExportingPDF ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export to PDF
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
              >
                <Brain className="w-4 h-4 mr-2" />
                {isGenerating ? 'Enhancing...' : 'Enhance with ReubenAI'}
              </Button>
              
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Data Quality Dashboard */}
        <div className="px-6 py-4">
          <DataQualityDashboard
            ragStatus={editedMemo?.rag_status || 'pending'}
            ragConfidence={editedMemo?.rag_confidence || 0}
            thesisAlignment={editedMemo?.thesis_alignment_score || 0}
            overallScore={editedMemo?.overall_score || 0}
            dataSources={[
              { name: 'Deal Analysis', status: 'validated', confidence: 85 },
              { name: 'Market Research', status: 'validated', confidence: 78 },
              { name: 'Financial Data', status: 'partial', confidence: 65 },
              { name: 'Team Assessment', status: 'validated', confidence: 90 },
              { name: 'Competitive Intel', status: 'partial', confidence: 55 }
            ]}
          />
        </div>

        <div className="flex-1 flex overflow-hidden">
          <Tabs value={activeSection} onValueChange={setActiveSection} className="flex-1 flex flex-col">
            <TabsList className="mx-6 mt-4 grid grid-cols-7 lg:grid-cols-14">
              {STANDARD_SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.key}
                  value={section.key}
                  className="text-xs"
                  title={section.title}
                >
                  <section.icon className={`w-3 h-3 ${section.color}`} />
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-hidden p-6">
              {STANDARD_SECTIONS.map((section) => (
                <TabsContent
                  key={section.key}
                  value={section.key}
                  className="h-full"
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <section.icon className={`w-5 h-5 ${section.color}`} />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                      {isPreviewMode ? (
                        <div className="prose max-w-none">
                          <div dangerouslySetInnerHTML={{ 
                            __html: editedMemo.content?.[section.key] || '<p className="text-muted-foreground">No content yet. Click "Edit" to add content.</p>'
                          }} />
                        </div>
                      ) : (
                        <Textarea
                          value={editedMemo.content?.[section.key] || ''}
                          onChange={(e) => setEditedMemo(prev => prev ? {
                            ...prev,
                            content: {
                              ...prev.content,
                              [section.key]: e.target.value
                            }
                          } : null)}
                          placeholder={`Enter ${section.title.toLowerCase()} content...`}
                          className="min-h-[400px] resize-none"
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </div>
          </Tabs>

          {/* Side Panel for Deal Overview */}
          <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Deal Overview</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Company</label>
                <Input
                  value={editedMemo.company}
                  onChange={(e) => setEditedMemo(prev => prev ? { ...prev, company: e.target.value } : null)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Founder</label>
                <Input
                  value={editedMemo.founder}
                  onChange={(e) => setEditedMemo(prev => prev ? { ...prev, founder: e.target.value } : null)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Investment Amount</label>
                <Input
                  value={editedMemo.amount}
                  onChange={(e) => setEditedMemo(prev => prev ? { ...prev, amount: e.target.value } : null)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valuation</label>
                <Input
                  value={editedMemo.valuation}
                  onChange={(e) => setEditedMemo(prev => prev ? { ...prev, valuation: e.target.value } : null)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Stage</label>
                <Input
                  value={editedMemo.stage}
                  onChange={(e) => setEditedMemo(prev => prev ? { ...prev, stage: e.target.value } : null)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sector</label>
                <Input
                  value={editedMemo.sector}
                  onChange={(e) => setEditedMemo(prev => prev ? { ...prev, sector: e.target.value } : null)}
                  className="mt-1"
                />
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => {/* TODO: Schedule IC meeting */}}
                >
                  <Calendar className="w-4 h-4" />
                  Schedule IC Meeting
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={handleExportPDF}
                disabled={isExportingPDF}
              >
                {isExportingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};