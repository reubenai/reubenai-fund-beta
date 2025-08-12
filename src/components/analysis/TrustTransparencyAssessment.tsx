import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  FileText, 
  Users,
  Eye,
  Lock,
  Star,
  AlertTriangle
} from 'lucide-react';

interface TrustTransparencyAssessmentProps {
  deal: any;
}

export function TrustTransparencyAssessment({ deal }: TrustTransparencyAssessmentProps) {
  // Extract trust metrics from enhanced analysis
  const analysis = deal?.enhanced_analysis;
  const trustScore = analysis?.rubric_breakdown?.find((item: any) => 
    item.category === 'Trust & Transparency'
  )?.score || 0;

  const getTrustLevel = (score: number) => {
    if (score >= 85) return { level: 'High Trust', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 70) return { level: 'Moderate Trust', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Trust Concerns', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const trustLevel = getTrustLevel(trustScore);

  return (
    <div className="space-y-6">
      {/* Overall Trust Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Trust & Transparency Overview
            </CardTitle>
            <Badge variant="secondary" className={`${trustLevel.bgColor} ${trustLevel.color}`}>
              {trustLevel.level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Trust Score</span>
              <span className={`text-2xl font-bold ${trustLevel.color}`}>
                {trustScore}/100
              </span>
            </div>
            <Progress value={trustScore} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Assessment of management integrity, financial transparency, and governance practices
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Management Integrity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Management Team & Leadership
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Leadership Track Record</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Previous Company Exits</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Industry Reputation</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Founder</p>
              <p className="text-sm font-medium">
                {deal?.founder || 'Founder information available'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">LinkedIn</p>
              {deal?.linkedin_url ? (
                <a href={deal.linkedin_url} target="_blank" rel="noopener noreferrer" 
                   className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  Available <Eye className="h-3 w-3" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">Not provided</p>
              )}
            </div>
          </div>
          
          {deal?.co_founders?.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Co-founders</p>
              <div className="flex flex-wrap gap-2">
                {deal.co_founders.slice(0, 3).map((coFounder: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {coFounder}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Transparency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Financial Disclosure & Transparency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Financial document review in progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Data room accessibility assessment ongoing</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Historical performance validation pending</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-muted-foreground">Deal Size</p>
              <p className="text-sm font-medium">
                {deal?.deal_size ? `$${(deal.deal_size / 1000000).toFixed(1)}M` : 'Not disclosed'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valuation</p>
              <p className="text-sm font-medium">
                {deal?.valuation ? `$${(deal.valuation / 1000000).toFixed(1)}M` : 'Under discussion'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Governance & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Governance & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Board Structure</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Regulatory Compliance</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Audit & Controls</span>
              <Badge variant="outline">Analyzing</Badge>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Due Diligence Status</p>
                <p className="text-xs text-muted-foreground">
                  Comprehensive governance, compliance, and transparency assessment is conducted during the due diligence process. Initial screening focuses on publicly available information and management interviews.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}