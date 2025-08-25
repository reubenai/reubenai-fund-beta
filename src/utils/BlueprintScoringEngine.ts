import { Deal } from '@/hooks/usePipelineDeals';

export interface SubCriteriaScore {
  name: string;
  score: number;
  confidence: number;
  insights: string[];
  weight: number;
  data_completeness: number;
}

export interface CategoryScore {
  name: string;
  score: number;
  confidence: number;
  weight: number;
  subCriteria: SubCriteriaScore[];
}

export interface BlueprintScores {
  overall: number;
  categories: CategoryScore[];
  data_quality: number;
  confidence: number;
}

export class BlueprintScoringEngine {
  static calculateSubCriteriaScore(
    baseScore: number,
    confidence: number,
    dataCompleteness: number
  ): number {
    // Ensure base score is within 0-100 range
    const clampedScore = Math.max(0, Math.min(100, baseScore));
    
    // Apply confidence and data quality adjustments
    const confidenceAdjustment = confidence / 100;
    const dataQualityAdjustment = dataCompleteness / 100;
    
    // Calculate final score with adjustments
    const adjustedScore = clampedScore * confidenceAdjustment * dataQualityAdjustment;
    
    return Math.round(Math.max(0, Math.min(100, adjustedScore)));
  }

  static calculateCategoryScore(subCriteria: SubCriteriaScore[]): CategoryScore {
    if (!subCriteria.length) {
      return {
        name: '',
        score: 0,
        confidence: 0,
        weight: 0,
        subCriteria: []
      };
    }

    const totalWeight = subCriteria.reduce((sum, criteria) => sum + criteria.weight, 0);
    
    if (totalWeight === 0) {
      return {
        name: '',
        score: 0,
        confidence: 0,
        weight: 0,
        subCriteria
      };
    }

    // Calculate weighted score
    const weightedScore = subCriteria.reduce((sum, criteria) => {
      return sum + (criteria.score * criteria.weight);
    }, 0) / totalWeight;

    // Calculate average confidence
    const avgConfidence = subCriteria.reduce((sum, criteria) => sum + criteria.confidence, 0) / subCriteria.length;

    return {
      name: '',
      score: Math.round(Math.max(0, Math.min(100, weightedScore))),
      confidence: Math.round(avgConfidence),
      weight: totalWeight,
      subCriteria
    };
  }

  static calculateOverallScore(categories: CategoryScore[]): BlueprintScores {
    if (!categories.length) {
      return {
        overall: 0,
        categories: [],
        data_quality: 0,
        confidence: 0
      };
    }

    const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
    
    if (totalWeight === 0) {
      return {
        overall: 0,
        categories,
        data_quality: 0,
        confidence: 0
      };
    }

    // Calculate weighted overall score
    const overallScore = categories.reduce((sum, category) => {
      return sum + (category.score * category.weight);
    }, 0) / totalWeight;

    // Calculate overall confidence
    const overallConfidence = categories.reduce((sum, category) => sum + category.confidence, 0) / categories.length;

    // Calculate data quality based on sub-criteria completeness
    const allSubCriteria = categories.flatMap(cat => cat.subCriteria);
    const avgDataQuality = allSubCriteria.length > 0 
      ? allSubCriteria.reduce((sum, criteria) => sum + criteria.data_completeness, 0) / allSubCriteria.length
      : 0;

    return {
      overall: Math.round(Math.max(0, Math.min(100, overallScore))),
      categories,
      data_quality: Math.round(avgDataQuality),
      confidence: Math.round(overallConfidence)
    };
  }

  static getVCCategoryWeights(): Record<string, number> {
    return {
      'Market Opportunity': 25,
      'Team & Leadership': 20,
      'Product & Technology': 20,
      'Business Model & Traction': 15,
      'Financial Health': 10,
      'Strategic Fit': 10
    };
  }

  static getPECategoryWeights(): Record<string, number> {
    return {
      'Financial Performance': 25,
      'Operational Excellence': 20,
      'Market Position': 20,
      'Management Quality': 15,
      'Growth Potential': 10,
      'Strategic Fit': 10
    };
  }

  static generateMockScores(fundType: 'VC' | 'PE', deal: Deal): BlueprintScores {
    const categoryWeights = fundType === 'VC' ? this.getVCCategoryWeights() : this.getPECategoryWeights();
    
    const categories: CategoryScore[] = Object.entries(categoryWeights).map(([categoryName, weight]) => {
      // Generate 2-4 sub-criteria per category
      const subCriteriaCount = Math.floor(Math.random() * 3) + 2;
      const subCriteria: SubCriteriaScore[] = Array.from({ length: subCriteriaCount }, (_, index) => ({
        name: `${categoryName} Sub-criteria ${index + 1}`,
        score: Math.floor(Math.random() * 40) + 60, // 60-100 range
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100 range
        weight: Math.floor(100 / subCriteriaCount), // Distribute weight evenly
        data_completeness: Math.floor(Math.random() * 40) + 60, // 60-100 range
        insights: [
          `Key insight for ${categoryName.toLowerCase()} analysis`,
          `Performance indicator shows strong ${categoryName.toLowerCase()} metrics`,
          `Assessment reveals competitive advantage in ${categoryName.toLowerCase()}`
        ]
      }));

      return {
        ...this.calculateCategoryScore(subCriteria),
        name: categoryName,
        weight
      };
    });

    return this.calculateOverallScore(categories);
  }
}