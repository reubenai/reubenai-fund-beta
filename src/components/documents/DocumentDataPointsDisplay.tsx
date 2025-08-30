/**
 * Component to display document data points with proper formatting for VC and PE
 */
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, TrendingUp, Target } from 'lucide-react';
import { DocumentSummary, VCDataPoints, PEDataPoints } from '@/types/document-processing';

interface DocumentDataPointsDisplayProps {
  documents: {
    id: string;
    name: string;
    document_type?: string;
    document_summary?: DocumentSummary;
    data_points_vc?: VCDataPoints;
    data_points_pe?: PEDataPoints;
    created_at: string;
  }[];
  fundType?: 'vc' | 'pe';
}

export function DocumentDataPointsDisplay({ documents, fundType }: DocumentDataPointsDisplayProps) {
  if (documents.length === 0) {
    return null;
  }

  const renderVCDataPoints = (dataPoints: VCDataPoints) => {
    const metrics = [
      { label: 'Market Size', items: ['TAM', 'SAM', 'SOM'] },
      { label: 'Growth Metrics', items: ['CAGR', 'Growth Drivers'] },
      { label: 'Market Intelligence', items: ['Key Market Players', 'Market Share Distribution', 'Whitespace Opportunities'] },
      { label: 'Customer Metrics', items: ['Addressable Customers', 'CAC Trend', 'LTV:CAC Ratio', 'Retention Rate'] },
      { label: 'Strategic Assets', items: ['Strategic Advisors', 'Investor Network', 'Partnership Ecosystem', 'Channel Effectiveness'] }
    ];

    return (
      <div className="space-y-4">
        {metrics.map((category) => (
          <div key={category.label}>
            <h6 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              {category.label}
            </h6>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-5">
              {category.items.map((item) => (
                <div key={item} className="text-xs">
                  <span className="font-medium">{item}:</span>
                  <span className="text-muted-foreground ml-2">
                    {dataPoints[item as keyof VCDataPoints] || 'not listed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPEDataPoints = (dataPoints: PEDataPoints) => {
    const categories = [
      {
        name: 'Financial Performance',
        subcategories: ['Revenue Quality', 'Profitability Analysis', 'Cash Management'],
        icon: '💰'
      },
      {
        name: 'Operational Excellence', 
        subcategories: ['Management Team Strength', 'Operational Efficiency', 'Technology & Systems'],
        icon: '⚙️'
      },
      {
        name: 'Market Position',
        subcategories: ['Market Share & Position', 'Competitive Advantages', 'Customer Base Quality'],
        icon: '🎯'
      },
      {
        name: 'Management Quality',
        subcategories: ['Leadership Track Record', 'Organizational Strength', 'Strategic Vision'],
        icon: '👥'
      },
      {
        name: 'Growth Potential',
        subcategories: ['Market Expansion Opportunities', 'Value Creation Initiatives', 'Exit Strategy Potential'],
        icon: '📈'
      },
      {
        name: 'Strategic Fit',
        subcategories: ['Fund Strategy Alignment', 'Portfolio Synergies', 'Risk-Return Profile'],
        icon: '🔗'
      }
    ];

    return (
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.name}>
            <h6 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span>{category.icon}</span>
              {category.name}
            </h6>
            <div className="space-y-3 ml-6">
              {category.subcategories.map((subcategory) => {
                const data = dataPoints[subcategory as keyof PEDataPoints];
                return (
                  <div key={subcategory} className="border-l-2 border-muted pl-3">
                    <div className="text-xs font-medium mb-1">{subcategory}</div>
                    <div className="text-xs text-muted-foreground">
                      {typeof data === 'string' ? (
                        <span>{data}</span>
                      ) : typeof data === 'object' && data !== null ? (
                        <div className="space-y-1">
                          {Object.entries(data).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                              <span className="ml-2">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>not listed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Data & Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {documents.map((doc, index) => (
          <div key={doc.id}>
            {/* Document Header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">{doc.name}</h4>
              <Badge variant="outline">{doc.document_type || 'Document'}</Badge>
            </div>
            
            {/* Document Summary */}
            {doc.document_summary?.narrative && (
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-2">Investment Summary</h5>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {doc.document_summary.narrative}
                </p>
              </div>
            )}
            
            {/* VC Data Points */}
            {doc.data_points_vc && (
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  VC Investment Data Points
                </h5>
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  {renderVCDataPoints(doc.data_points_vc)}
                </div>
              </div>
            )}
            
            {/* PE Data Points */}
            {doc.data_points_pe && (
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  PE Analysis (Blueprint v2 Subcriteria)
                </h5>
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                  {renderPEDataPoints(doc.data_points_pe)}
                </div>
              </div>
            )}
            
            {/* Separator between documents */}
            {index < documents.length - 1 && <Separator className="my-6" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}