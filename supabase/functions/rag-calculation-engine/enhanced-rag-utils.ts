// Enhanced RAG Calculation Utilities
// Routes through enhanced-deal-analysis for consistency

export async function calculateRAGFromAnalysis(analysisData: any): Promise<any> {
  if (!analysisData) {
    return {
      status: 'AMBER',
      confidence: 50,
      reasoning: 'Insufficient analysis data available',
      factors: ['Limited data'],
      recommendations: ['Conduct comprehensive analysis'],
      risk_level: 'MEDIUM'
    };
  }

  const overallScore = analysisData.overall_score || 60;
  const confidence = analysisData.confidence_scores?.overall || 60;
  
  let status: 'RED' | 'AMBER' | 'GREEN';
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  
  if (overallScore >= 85 && confidence >= 80) {
    status = 'GREEN';
    riskLevel = 'LOW';
  } else if (overallScore >= 70 && confidence >= 60) {
    status = 'AMBER';
    riskLevel = 'MEDIUM';
  } else {
    status = 'RED';
    riskLevel = 'HIGH';
  }
  
  return {
    status,
    confidence,
    reasoning: `Based on enhanced analysis with overall score of ${overallScore} and confidence of ${confidence}%`,
    factors: [
      `Overall Score: ${overallScore}`,
      `Analysis Confidence: ${confidence}%`,
      `Market Score: ${analysisData.market_score || 'N/A'}`,
      `Financial Score: ${analysisData.financial_score || 'N/A'}`
    ],
    recommendations: generateRecommendationsFromAnalysis(status, analysisData),
    risk_level: riskLevel
  };
}

function generateRecommendationsFromAnalysis(status: string, analysisData: any): string[] {
  const recommendations: string[] = [];
  
  if (status === 'GREEN') {
    recommendations.push('Proceed with due diligence');
    recommendations.push('Schedule investment committee presentation');
  } else if (status === 'AMBER') {
    recommendations.push('Conduct additional analysis');
    recommendations.push('Address identified concerns');
  } else {
    recommendations.push('Consider passing on opportunity');
    recommendations.push('Document learnings for future reference');
  }
  
  // Add specific recommendations based on analysis gaps
  if (analysisData.market_score < 70) {
    recommendations.push('Validate market opportunity assumptions');
  }
  if (analysisData.financial_score < 70) {
    recommendations.push('Review financial projections and unit economics');
  }
  if (analysisData.leadership_score < 70) {
    recommendations.push('Conduct deeper management team assessment');
  }
  
  return recommendations;
}