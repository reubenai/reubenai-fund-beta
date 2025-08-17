// Enhanced Analysis Engine that provides intelligent baseline analysis
// Eliminates "analysis pending" by using industry intelligence

import { industryIntelligenceService } from './IndustryIntelligenceService';
import { industryMappingService } from './industryMappingService';

interface AnalysisRequest {
  dealId: string;
  fundId: string;
  industry?: string;
  fundType: 'vc' | 'pe';
  companyData: any;
  forceRefresh?: boolean;
}

interface EnhancedAnalysisResult {
  categoryName: string;
  overallScore: number;
  confidence: number;
  status: 'excellent' | 'good' | 'moderate' | 'needs_improvement' | 'concerning';
  subcriteria: {
    name: string;
    score: number;
    confidence: number;
    reasoning: string;
    weight: number;
    dataQuality: 'baseline' | 'research_enhanced' | 'document_validated';
    enhancementOpportunities: string[];
    warningFlags: string[];
  }[];
  recommendations: string[];
  dataGaps: string[];
}

class EnhancedAnalysisEngine {
  
  // Generate comprehensive analysis for all categories using industry intelligence
  async generateEnhancedAnalysis(request: AnalysisRequest): Promise<EnhancedAnalysisResult[]> {
    console.log('🔬 [Enhanced Analysis] Starting intelligent analysis for:', request.dealId);
    
    // Determine industry
    const industry = this.determineIndustry(request.industry, request.companyData);
    
    // Get analysis framework based on fund type
    const categories = this.getAnalysisFramework(request.fundType);
    
    const results: EnhancedAnalysisResult[] = [];
    
    for (const category of categories) {
      const categoryResult = await this.analyzeCategoryWithIntelligence(
        category,
        industry,
        request.fundType,
        request.companyData
      );
      results.push(categoryResult);
    }
    
    console.log('✅ [Enhanced Analysis] Completed intelligent analysis with', results.length, 'categories');
    return results;
  }

  private determineIndustry(providedIndustry?: string, companyData?: any): string {
    if (providedIndustry) {
      const match = industryMappingService.findBestMatch(providedIndustry);
      if (match && match.confidence > 60) {
        return match.match;
      }
    }
    
    // Try to infer from company data
    if (companyData?.description) {
      const industries = industryIntelligenceService.getSupportedIndustries();
      for (const industry of industries) {
        if (companyData.description.toLowerCase().includes(industry.toLowerCase())) {
          return industry;
        }
      }
    }
    
    // Default to Technology as most common VC industry
    return 'Technology';
  }

