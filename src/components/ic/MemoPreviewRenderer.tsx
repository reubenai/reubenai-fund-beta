import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, FileText } from 'lucide-react';
import { exportMemoToPDF } from '@/utils/pdfClient';

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

interface MemoSection {
  title: string;
  content: string;
}

interface MemoPreviewRendererProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  sections: MemoSection[];
}

export const MemoPreviewRenderer: React.FC<MemoPreviewRendererProps> = ({
  isOpen,
  onClose,
  deal,
  sections
}) => {
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportMemoToPDF({
        companyName: deal.company_name,
        sections,
        fileName: `IC_Memo_${deal.company_name.replace(/\s+/g, '_')}.pdf`
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Investment Committee Memo Preview
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="gap-2"
              >
                {isExporting ? (
                  <>Exporting...</>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export PDF
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 bg-white">
          {/* Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Investment Committee Memo
            </h1>
            <h2 className="text-xl font-semibold text-primary mb-4">
              {deal.company_name}
            </h2>
            <div className="flex justify-center gap-4 text-sm text-gray-600">
              {deal.industry && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {deal.industry}
                </Badge>
              )}
              {deal.location && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {deal.location}
                </Badge>
              )}
              {deal.overall_score && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  Score: {deal.overall_score}/100
                </Badge>
              )}
            </div>
          </div>

          {/* Deal Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Deal Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              {deal.founder && (
                <div>
                  <span className="font-medium text-gray-600">Founder:</span>
                  <span className="ml-2">{deal.founder}</span>
                </div>
              )}
              {deal.deal_size && (
                <div>
                  <span className="font-medium text-gray-600">Deal Size:</span>
                  <span className="ml-2">${(deal.deal_size / 1000000).toFixed(1)}M</span>
                </div>
              )}
              {deal.valuation && (
                <div>
                  <span className="font-medium text-gray-600">Valuation:</span>
                  <span className="ml-2">${(deal.valuation / 1000000).toFixed(1)}M</span>
                </div>
              )}
              {deal.status && (
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className="ml-2 capitalize">{deal.status}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Memo Sections */}
          <div className="space-y-6">
            {sections.filter(section => section.content?.trim()).map((section, index) => (
              <Card key={index} className="border border-gray-200">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="prose prose-sm max-w-none">
                    {section.content.split('\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-3 text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sections.filter(section => section.content?.trim()).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No memo content available for preview.</p>
              <p className="text-sm">Generate the memo first to see the preview.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};