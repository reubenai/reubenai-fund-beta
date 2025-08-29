
import { supabase } from '@/integrations/supabase/client';
import { toTemplateFundType, type AnyFundType } from '@/utils/fundTypeConversion';
import type { BlueprintV2Scores, CategoryScore, SubcategoryScore, FundType } from '@/types/blueprint-v2';
import { VC_CATEGORIES, PE_CATEGORIES } from '@/types/blueprint-v2';

interface BlueprintV2ScoreRow {
  id: string;
  deal_id: string;
  fund_id: string;
  organization_id: string;
  category_id: string;
  subcategory_id: string;
  score: number;
  confidence_score: number;
  weight: number;
  reasoning: string | null;
  insights: string[] | null;
  strengths: string[] | null;
  concerns: string[] | null;
  recommendations: string[] | null;
  data_sources: any;
  data_completeness_score: number;
  validation_flags: any;
  analysis_version: number;
  engine_name: string | null;
  created_at: string;
  updated_at: string;
}

export class BlueprintV2DataAccess {
  
  /**
   * Get the correct table name based on fund type
   */
  private getTableName(fundType: FundType): string {
    const templateType = toTemplateFundType(fundType);
    return templateType === 'vc' ? 'blueprint_v2_scores_vc' : 'blueprint_v2_scores_pe';
  }

  /**
   * Get category definitions based on fund type
   */
  private getCategoryDefinitions(fundType: FundType) {
    const templateType = toTemplateFundType(fundType);
    return templateType === 'vc' ? VC_CATEGORIES : PE_CATEGORIES;
  }