  private getAnalysisFramework(fundType: 'vc' | 'pe') {
    if (fundType === 'vc') {
      return [
        {
          name: 'Market Opportunity',
          subcriteria: ['Market Size (TAM)', 'Market Growth Rate', 'Market Timing', 'Customer Demand', 'Regulatory Environment', 'Competitive Position'],
          weights: [40, 25, 20, 15, 15, 20] // Adjusted weights
        },
        {
          name: 'Founder & Team Strength', 
          subcriteria: ['Founder Experience', 'Domain Expertise', 'Education & Credentials', 'Previous Successes', 'Team Composition', 'Network & Advisors'],
          weights: [25, 20, 15, 20, 15, 5]
        },
        {
          name: 'Product & IP Moat',
          subcriteria: ['Intellectual Property Protection', 'Technology Differentiation', 'Product Innovation', 'Competitive Barriers', 'Proprietary Processes', 'Network Effects'],
          weights: [20, 25, 20, 15, 10, 10]
        },
        {
          name: 'Traction & Financial Feasibility',
          subcriteria: ['Revenue Growth', 'Customer Acquisition', 'Financial Projections', 'Unit Economics', 'Market Validation', 'Funding Efficiency'],
          weights: [25, 20, 15, 15, 15, 10]
        }
      ];
    } else {
      return [
        {
          name: 'Financial Performance',
          subcriteria: ['Revenue Growth', 'Profitability', 'Cash Flow', 'Financial Stability'],
          weights: [25, 25, 25, 25]
        },
        {
          name: 'Market Position',
          subcriteria: ['Market Share', 'Competitive Advantage', 'Brand Strength', 'Customer Base'],
          weights: [30, 25, 20, 25]
        },
        {
          name: 'Operational Excellence',
          subcriteria: ['Process Efficiency', 'Management Quality', 'Systems & Technology', 'Scalability'],
          weights: [25, 30, 20, 25]
        },
        {
          name: 'Growth Potential',
          subcriteria: ['Market Expansion', 'Product Innovation', 'Scalability', 'Value Creation'],
          weights: [25, 25, 25, 25]
        },
        {
          name: 'Risk Assessment',
          subcriteria: ['Market Risk', 'Operational Risk', 'Financial Risk', 'Competitive Risk'],
          weights: [25, 25, 25, 25]
        },
        {
          name: 'Strategic Timing',
          subcriteria: ['Market Timing', 'Investment Window', 'Competitive Position', 'Strategic Fit'],
          weights: [30, 25, 25, 20]
        },
        {
          name: 'Trust & Transparency',
          subcriteria: ['Governance Quality', 'Management Transparency', 'Stakeholder Relations', 'Compliance Standards'],
          weights: [30, 25, 20, 25]
        }
      ];
    }
  }

  private async analyzeCategoryWithIntelligence(
    category: any,
    industry: string,
    fundType: 'vc' | 'pe',
    companyData: any
  ): Promise<EnhancedAnalysisResult> {
    
    const subcriteria_results = [];
    let weightedScore = 0;
    let totalWeight = 0;
    let totalConfidence = 0;
    
    // Analyze each subcriteria using industry intelligence
    for (let i = 0; i < category.subcriteria.length; i++) {
      const subcriteriaName = category.subcriteria[i];
      const weight = category.weights[i];
      
      const analysis = industryIntelligenceService.getBaselineAnalysis(
        industry,
        subcriteriaName,
        fundType,
        companyData
      );
      
      subcriteria_results.push({
        name: subcriteriaName,
        score: analysis.score,
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        weight: weight,
        dataQuality: analysis.dataQuality,
        enhancementOpportunities: analysis.enhancementOpportunities,
        warningFlags: analysis.warningFlags
      });
      
      weightedScore += analysis.score * weight;
      totalWeight += weight;
      totalConfidence += analysis.confidence;
    }
    
    const overallScore = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 50;
    const avgConfidence = Math.round(totalConfidence / category.subcriteria.length);
    
    // Determine status based on score
    let status: 'excellent' | 'good' | 'moderate' | 'needs_improvement' | 'concerning';
    if (overallScore >= 80) status = 'excellent';
    else if (overallScore >= 70) status = 'good';
    else if (overallScore >= 60) status = 'moderate';
    else if (overallScore >= 50) status = 'needs_improvement';
    else status = 'concerning';
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(category.name, subcriteria_results, fundType);
    const dataGaps = this.identifyDataGaps(subcriteria_results);
    
    return {
      categoryName: category.name,
      overallScore,
      confidence: avgConfidence,
      status,
      subcriteria: subcriteria_results,
      recommendations,
      dataGaps
    };
  }

