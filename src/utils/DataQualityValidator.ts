import { Deal } from '@/hooks/usePipelineDeals';
import { SubCriteriaScore, CategoryScore } from './BlueprintScoringEngine';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  quality_score: number;
}

export interface DataSource {
  name: string;
  available: boolean;
  completeness: number;
  last_updated: string | null;
}

export class DataQualityValidator {
  // Score validation
  static validateScore(score: number, fieldName: string): string[] {
    const errors: string[] = [];
    
    if (typeof score !== 'number') {
      errors.push(`${fieldName} must be a number`);
    } else if (score < 0) {
      errors.push(`${fieldName} cannot be negative (got ${score})`);
    } else if (score > 100) {
      errors.push(`${fieldName} cannot exceed 100 (got ${score})`);
    } else if (!Number.isFinite(score)) {
      errors.push(`${fieldName} must be a finite number (got ${score})`);
    }
    
    return errors;
  }

  // Sub-criteria validation
  static validateSubCriteria(subCriteria: SubCriteriaScore): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!subCriteria.name || subCriteria.name.trim() === '') {
      errors.push('Sub-criteria name is required');
    }

    // Validate scores
    errors.push(...this.validateScore(subCriteria.score, 'Score'));
    errors.push(...this.validateScore(subCriteria.confidence, 'Confidence'));
    errors.push(...this.validateScore(subCriteria.weight, 'Weight'));
    errors.push(...this.validateScore(subCriteria.data_completeness, 'Data completeness'));

    // Validate insights
    if (!Array.isArray(subCriteria.insights)) {
      errors.push('Insights must be an array');
    } else if (subCriteria.insights.length === 0) {
      warnings.push('No insights provided for sub-criteria');
    }

    // Quality warnings
    if (subCriteria.confidence < 50) {
      warnings.push(`Low confidence score: ${subCriteria.confidence}%`);
    }
    
    if (subCriteria.data_completeness < 60) {
      warnings.push(`Low data completeness: ${subCriteria.data_completeness}%`);
    }

    const quality_score = this.calculateDataQuality([subCriteria]);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      quality_score
    };
  }

  // Category validation
  static validateCategory(category: CategoryScore): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate category fields
    if (!category.name || category.name.trim() === '') {
      errors.push('Category name is required');
    }

    errors.push(...this.validateScore(category.score, 'Category score'));
    errors.push(...this.validateScore(category.confidence, 'Category confidence'));
    errors.push(...this.validateScore(category.weight, 'Category weight'));

    // Validate sub-criteria
    if (!Array.isArray(category.subCriteria)) {
      errors.push('Sub-criteria must be an array');
    } else if (category.subCriteria.length === 0) {
      warnings.push('No sub-criteria found for category');
    } else {
      // Validate each sub-criteria
      category.subCriteria.forEach((subCriteria, index) => {
        const validation = this.validateSubCriteria(subCriteria);
        
        validation.errors.forEach(error => {
          errors.push(`Sub-criteria ${index + 1}: ${error}`);
        });
        
        validation.warnings.forEach(warning => {
          warnings.push(`Sub-criteria ${index + 1}: ${warning}`);
        });
      });

      // Check sub-criteria weights
      const totalSubWeight = category.subCriteria.reduce((sum, sc) => sum + sc.weight, 0);
      if (Math.abs(totalSubWeight - 100) > 5) { // Allow 5% tolerance
        warnings.push(`Sub-criteria weights total ${totalSubWeight}%, should be ~100%`);
      }
    }

    const quality_score = this.calculateDataQuality(category.subCriteria);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      quality_score
    };
  }

  // Overall validation
  static validateBlueprintScores(categories: CategoryScore[], fundType: 'VC' | 'PE'): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate categories array
    if (!Array.isArray(categories)) {
      errors.push('Categories must be an array');
      return { isValid: false, errors, warnings, quality_score: 0 };
    }

    if (categories.length === 0) {
      errors.push('At least one category is required');
      return { isValid: false, errors, warnings, quality_score: 0 };
    }

    // Expected category counts
    const expectedCounts = { VC: 6, PE: 6 };
    if (categories.length !== expectedCounts[fundType]) {
      warnings.push(`Expected ${expectedCounts[fundType]} categories for ${fundType}, got ${categories.length}`);
    }

    // Validate each category
    categories.forEach((category, index) => {
      const validation = this.validateCategory(category);
      
      validation.errors.forEach(error => {
        errors.push(`Category ${index + 1} (${category.name}): ${error}`);
      });
      
      validation.warnings.forEach(warning => {
        warnings.push(`Category ${index + 1} (${category.name}): ${warning}`);
      });
    });

    // Check category weights
    const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
    if (Math.abs(totalWeight - 100) > 5) { // Allow 5% tolerance
      warnings.push(`Category weights total ${totalWeight}%, should be ~100%`);
    }

    // Calculate overall data quality
    const allSubCriteria = categories.flatMap(cat => cat.subCriteria);
    const quality_score = this.calculateDataQuality(allSubCriteria);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      quality_score
    };
  }

  // Data quality calculation
  static calculateDataQuality(subCriteria: SubCriteriaScore[]): number {
    if (!subCriteria.length) return 0;

    const avgCompleteness = subCriteria.reduce((sum, sc) => sum + sc.data_completeness, 0) / subCriteria.length;
    const avgConfidence = subCriteria.reduce((sum, sc) => sum + sc.confidence, 0) / subCriteria.length;
    
    // Weight completeness more heavily than confidence
    const qualityScore = (avgCompleteness * 0.7) + (avgConfidence * 0.3);
    
    return Math.round(Math.max(0, Math.min(100, qualityScore)));
  }

  // Data source validation
  static validateDataSources(dataSources: DataSource[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(dataSources)) {
      errors.push('Data sources must be an array');
      return { isValid: false, errors, warnings, quality_score: 0 };
    }

    dataSources.forEach((source, index) => {
      if (!source.name || source.name.trim() === '') {
        errors.push(`Data source ${index + 1}: Name is required`);
      }

      if (typeof source.available !== 'boolean') {
        errors.push(`Data source ${index + 1}: Available must be boolean`);
      }

      errors.push(...this.validateScore(source.completeness, `Data source ${index + 1} completeness`));

      if (!source.available) {
        warnings.push(`Data source "${source.name}" is not available`);
      } else if (source.completeness < 70) {
        warnings.push(`Data source "${source.name}" has low completeness: ${source.completeness}%`);
      }
    });

    // Calculate quality based on available sources
    const availableSources = dataSources.filter(source => source.available);
    const quality_score = availableSources.length > 0
      ? availableSources.reduce((sum, source) => sum + source.completeness, 0) / availableSources.length
      : 0;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      quality_score: Math.round(quality_score)
    };
  }

  // Deal-specific validation
  static validateDealData(deal: Deal): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic deal validation
    if (!deal.id) {
      errors.push('Deal ID is required');
    }

    if (!deal.company_name || deal.company_name.trim() === '') {
      errors.push('Company name is required');
    }

    // Deal type doesn't have fund_type or amount fields - using available fields
    // These validations can be extended when fund type info is available
    // For now, we'll base validation on actual Deal properties

    // Data completeness warnings
    if (!deal.description || deal.description.trim() === '') {
      warnings.push('Deal description is missing');
    }

    if (!deal.status) {
      warnings.push('Deal status is missing');
    }

    if (!deal.deal_size) {
      warnings.push('Deal size is missing');
    }

    if (!deal.industry) {
      warnings.push('Deal industry is missing');
    }

    // Calculate data quality based on available fields
    const requiredFields = ['id', 'company_name', 'description', 'status', 'deal_size', 'industry'];
    const availableFields = requiredFields.filter(field => deal[field as keyof Deal]);
    const quality_score = Math.round((availableFields.length / requiredFields.length) * 100);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      quality_score
    };
  }
}