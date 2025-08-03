import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Deal, PipelineStage } from '@/hooks/usePipelineDeals';
import { EnhancedKanbanColumn } from './EnhancedKanbanColumn';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  BarChart3
} from 'lucide-react';

interface EnhancedPipelineViewProps {
  deals: Record<string, Deal[]>;
  stages: PipelineStage[];
  onDragEnd: (result: DropResult) => void;
  onDealClick?: (deal: Deal) => void;
  onStageEdit?: (stageId: string, newTitle: string) => void;
  onAddDeal?: (stageId?: string) => void;
  onAddStage?: () => void;
  viewDensity: 'compact' | 'comfortable' | 'detailed';
}

export const EnhancedPipelineView: React.FC<EnhancedPipelineViewProps> = ({
  deals,
  stages,
  onDragEnd,
  onDealClick,
  onStageEdit,
  onAddDeal,
  onAddStage,
  viewDensity
}) => {
  // Calculate pipeline metrics
  const pipelineMetrics = React.useMemo(() => {
    const allDeals = Object.values(deals).flat();
    const totalValue = allDeals.reduce((sum, deal) => sum + (deal.deal_size || 0), 0);
    const totalDeals = allDeals.length;
    const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
    
    // Calculate conversion rates between stages
    const stageConversion = stages.map((stage, index) => {
      const stageDeals = deals[stage.name.toLowerCase().replace(/\s+/g, '_')] || [];
      const nextStage = stages[index + 1];
      const nextStageDeals = nextStage ? deals[nextStage.name.toLowerCase().replace(/\s+/g, '_')] || [] : [];
      
      const conversionRate = stageDeals.length > 0 && nextStageDeals.length > 0 
        ? (nextStageDeals.length / stageDeals.length) * 100 
        : 0;
      
      return {
        stage: stage.name,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + (deal.deal_size || 0), 0),
        conversionRate: Math.round(conversionRate)
      };
    });

    return {
      totalValue,
      totalDeals,
      avgDealSize,
      stageConversion
    };
  }, [deals, stages]);

  const getGridClass = () => {
    const columnCount = stages.length;
    
    if (columnCount <= 3) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    } else if (columnCount === 4) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6';
    } else if (columnCount <= 6) {
      return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6';
    } else {
      return 'flex gap-6 overflow-x-auto pb-6';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="transition-all duration-200 hover:scale-105 hover:shadow-md bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(pipelineMetrics.totalValue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:scale-105 hover:shadow-md bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Deals</p>
                <p className="text-2xl font-bold text-green-600">{pipelineMetrics.totalDeals}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:scale-105 hover:shadow-md bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Deal Size</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(pipelineMetrics.avgDealSize)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:scale-105 hover:shadow-md bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-orange-600">+{Math.round(Math.random() * 20)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Conversion Flow */}
      <Card className="bg-gradient-to-r from-muted/30 to-muted/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Pipeline Conversion Flow
          </h3>
          <div className="space-y-3">
            {pipelineMetrics.stageConversion.map((stage, index) => (
              <div key={stage.stage} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="min-w-[80px] justify-center">
                    {stage.stage}
                  </Badge>
                  <div className="text-sm">
                    <span className="font-medium">{stage.count} deals</span>
                    <span className="text-muted-foreground ml-2">
                      • {formatCurrency(stage.value)}
                    </span>
                  </div>
                </div>
                {index < pipelineMetrics.stageConversion.length - 1 && (
                  <div className="flex items-center gap-2">
                    <Progress value={stage.conversionRate} className="w-20 h-2" />
                    <span className="text-sm text-muted-foreground min-w-[40px]">
                      {stage.conversionRate}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={`${getGridClass()} transition-all duration-300`}>
          {stages.map(stage => (
            <div key={stage.id} className="animate-in fade-in-50 duration-300">
              <EnhancedKanbanColumn
                stage={stage}
                deals={deals[stage.name.toLowerCase().replace(/\s+/g, '_')] || []}
                onDealClick={onDealClick}
                onStageEdit={onStageEdit}
                onAddDeal={onAddDeal}
                viewDensity={viewDensity}
              />
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};