  private generateRecommendations(categoryName: string, subcriteria: any[], fundType: 'vc' | 'pe'): string[] {
    const recommendations: string[] = [];
    const lowScoring = subcriteria.filter(s => s.score < 60);
    const highPotential = subcriteria.filter(s => s.score >= 70 && s.enhancementOpportunities.length > 0);
    
    if (lowScoring.length > 0) {
      recommendations.push(`Address concerns in ${lowScoring.map(s => s.name).join(', ')} to strengthen ${categoryName}.`);
    }
    
    if (highPotential.length > 0) {
      recommendations.push(`Leverage strengths in ${highPotential.map(s => s.name).join(', ')} for competitive advantage.`);
    }
    
    // Category-specific recommendations
    switch (categoryName) {
      case 'Market Opportunity':
        if (subcriteria.find(s => s.name.includes('Market Size') && s.score < 60)) {
          recommendations.push('Consider market expansion strategies or identify adjacent markets to increase TAM.');
        }
        break;
      case 'Team & Leadership':
        if (subcriteria.find(s => s.name.includes('Experience') && s.score < 60)) {
          recommendations.push('Consider adding experienced advisors or team members with relevant domain expertise.');
        }
        break;
      case 'Financial Performance':
        if (subcriteria.find(s => s.name.includes('Revenue') && s.score < 60)) {
          recommendations.push('Focus on revenue growth strategies and diversification of revenue streams.');
        }
        break;
    }
    
    return recommendations;
  }

  private identifyDataGaps(subcriteria: any[]): string[] {
    const gaps: string[] = [];
    const lowConfidence = subcriteria.filter(s => s.confidence < 70);
    
    if (lowConfidence.length > 0) {
      gaps.push('Limited data available for comprehensive analysis');
      gaps.push('Consider uploading financial documents and market research');
      gaps.push('Add detailed company description and competitive positioning');
    }
    
    const baselineOnly = subcriteria.filter(s => s.dataQuality === 'baseline');
    if (baselineOnly.length > subcriteria.length * 0.7) {
      gaps.push('Analysis primarily based on industry baselines - document uploads would significantly improve accuracy');
    }
    
    return [...new Set(gaps)];
  }

  // Generate AI-powered memo content using enhanced analysis
  generateMemoContent(analysisResults: EnhancedAnalysisResult[], companyData: any): {
    executiveSummary: string;
    keyStrengths: string[];
    keyRisks: string[];
    recommendation: string;
    scoreBreakdown: Record<string, number>;
  } {
    const overallScore = Math.round(
      analysisResults.reduce((sum, result) => sum + result.overallScore, 0) / analysisResults.length
    );
    
    const strengths = analysisResults
      .filter(r => r.overallScore >= 70)
      .map(r => `Strong ${r.categoryName.toLowerCase()} with ${r.overallScore}% score`)
      .slice(0, 3);
    
    const risks = analysisResults
      .filter(r => r.overallScore < 60)
      .map(r => `${r.categoryName} concerns (${r.overallScore}% score)`)
      .slice(0, 3);
    
    let recommendation = 'Proceed with due diligence';
    if (overallScore >= 80) recommendation = 'Strongly recommend investment';
    else if (overallScore >= 70) recommendation = 'Recommend investment with standard diligence';
    else if (overallScore >= 60) recommendation = 'Proceed with enhanced due diligence';
    else if (overallScore >= 50) recommendation = 'High risk - extensive diligence required';
    else recommendation = 'Not recommended at current stage';
    
    const scoreBreakdown = analysisResults.reduce((breakdown, result) => {
      breakdown[result.categoryName] = result.overallScore;
      return breakdown;
    }, {} as Record<string, number>);
    
    return {
      executiveSummary: `${companyData.company_name || 'Company'} shows ${this.getScoreDescription(overallScore)} investment potential with an overall score of ${overallScore}%. Analysis based on industry intelligence and available company data.`,
      keyStrengths: strengths.length > 0 ? strengths : ['Industry baseline analysis completed'],
      keyRisks: risks.length > 0 ? risks : ['Limited data available for comprehensive assessment'],
      recommendation,
      scoreBreakdown
    };
  }

  private getScoreDescription(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'strong';
    if (score >= 60) return 'moderate';
    if (score >= 50) return 'limited';
    return 'poor';
  }
}

export const enhancedAnalysisEngine = new EnhancedAnalysisEngine();
export type { AnalysisRequest, EnhancedAnalysisResult };