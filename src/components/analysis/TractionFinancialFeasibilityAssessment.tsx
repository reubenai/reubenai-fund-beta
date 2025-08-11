import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TractionFinancialCriteria {
  name: string;
  weight: number;
  status: 'pass' | 'fail' | 'partial';
  reasoning: string;
}

interface TractionFinancialFeasibilityAssessmentProps {
  deal: any;
}

export function TractionFinancialFeasibilityAssessment({ deal }: TractionFinancialFeasibilityAssessmentProps) {
  // Mock evaluation logic - in real implementation this would come from AI analysis
  const evaluateCriteria = (): TractionFinancialCriteria[] => {
    const mockCriteria = [
      {
        name: "Revenue Growth",
        weight: 0.25,
        status: Math.random() > 0.3 ? 'pass' : Math.random() > 0.6 ? 'partial' : 'fail',
        reasoning: "Consistent 40% month-over-month revenue growth for the past 6 months."
      },
      {
        name: "Customer Acquisition", 
        weight: 0.20,
        status: Math.random() > 0.4 ? 'pass' : Math.random() > 0.5 ? 'partial' : 'fail',
        reasoning: "Strong customer acquisition metrics with decreasing CAC and increasing LTV."
      },
      {
        name: "Financial Projections",
        weight: 0.15,
        status: Math.random() > 0.3 ? 'pass' : Math.random() > 0.6 ? 'partial' : 'fail', 
        reasoning: "Realistic financial projections with clear path to profitability within 18 months."
      },
      {
        name: "Unit Economics",
        weight: 0.15,
        status: Math.random() > 0.4 ? 'pass' : Math.random() > 0.5 ? 'partial' : 'fail',
        reasoning: "Positive unit economics with healthy gross margins above 70%."
      },
      {
        name: "Market Validation",
        weight: 0.15,
        status: Math.random() > 0.3 ? 'pass' : Math.random() > 0.6 ? 'partial' : 'fail',
        reasoning: "Strong product-market fit evidenced by organic growth and customer retention."
      },
      {
        name: "Funding Efficiency",
        weight: 0.10,
        status: Math.random() > 0.4 ? 'pass' : Math.random() > 0.5 ? 'partial' : 'fail',
        reasoning: "Efficient capital deployment with clear milestones for fund utilization."
      }
    ];

    return mockCriteria.map(criteria => ({
      ...criteria,
      status: criteria.status as 'pass' | 'fail' | 'partial'
    }));
  };

  const criteria = evaluateCriteria();

  const calculateOverallScore = () => {
    return criteria.reduce((total, criterion) => {
      const score = criterion.status === 'pass' ? 1 : criterion.status === 'partial' ? 0.5 : 0;
      return total + (score * criterion.weight);
    }, 0);
  };

  const overallScore = calculateOverallScore();
  
  const getOverallStatus = () => {
    if (overallScore >= 0.8) return { label: 'Excellent', color: 'bg-green-500' };
    if (overallScore >= 0.6) return { label: 'Good', color: 'bg-blue-500' };
    if (overallScore >= 0.4) return { label: 'Fair', color: 'bg-yellow-500' };
    return { label: 'Poor', color: 'bg-red-500' };
  };

  const overallStatus = getOverallStatus();

  const getStatusIcon = (status: 'pass' | 'fail' | 'partial') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'partial') => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Fail</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Partial</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Traction & Financial Feasibility</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${overallStatus.color} text-white`}>
              {overallStatus.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {Math.round(overallScore * 100)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {criteria.map((criterion, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(criterion.status)}
                <h4 className="font-medium">{criterion.name}</h4>
                <span className="text-sm text-muted-foreground">
                  ({Math.round(criterion.weight * 100)}% weight)
                </span>
              </div>
              {getStatusBadge(criterion.status)}
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {criterion.reasoning}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}