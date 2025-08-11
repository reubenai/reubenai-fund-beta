import React from 'react';
import { Clock, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProcessingTimeEstimateProps {
  dealCount: number;
  currentStep: string;
  estimatedRemainingMinutes?: number;
}

export const ProcessingTimeEstimate: React.FC<ProcessingTimeEstimateProps> = ({
  dealCount,
  currentStep,
  estimatedRemainingMinutes
}) => {
  const getEstimateDetails = () => {
    const baseTimePerDeal = 3.5; // minutes
    const totalEstimated = Math.ceil(dealCount * baseTimePerDeal);
    
    return {
      totalMinutes: totalEstimated,
      perDeal: baseTimePerDeal,
      engines: 5, // Number of analysis engines
      totalEngineRuns: dealCount * 5
    };
  };

  const estimate = getEstimateDetails();

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-2">Processing Time Estimate</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
              <div>
                <div className="text-blue-700 font-medium">Total Time</div>
                <div className="text-blue-600">~{estimate.totalMinutes} minutes</div>
              </div>
              <div>
                <div className="text-blue-700 font-medium">Per Deal</div>
                <div className="text-blue-600">~{estimate.perDeal} minutes</div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                {estimate.engines} Analysis Engines
              </Badge>
              <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                <Zap className="w-3 h-3 mr-1" />
                {estimate.totalEngineRuns} Total Engine Runs
              </Badge>
            </div>

            {estimatedRemainingMinutes && (
              <div className="text-sm text-blue-600">
                <strong>Estimated remaining:</strong> ~{estimatedRemainingMinutes} minutes
              </div>
            )}

            <p className="text-xs text-blue-600 mt-2">
              Processing time depends on company data complexity and web research requirements.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};