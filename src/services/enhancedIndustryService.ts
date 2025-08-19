import { ENHANCED_INDUSTRIES, getIndustryByName, getIndustryBySector, findIndustryByKeyword } from '@/constants/enhancedIndustries';
import { industryMappingService } from './industryMappingService';

interface IndustryClassificationResult {
  primary_industry?: string;
  specialized_sectors: string[];
  confidence_score: number;
  classification_notes: string[];
}

/**
 * Enhanced Industry Service for better deal classification and thesis alignment
 */
export class EnhancedIndustryService {
  
  /**
   * Classify a company's industry based on multiple data points
   */
  static classifyCompanyIndustry(data: {
    industry?: string;
    description?: string;
    website?: string;
    businessModel?: string;
    competitors?: string[];
  }): IndustryClassificationResult {
    const result: IndustryClassificationResult = {
      specialized_sectors: [],
      confidence_score: 0,
      classification_notes: []
    };

    // 1. Direct industry mapping from provided industry
    if (data.industry) {
      const match = industryMappingService.findBestMatch(data.industry);
      if (match && match.confidence >= 70) {
        // Find the enhanced industry data
        const enhancedIndustry = getIndustryByName(match.match);
        if (enhancedIndustry) {
          result.primary_industry = enhancedIndustry.canonical;
          result.confidence_score = match.confidence;
          result.classification_notes.push(`Mapped "${data.industry}" to "${match.match}" (${match.reason})`);
          
          // Look for specialized sectors based on keywords
          const keywords = [
            data.industry.toLowerCase(),
            ...(data.description?.toLowerCase().split(' ') || []),
            ...(data.businessModel?.toLowerCase().split(' ') || [])
          ];
          
          for (const sector of enhancedIndustry.sectors) {
            const sectorKeywords = sector.toLowerCase().split(/[\s&-]+/);
            if (sectorKeywords.some(keyword => keywords.some(k => k.includes(keyword) || keyword.includes(k)))) {
              result.specialized_sectors.push(sector);
              result.classification_notes.push(`Identified specialized sector: ${sector}`);
            }
          }
        }
      }
    }

    // 2. Keyword-based classification from description
    if (data.description && result.confidence_score < 80) {
      const descriptionKeywords = data.description.toLowerCase();
      const foundIndustries = findIndustryByKeyword(descriptionKeywords);
      
      if (foundIndustries.length > 0) {
        const bestMatch = foundIndustries[0];
        if (!result.primary_industry || result.confidence_score < 75) {
          result.primary_industry = bestMatch.canonical;
          result.confidence_score = Math.max(result.confidence_score, 75);
          result.classification_notes.push(`Identified from description keywords`);
        }
        
        // Look for sector-specific keywords
        for (const sector of bestMatch.sectors) {
          const sectorWords = sector.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
          if (sectorWords.some(word => word.length > 3 && descriptionKeywords.includes(word))) {
            if (!result.specialized_sectors.includes(sector)) {
              result.specialized_sectors.push(sector);
              result.classification_notes.push(`Found sector "${sector}" in description`);
            }
          }
        }
      }
    }

    // 3. Competitor-based inference
    if (data.competitors && data.competitors.length > 0 && result.confidence_score < 70) {
      const competitorIndustries = new Map<string, number>();
      
      for (const competitor of data.competitors) {
        const match = industryMappingService.findBestMatch(competitor);
        if (match && match.confidence >= 60) {
          const count = competitorIndustries.get(match.match) || 0;
          competitorIndustries.set(match.match, count + 1);
        }
      }
      
      if (competitorIndustries.size > 0) {
        const mostCommon = Array.from(competitorIndustries.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        if (!result.primary_industry) {
          result.primary_industry = mostCommon[0];
          result.confidence_score = Math.max(result.confidence_score, 65);
          result.classification_notes.push(`Inferred from competitor analysis`);
        }
      }
    }

    // 4. Fallback to Technology if nothing found but has tech keywords
    if (!result.primary_industry && data.description) {
      const techKeywords = ['software', 'app', 'platform', 'digital', 'online', 'cloud', 'api', 'saas'];
      const hastech = techKeywords.some(keyword => 
        data.description!.toLowerCase().includes(keyword)
      );
      
      if (hastech) {
        result.primary_industry = 'Technology';
        result.confidence_score = 50;
        result.classification_notes.push('Fallback to Technology based on tech keywords');
      }
    }

    return result;
  }

  /**
   * Enhance existing deal data with better industry classification
   */
  static enhanceDealIndustryData(deal: {
    industry?: string;
    description?: string;
    business_model?: string;
    competitors?: string[];
    primary_industry?: string;
    specialized_sectors?: string[];
  }) {
    const classification = this.classifyCompanyIndustry({
      industry: deal.industry,
      description: deal.description,
      businessModel: deal.business_model,
      competitors: deal.competitors
    });

    // Only update if we have better confidence or missing data
    const shouldUpdate = !deal.primary_industry || 
                        !deal.specialized_sectors?.length ||
                        classification.confidence_score > 75;

    if (shouldUpdate) {
      return {
        primary_industry: classification.primary_industry || deal.primary_industry,
        specialized_sectors: classification.specialized_sectors.length > 0 
          ? classification.specialized_sectors 
          : deal.specialized_sectors || [],
        industry_confidence_score: classification.confidence_score,
        industry_classification_notes: classification.classification_notes
      };
    }

    return null; // No updates needed
  }

  /**
   * Check thesis alignment using enhanced industry data
   */
  static checkThesisAlignment(
    dealIndustries: {
      primary_industry?: string;
      specialized_sectors?: string[];
      industry?: string;
    },
    fundIndustries: string[],
    fundSectors: string[] = []
  ): {
    isAligned: boolean;
    confidence: number;
    explanation: string;
    matches: Array<{type: 'primary' | 'sector' | 'legacy', match: string, confidence: number}>;
  } {
    const matches: Array<{type: 'primary' | 'sector' | 'legacy', match: string, confidence: number}> = [];
    let maxConfidence = 0;

    // 1. Check primary industry alignment
    if (dealIndustries.primary_industry) {
      for (const fundIndustry of fundIndustries) {
        const alignment = industryMappingService.areIndustriesAligned(
          dealIndustries.primary_industry, 
          [fundIndustry], 
          60
        );
        
        if (alignment.aligned && alignment.match) {
          matches.push({
            type: 'primary',
            match: fundIndustry,
            confidence: alignment.match.confidence
          });
          maxConfidence = Math.max(maxConfidence, alignment.match.confidence);
        }
      }
    }

    // 2. Check specialized sector alignment
    if (dealIndustries.specialized_sectors?.length) {
      for (const sector of dealIndustries.specialized_sectors) {
        for (const fundSector of fundSectors) {
          if (sector.toLowerCase().includes(fundSector.toLowerCase()) ||
              fundSector.toLowerCase().includes(sector.toLowerCase())) {
            matches.push({
              type: 'sector',
              match: fundSector,
              confidence: 90
            });
            maxConfidence = Math.max(maxConfidence, 90);
          }
        }
      }
    }

    // 3. Fallback to legacy industry field
    if (matches.length === 0 && dealIndustries.industry) {
      const alignment = industryMappingService.areIndustriesAligned(
        dealIndustries.industry,
        fundIndustries,
        50
      );
      
      if (alignment.aligned && alignment.match) {
        matches.push({
          type: 'legacy',
          match: alignment.match.match,
          confidence: alignment.match.confidence
        });
        maxConfidence = Math.max(maxConfidence, alignment.match.confidence);
      }
    }

    const isAligned = matches.length > 0 && maxConfidence >= 60;
    
    let explanation = '';
    if (isAligned) {
      const bestMatches = matches.filter(m => m.confidence >= maxConfidence - 10);
      explanation = `Aligned via ${bestMatches.map(m => `${m.type}: ${m.match}`).join(', ')}`;
    } else {
      explanation = `No alignment found between deal industries and fund focus`;
    }

    return {
      isAligned,
      confidence: maxConfidence,
      explanation,
      matches
    };
  }
}

export default EnhancedIndustryService;