  /**
   * Fetch Blueprint v2 scores for a deal
   */
  async getBlueprintScores(dealId: string, fundType: FundType): Promise<BlueprintV2Scores | null> {
    const tableName = this.getTableName(fundType);
    
    const { data: scoresData, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('deal_id', dealId)
      .order('category_id', { ascending: true })
      .order('subcategory_id', { ascending: true });

    if (error) {
      console.error(`Error fetching Blueprint v2 scores from ${tableName}:`, error);
      return null;
    }

    if (!scoresData || scoresData.length === 0) {
      return null;
    }

    return this.transformRowsToBlueprint(scoresData, dealId, fundType);
  }

  /**
   * Store Blueprint v2 scores for a deal
   */
  async storeBlueprintScores(scores: BlueprintV2Scores): Promise<boolean> {
    const tableName = this.getTableName(scores.fund_type);
    
    try {
      // Flatten categories and subcategories into rows
      const rows = this.transformBlueprintToRows(scores);
      
      // Upsert rows (update if exists, insert if new)
      const { error } = await supabase
        .from(tableName)
        .upsert(rows, {
          onConflict: 'deal_id,category_id,subcategory_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`Error storing Blueprint v2 scores to ${tableName}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in storeBlueprintScores:', error);
      return false;
    }
  }

  /**
   * Transform database rows to Blueprint v2 structure
   */
  private transformRowsToBlueprint(rows: BlueprintV2ScoreRow[], dealId: string, fundType: FundType): BlueprintV2Scores {
    const categoryDefinitions = this.getCategoryDefinitions(fundType);
    const categories: CategoryScore[] = [];

    // Group rows by category
    const categoryGroups = rows.reduce((acc, row) => {
      if (!acc[row.category_id]) {
        acc[row.category_id] = [];
      }
      acc[row.category_id].push(row);
      return acc;
    }, {} as Record<string, BlueprintV2ScoreRow[]>);

    // Build category scores
    Object.entries(categoryDefinitions).forEach(([categoryKey, categoryConfig]) => {
      const categoryRows = categoryGroups[categoryConfig.category_id] || [];
      
      const subcategories: SubcategoryScore[] = categoryRows.map(row => ({
        subcategory_id: row.subcategory_id,
        subcategory_name: this.formatSubcategoryName(row.subcategory_id),
        score: row.score,
        confidence: row.confidence_score,
        weight: row.weight,
        data_completeness: row.data_completeness_score,
        reasoning: row.reasoning || '',
        insights: row.insights || [],
        risk_flags: row.concerns || [],
        recommendations: row.recommendations || [],
        data_points: row.data_sources || {},
        sources_used: this.extractSourcesFromData(row.data_sources),
        last_updated: row.updated_at,
        engine_responsible: (row.engine_name as any) || 'market-research-engine'
      }));

      // Calculate category-level aggregations
      const categoryScore: CategoryScore = {
        category_id: categoryConfig.category_id,
        category_name: categoryConfig.category_name,
        fund_type: fundType,
        overall_score: this.calculateWeightedAverage(subcategories.map(s => ({ score: s.score, weight: s.weight }))),
        overall_confidence: this.calculateAverageConfidence(subcategories),
        total_weight: categoryConfig.weight,
        subcategories,
        category_insights: this.aggregateInsights(subcategories),
        category_risks: this.aggregateRisks(subcategories),
        category_recommendations: this.aggregateRecommendations(subcategories),
        last_updated: new Date().toISOString()
      };

      categories.push(categoryScore);
    });

    // Calculate overall scores
    const overallScore = this.calculateWeightedAverage(
      categories.map(c => ({ score: c.overall_score, weight: c.total_weight }))
    );

    const overallConfidence = this.calculateAverageConfidence(
      categories.flatMap(c => c.subcategories)
    );

    const analysisCompleteness = this.calculateOverallCompleteness(categories);

    // Get metadata from first row
    const firstRow = rows[0];

    return {
      deal_id: dealId,
      fund_id: firstRow.fund_id,
      fund_type: fundType,
      overall_score: overallScore,
      overall_confidence: overallConfidence,
      categories,
      analysis_completeness: analysisCompleteness,
      quality_metrics: {
        data_freshness: 85,
        source_reliability: 90,
        analysis_depth: 88,
        cross_validation: 82
      },
      execution_metadata: {
        analysis_version: '2.0',
        workflow_type: 'deal_analysis',
        execution_token: `blueprint_v2_${dealId}_${Date.now()}`,
        started_at: firstRow.created_at,
        completed_at: new Date().toISOString(),
        total_duration_ms: 0,
        engines_used: [...new Set(rows.map(r => r.engine_name).filter(Boolean))] as any[]
      },
      fund_memory_integration: {
        pattern_matches: [],
        historical_comparisons: [],
        decision_context: {}
      }
    };
  }

  /**
   * Transform Blueprint v2 structure to database rows
   */
  private transformBlueprintToRows(scores: BlueprintV2Scores): any[] {
    const rows: any[] = [];

    scores.categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        rows.push({
          deal_id: scores.deal_id,
          fund_id: scores.fund_id,
          organization_id: scores.execution_metadata.started_at ? scores.fund_id : scores.fund_id, // TODO: Get actual org_id
          category_id: category.category_id,
          subcategory_id: subcategory.subcategory_id,
          score: subcategory.score,
          confidence_score: subcategory.confidence,
          weight: subcategory.weight,
          reasoning: subcategory.reasoning,
          insights: subcategory.insights,
          strengths: [], // TODO: Extract from insights if needed
          concerns: subcategory.risk_flags,
          recommendations: subcategory.recommendations,
          data_sources: subcategory.data_points,
          data_completeness_score: subcategory.data_completeness,
          validation_flags: {},
          analysis_version: 2,
          engine_name: subcategory.engine_responsible
        });
      });
    });

    return rows;
  }

  // Helper methods
  private formatSubcategoryName(subcategoryId: string): string {
    return subcategoryId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private extractSourcesFromData(dataSources: any): string[] {
    if (!dataSources || typeof dataSources !== 'object') return [];
    
    if (Array.isArray(dataSources)) {
      return dataSources.map(source => typeof source === 'string' ? source : JSON.stringify(source));
    }
    
    return Object.keys(dataSources);
  }

  private calculateWeightedAverage(items: { score: number; weight: number }[]): number {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return 0;
    
    const weightedSum = items.reduce((sum, item) => sum + (item.score * item.weight), 0);
    return Math.round(weightedSum / totalWeight);
  }

  private calculateAverageConfidence(items: { confidence: number }[]): number {
    if (items.length === 0) return 0;
    return Math.round(items.reduce((sum, item) => sum + item.confidence, 0) / items.length);
  }

  private calculateOverallCompleteness(categories: CategoryScore[]): number {
    const allSubcategories = categories.flatMap(c => c.subcategories);
    return this.calculateAverageConfidence(allSubcategories.map(s => ({ confidence: s.data_completeness })));
  }

  private aggregateInsights(subcategories: SubcategoryScore[]): string[] {
    return subcategories
      .flatMap(s => s.insights)
      .filter((insight, index, arr) => arr.indexOf(insight) === index)
      .slice(0, 5);
  }

  private aggregateRisks(subcategories: SubcategoryScore[]): string[] {
    return subcategories
      .flatMap(s => s.risk_flags)
      .filter((risk, index, arr) => arr.indexOf(risk) === index)
      .slice(0, 5);
  }

  private aggregateRecommendations(subcategories: SubcategoryScore[]): string[] {
    return subcategories
      .flatMap(s => s.recommendations)
      .filter((rec, index, arr) => arr.indexOf(rec) === index)
      .slice(0, 5);
  }
}

// Export singleton instance
export const blueprintV2DataAccess = new BlueprintV2DataAccess();
