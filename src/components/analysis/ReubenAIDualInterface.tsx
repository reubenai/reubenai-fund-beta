import React from 'react';
import { Deal } from '@/hooks/usePipelineDeals';
import { ReubenAISummaryScoreEnhanced } from './ReubenAISummaryScoreEnhanced';
import { ReubenAISummaryScore } from './ReubenAISummaryScore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type AnyFundType, toDatabaseFundType } from '@/utils/fundTypeConversion';

interface ReubenAIDualInterfaceProps {
  deal: Deal;
  fundType: AnyFundType;
  onScoreCalculated?: (score: number) => void;
}

/**
 * Dual interface component that provides both original ReubenAI and enhanced Reuben experiences
 */
export function ReubenAIDualInterface({ deal, fundType, onScoreCalculated }: ReubenAIDualInterfaceProps) {
  return (
    <Tabs defaultValue="reuben" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="reubenai">ReubenAI</TabsTrigger>
        <TabsTrigger value="reuben">Reuben</TabsTrigger>
      </TabsList>
      
      <TabsContent value="reubenai" className="mt-4">
        <ReubenAISummaryScore 
          deal={deal} 
          fundType={toDatabaseFundType(fundType)} 
          onScoreCalculated={onScoreCalculated}
        />
      </TabsContent>
      
      <TabsContent value="reuben" className="mt-4">
        <ReubenAISummaryScoreEnhanced 
          deal={deal} 
          fundType={fundType} 
          onScoreCalculated={onScoreCalculated}
        />
      </TabsContent>
    </Tabs>
  );
}