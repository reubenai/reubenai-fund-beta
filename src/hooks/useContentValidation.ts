import { useCallback } from 'react';

interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  warnings: string[];
  dataCompleteness: number;
  fabricationRisk: 'low' | 'medium' | 'high';
}

interface ContentSection {
  key: string;
  content: string;
  title: string;
  sources?: any[];
  confidence?: number;
}

export function useContentValidation() {
  const validateMemoContent = useCallback((sections: ContentSection[]): ValidationResult => {
    let score = 100;
    const issues: string[] = [];
    const warnings: string[] = [];
    let totalContentLength = 0;
    let sectionsWithSources = 0;
    let fabricationRiskFlags = 0;

    // Validate each section
    sections.forEach((section) => {
      // Check content length and quality
      const contentStr = typeof section.content === 'string' ? section.content : JSON.stringify(section.content || '');
      if (!contentStr || contentStr.trim().length < 50) {
        issues.push(`Section "${section.title}" has insufficient content`);
        score -= 15;
      } else {
        totalContentLength += contentStr.length;
      }

      // Check for fabrication indicators
      const fabricationIndicators = [
        /\$\d+\.?\d*[TBM].*market/i, // Specific market size claims
        /\d+%.*growth/i, // Specific growth rate claims
        /founded in \d{4}/i, // Specific founding dates without sources
        /raised \$\d+/i, // Specific funding amounts without verification
        /\d+.*employees/i, // Specific employee counts
        /valued at \$\d+/i // Specific valuations
      ];

      let sectionFabricationFlags = 0;
      fabricationIndicators.forEach(indicator => {
        if (indicator.test(contentStr)) {
          sectionFabricationFlags++;
          fabricationRiskFlags++;
        }
      });

      // Check for proper uncertainty language
      const uncertaintyPhrases = [
        'N/A', 'Unable to validate', 'Requires verification', 'Data unavailable',
        'estimated', 'approximately', 'industry standard', 'AI-estimated'
      ];
      
      const hasUncertaintyLanguage = uncertaintyPhrases.some(phrase => 
        contentStr.toLowerCase().includes(phrase.toLowerCase())
      );

      // Flag sections with specific claims but no uncertainty language
      if (sectionFabricationFlags > 0 && !hasUncertaintyLanguage) {
        warnings.push(`Section "${section.title}" contains specific claims without uncertainty indicators`);
        score -= 10;
      }

      // Check for sources
      if (section.sources && section.sources.length > 0) {
        sectionsWithSources++;
      } else if (sectionFabricationFlags > 0) {
        warnings.push(`Section "${section.title}" has specific claims but no sources`);
        score -= 8;
      }

      // Check confidence levels
      if (section.confidence && section.confidence < 50) {
        warnings.push(`Section "${section.title}" has low confidence (${section.confidence}%)`);
      }
    });

    // Calculate data completeness
    const dataCompleteness = Math.round((sectionsWithSources / sections.length) * 100);

    // Determine fabrication risk
    let fabricationRisk: 'low' | 'medium' | 'high' = 'low';
    if (fabricationRiskFlags > 5) {
      fabricationRisk = 'high';
      score -= 20;
    } else if (fabricationRiskFlags > 2) {
      fabricationRisk = 'medium';
      score -= 10;
    }

    // Check overall content quality
    if (totalContentLength < 1000) {
      issues.push('Overall content length is insufficient for comprehensive analysis');
      score -= 15;
    }

    if (dataCompleteness < 30) {
      issues.push('Insufficient data sources for reliable analysis');
      score -= 15;
    }

    return {
      isValid: score >= 60 && issues.length === 0,
      score: Math.max(0, score),
      issues,
      warnings,
      dataCompleteness,
      fabricationRisk
    };
  }, []);

  const validateAnalysisResults = useCallback((engineResults: any): ValidationResult => {
    let score = 100;
    const issues: string[] = [];
    const warnings: string[] = [];
    let validatedEngines = 0;
    let totalEngines = 0;

    Object.entries(engineResults).forEach(([engineName, result]: [string, any]) => {
      totalEngines++;

      if (!result) {
        issues.push(`Engine ${engineName} returned no results`);
        score -= 20;
        return;
      }

      // Check validation status
      if (result.validation_status === 'validated') {
        validatedEngines++;
      } else if (result.validation_status === 'unvalidated') {
        warnings.push(`Engine ${engineName} has unvalidated results`);
        score -= 10;
      }

      // Check confidence levels
      if (result.confidence < 50) {
        warnings.push(`Engine ${engineName} has low confidence (${result.confidence}%)`);
        score -= 5;
      }

      // Check for reasonable scores
      if (result.score && (result.score < 0 || result.score > 100)) {
        issues.push(`Engine ${engineName} has invalid score: ${result.score}`);
        score -= 15;
      }

      // Check for analysis content
      if (!result.analysis || result.analysis.length < 20) {
        warnings.push(`Engine ${engineName} has insufficient analysis content`);
        score -= 8;
      }
    });

    const dataCompleteness = totalEngines > 0 ? Math.round((validatedEngines / totalEngines) * 100) : 0;

    return {
      isValid: score >= 70 && issues.length === 0,
      score: Math.max(0, score),
      issues,
      warnings,
      dataCompleteness,
      fabricationRisk: dataCompleteness < 50 ? 'high' : dataCompleteness < 70 ? 'medium' : 'low'
    };
  }, []);

  const validateDealData = useCallback((dealData: any): ValidationResult => {
    let score = 100;
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    const requiredFields = ['company_name', 'industry'];
    requiredFields.forEach(field => {
      if (!dealData[field] || dealData[field] === 'N/A') {
        issues.push(`Missing required field: ${field}`);
        score -= 20;
      }
    });

    // Check optional but important fields
    const importantFields = ['deal_size', 'valuation', 'founder', 'description'];
    let missingImportantFields = 0;
    importantFields.forEach(field => {
      if (!dealData[field] || dealData[field] === 'N/A') {
        missingImportantFields++;
      }
    });

    if (missingImportantFields > 2) {
      warnings.push(`Missing ${missingImportantFields} important fields - analysis may be limited`);
      score -= missingImportantFields * 5;
    }

    // Check data quality
    if (dealData.description && dealData.description.length < 50) {
      warnings.push('Company description is very brief - may limit analysis quality');
      score -= 10;
    }

    const dataCompleteness = Math.round(((requiredFields.length + (importantFields.length - missingImportantFields)) / (requiredFields.length + importantFields.length)) * 100);

    return {
      isValid: score >= 60 && issues.length === 0,
      score: Math.max(0, score),
      issues,
      warnings,
      dataCompleteness,
      fabricationRisk: dataCompleteness < 50 ? 'high' : 'low'
    };
  }, []);

  return {
    validateMemoContent,
    validateAnalysisResults,
    validateDealData
  };
}