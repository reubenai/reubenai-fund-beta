import { supabase } from '@/integrations/supabase/client';

interface NotesDocumentAnalysisService {
  extractNotesIntelligence: (dealId: string) => Promise<any>;
  analyzeDocumentContent: (dealId: string) => Promise<any>;
  integrateWithAnalysis: (dealId: string, notesData: any, documentData: any) => Promise<void>;
}

class NotesDocumentAnalysisIntegration implements NotesDocumentAnalysisService {
  async extractNotesIntelligence(dealId: string) {
    try {
      // Get all notes for the deal
      const { data: notes, error } = await supabase
        .from('deal_notes')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!notes || notes.length === 0) {
        return {
          sentiment: 'neutral',
          key_insights: [],
          risk_flags: [],
          trend_indicators: [],
          confidence_level: 0,
          last_analyzed: new Date().toISOString()
        };
      }

      // Calculate sentiment distribution
      const sentimentCounts = notes.reduce((acc, note) => {
        acc[note.sentiment || 'neutral']++;
        return acc;
      }, { positive: 0, neutral: 0, negative: 0 });

      const totalNotes = notes.length;
      const overallSentiment = this.calculateOverallSentiment(sentimentCounts, totalNotes);

      // Extract key insights from notes content
      const keyInsights = notes
        .filter(note => note.content && note.content.length > 50)
        .slice(0, 10) // Top 10 most recent substantial notes
        .map(note => note.content.substring(0, 200) + (note.content.length > 200 ? '...' : ''));

      // Identify risk flags from negative sentiment notes
      const riskFlags = notes
        .filter(note => note.sentiment === 'negative')
        .map(note => note.content.substring(0, 150) + (note.content.length > 150 ? '...' : ''))
        .slice(0, 5);

      // Extract trend indicators from tags
      const allTags = notes.flatMap(note => note.tags || []);
      const tagFrequency = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const trendIndicators = Object.entries(tagFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([tag]) => tag);

      return {
        sentiment: overallSentiment,
        key_insights: keyInsights,
        risk_flags: riskFlags,
        trend_indicators: trendIndicators,
        confidence_level: Math.min(85, Math.max(50, totalNotes * 10)),
        last_analyzed: new Date().toISOString(),
        notes_count: totalNotes,
        sentiment_distribution: sentimentCounts
      };
    } catch (error) {
      console.error('Error extracting notes intelligence:', error);
      return {
        sentiment: 'neutral',
        key_insights: ['Error analyzing notes'],
        risk_flags: [],
        trend_indicators: [],
        confidence_level: 0,
        last_analyzed: new Date().toISOString()
      };
    }
  }

  async analyzeDocumentContent(dealId: string) {
    try {
      // Get all documents for the deal
      const { data: documents, error } = await supabase
        .from('deal_documents')
        .select('*')
        .eq('deal_id', dealId)
        .eq('parsing_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!documents || documents.length === 0) {
        return {
          document_count: 0,
          content_analysis: {},
          key_data_points: [],
          financial_metrics: {},
          team_information: {},
          product_details: {},
          last_processed: new Date().toISOString()
        };
      }

      // Analyze document content by type
      const contentAnalysis = this.analyzeDocumentsByType(documents);
      
      // Extract key data points from parsed data
      const keyDataPoints = this.extractKeyDataPoints(documents);

      // Extract financial metrics
      const financialMetrics = this.extractFinancialMetrics(documents);

      // Extract team information
      const teamInformation = this.extractTeamInformation(documents);

      // Extract product details
      const productDetails = this.extractProductDetails(documents);

      return {
        document_count: documents.length,
        content_analysis: contentAnalysis,
        key_data_points: keyDataPoints,
        financial_metrics: financialMetrics,
        team_information: teamInformation,
        product_details: productDetails,
        last_processed: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing document content:', error);
      return {
        document_count: 0,
        content_analysis: {},
        key_data_points: ['Error analyzing documents'],
        financial_metrics: {},
        team_information: {},
        product_details: {},
        last_processed: new Date().toISOString()
      };
    }
  }

  async integrateWithAnalysis(dealId: string, notesData: any, documentData: any) {
    try {
      // Combine notes and document intelligence
      const combinedIntelligence = {
        notes_intelligence: notesData,
        document_intelligence: documentData,
        integration_timestamp: new Date().toISOString(),
        overall_confidence: this.calculateOverallConfidence(notesData, documentData)
      };

      // Update the deal's enhanced_analysis with integrated data
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select('enhanced_analysis')
        .eq('id', dealId)
        .single();

      if (dealError) throw dealError;

      const updatedAnalysis = {
        ...(deal.enhanced_analysis as Record<string, any> || {}),
        notes_document_integration: combinedIntelligence,
        last_integration_update: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('deals')
        .update({ enhanced_analysis: updatedAnalysis })
        .eq('id', dealId);

      if (updateError) throw updateError;

      console.log('Successfully integrated notes and document analysis for deal:', dealId);
    } catch (error) {
      console.error('Error integrating notes and document analysis:', error);
      throw error;
    }
  }

  private calculateOverallSentiment(sentimentCounts: Record<string, number>, total: number): string {
    const positiveRatio = sentimentCounts.positive / total;
    const negativeRatio = sentimentCounts.negative / total;

    if (positiveRatio > 0.6) return 'positive';
    if (negativeRatio > 0.4) return 'negative';
    if (positiveRatio > negativeRatio * 1.5) return 'positive';
    if (negativeRatio > positiveRatio * 1.5) return 'negative';
    return 'mixed';
  }

  private analyzeDocumentsByType(documents: any[]) {
    const typeAnalysis: Record<string, any> = {};

    documents.forEach(doc => {
      const type = doc.document_type || 'other';
      if (!typeAnalysis[type]) {
        typeAnalysis[type] = {
          count: 0,
          total_size: 0,
          latest_upload: null,
          content_summary: []
        };
      }

      typeAnalysis[type].count++;
      typeAnalysis[type].total_size += doc.file_size || 0;
      
      if (!typeAnalysis[type].latest_upload || new Date(doc.created_at) > new Date(typeAnalysis[type].latest_upload)) {
        typeAnalysis[type].latest_upload = doc.created_at;
      }

      if (doc.extracted_text && doc.extracted_text.length > 100) {
        typeAnalysis[type].content_summary.push(
          doc.extracted_text.substring(0, 200) + (doc.extracted_text.length > 200 ? '...' : '')
        );
      }
    });

    return typeAnalysis;
  }

  private extractKeyDataPoints(documents: any[]): string[] {
    const dataPoints: string[] = [];

    documents.forEach(doc => {
      if (doc.parsed_data && typeof doc.parsed_data === 'object') {
        // Extract meaningful data points from parsed data
        Object.entries(doc.parsed_data).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.length > 20 && value.length < 200) {
            dataPoints.push(`${key}: ${value}`);
          }
        });
      }

      // Extract from text content
      if (doc.extracted_text) {
        const text = doc.extracted_text;
        
        // Look for financial figures
        const financialMatches = text.match(/\$[\d,]+(?:\.?\d+)?[KMB]?/g);
        if (financialMatches) {
          financialMatches.slice(0, 3).forEach(match => {
            dataPoints.push(`Financial figure: ${match}`);
          });
        }

        // Look for percentages
        const percentageMatches = text.match(/\d+\.?\d*%/g);
        if (percentageMatches) {
          percentageMatches.slice(0, 3).forEach(match => {
            dataPoints.push(`Percentage: ${match}`);
          });
        }
      }
    });

    return dataPoints.slice(0, 20); // Return top 20 data points
  }

  private extractFinancialMetrics(documents: any[]) {
    const metrics: Record<string, any> = {};

    documents.forEach(doc => {
      if (doc.document_type === 'financial' || doc.document_type === 'pitch_deck') {
        if (doc.parsed_data?.financial_data) {
          Object.assign(metrics, doc.parsed_data.financial_data);
        }

        // Extract from text
        if (doc.extracted_text) {
          const text = doc.extracted_text.toLowerCase();
          
          // Revenue patterns
          const revenueMatch = text.match(/revenue[:\s]+\$?([\d,]+(?:\.?\d+)?[kmb]?)/i);
          if (revenueMatch) metrics.revenue = revenueMatch[1];

          // Valuation patterns
          const valuationMatch = text.match(/valuation[:\s]+\$?([\d,]+(?:\.?\d+)?[kmb]?)/i);
          if (valuationMatch) metrics.valuation = valuationMatch[1];

          // Growth patterns
          const growthMatch = text.match(/growth[:\s]+([\d,]+(?:\.?\d+)?%)/i);
          if (growthMatch) metrics.growth = growthMatch[1];
        }
      }
    });

    return metrics;
  }

  private extractTeamInformation(documents: any[]) {
    const teamInfo: Record<string, any> = {};

    documents.forEach(doc => {
      if (doc.document_type === 'team' || doc.document_type === 'pitch_deck') {
        if (doc.parsed_data?.team_data) {
          Object.assign(teamInfo, doc.parsed_data.team_data);
        }

        // Extract founder information from text
        if (doc.extracted_text) {
          const text = doc.extracted_text;
          
          // Look for founder mentions
          const founderMatches = text.match(/(?:founder|ceo|cto|cmo)[:\s]+([^\n\r.]{10,100})/gi);
          if (founderMatches) {
            teamInfo.founders = founderMatches.slice(0, 5);
          }

          // Look for team size
          const teamSizeMatch = text.match(/team[:\s]+(\d+)[:\s]*(?:people|members|employees)/i);
          if (teamSizeMatch) teamInfo.team_size = teamSizeMatch[1];
        }
      }
    });

    return teamInfo;
  }

  private extractProductDetails(documents: any[]) {
    const productInfo: Record<string, any> = {};

    documents.forEach(doc => {
      if (doc.document_type === 'product' || doc.document_type === 'pitch_deck') {
        if (doc.parsed_data?.product_data) {
          Object.assign(productInfo, doc.parsed_data.product_data);
        }

        // Extract product information from text
        if (doc.extracted_text) {
          const text = doc.extracted_text;
          
          // Look for product descriptions
          const productMatches = text.match(/(?:product|platform|solution)[:\s]+([^\n\r.]{20,200})/gi);
          if (productMatches) {
            productInfo.descriptions = productMatches.slice(0, 3);
          }

          // Look for technology stack
          const techMatches = text.match(/(?:technology|tech stack|built with)[:\s]+([^\n\r.]{10,100})/gi);
          if (techMatches) {
            productInfo.technology = techMatches.slice(0, 3);
          }
        }
      }
    });

    return productInfo;
  }

  private calculateOverallConfidence(notesData: any, documentData: any): number {
    const notesConfidence = notesData.confidence_level || 0;
    const documentsConfidence = Math.min(85, documentData.document_count * 15);
    
    return Math.round((notesConfidence + documentsConfidence) / 2);
  }

  // Public method to run full integration for a deal
  async runFullIntegration(dealId: string) {
    try {
      console.log('Running full notes and document integration for deal:', dealId);
      
      const [notesData, documentData] = await Promise.all([
        this.extractNotesIntelligence(dealId),
        this.analyzeDocumentContent(dealId)
      ]);

      await this.integrateWithAnalysis(dealId, notesData, documentData);

      return {
        success: true,
        notes_intelligence: notesData,
        document_intelligence: documentData
      };
    } catch (error) {
      console.error('Full integration failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const notesDocumentAnalysisService = new NotesDocumentAnalysisIntegration();