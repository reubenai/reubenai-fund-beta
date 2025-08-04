import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { memoId, dealId, fundId, memoContent, dealData } = await req.json();
    console.log('🔬 Enhanced PDF Generator: Processing request for deal:', dealId);
    
    if (!dealId && !memoId) {
      throw new Error('Either dealId or memoId is required');
    }

    let memo: any;
    let deal: any;
    let fund: any;

    if (memoId) {
      // Fetch memo with related data
      const { data: memoData, error: memoError } = await supabase
        .from('ic_memos')
        .select(`
          *,
          deals (
            *,
            deal_analyses (
              id,
              analysis_data,
              overall_score,
              rag_status,
              created_at
            )
          ),
          funds (
            name,
            fund_type,
            investment_strategies (
              enhanced_criteria,
              strategy_notes
            )
          )
        `)
        .eq('id', memoId)
        .single();

      if (memoError || !memoData) {
        throw new Error('Memo not found');
      }

      memo = memoData;
      deal = memoData.deals;
      fund = memoData.funds;
    } else {
      // Use provided data
      memo = { memo_content: memoContent };
      deal = dealData;
      
      const { data: fundData } = await supabase
        .from('funds')
        .select(`
          name, 
          fund_type,
          investment_strategies (
            enhanced_criteria,
            strategy_notes
          )
        `)
        .eq('id', fundId)
        .single();
      
      fund = fundData;
    }

    // Call enhanced IC Analysis Enhancer for deeper insights
    let enhancedInsights = null;
    try {
      console.log('🔬 Calling Investment Committee Analysis Enhancer for deeper insights...');
      const { data: enhancedData } = await supabase.functions.invoke('investment-committee-analysis-enhancer', {
        body: {
          dealId,
          fundId,
          existingMemo: memo,
          dealData: deal,
          fundData: fund
        }
      });
      
      if (enhancedData?.success) {
        enhancedInsights = enhancedData.enhancedAnalysis;
        console.log('✅ Enhanced insights generated successfully');
      }
    } catch (error) {
      console.warn('⚠️ Enhanced analysis failed, continuing with standard memo:', error);
    }

    // Call generateEnhancedPDF to create the PDF content with enhanced insights
    const pdfResult = await generateEnhancedPDF(memo, deal, fund, enhancedInsights);
    
    return new Response(JSON.stringify({ 
      success: true, 
      pdfUrl: pdfResult.url,
      fileName: pdfResult.fileName,
      metadata: {
        pages: 1,
        size: 'A4',
        format: 'pdf',
        enhanced: !!enhancedInsights
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Enhanced PDF Generator Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateEnhancedPDF(memo: any, deal: any, fund: any, enhancedInsights?: any): Promise<{ url: string; fileName: string }> {
  try {
    const htmlContent = generateEnhancedHTMLContent(memo, deal, fund, enhancedInsights);
    
    // Create a proper PDF file name
    const fileName = `IC_Memo_${deal?.company_name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    
    // For now, return as HTML with enhanced styling for PDF-like appearance
    // In production, this would integrate with a PDF service like Puppeteer
    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(htmlContent);
    const base64Html = btoa(String.fromCharCode(...htmlBytes));
    
    return {
      url: `data:text/html;base64,${base64Html}`,
      fileName
    };
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
}

function generateEnhancedHTMLContent(memo: any, deal: any, fund: any, enhancedInsights?: any): string {
  const sections = memo.memo_content?.sections || memo.memo_content || {};
  const company = deal?.company_name || 'Unknown Company';
  const fundName = fund?.name || 'Investment Fund';
  const analysisData = deal?.deal_analyses?.[0]?.analysis_data || {};
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Investment Committee Memorandum - ${company}</title>
    <style>
        @page {
            margin: 0.75in;
            size: letter;
            @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 10px;
                color: #666;
            }
        }
        
        /* CSS variables for ReubenAI emerald + neutrals theme */
        :root {
          --reuben-emerald: #10b981; /* Main emerald brand color */
          --reuben-emerald-light: #d1fae5; /* Light emerald */
          --reuben-emerald-dark: #047857; /* Dark emerald */
          --reuben-gray-50: #f9fafb;
          --reuben-gray-100: #f3f4f6;
          --reuben-gray-200: #e5e7eb;
          --reuben-gray-300: #d1d5db;
          --reuben-gray-600: #4b5563;
          --reuben-gray-700: #374151;
          --reuben-gray-900: #111827;
        }
        
        * { box-sizing: border-box; }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: var(--reuben-gray-900);
          background: white;
          margin: 0;
          padding: 40px;
          font-size: 12px;
        }
        
        .header {
          border-bottom: 3px solid var(--reuben-emerald);
          padding-bottom: 20px;
          margin-bottom: 30px;
          background: linear-gradient(135deg, var(--reuben-emerald-light) 0%, white 100%);
          padding: 20px;
          border-radius: 8px;
        }
        
        .company-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--reuben-emerald-dark);
          margin: 0 0 8px 0;
        }
        
        .fund-info {
          color: var(--reuben-gray-600);
          font-size: 14px;
          margin: 0;
        }
        
        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 20px 0;
          padding: 20px;
          background: var(--reuben-gray-50);
          border-radius: 8px;
          border: 1px solid var(--reuben-gray-200);
        }
        
        .metadata-item h4 {
          margin: 0 0 4px 0;
          font-size: 11px;
          text-transform: uppercase;
          color: var(--reuben-gray-600);
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        
        .metadata-item p {
          margin: 0;
          font-size: 13px;
          color: var(--reuben-gray-900);
          font-weight: 500;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-exciting {
          background: var(--reuben-emerald-light);
          color: var(--reuben-emerald-dark);
          border: 1px solid var(--reuben-emerald);
        }
        
        .status-promising {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
        }
        
        .status-development {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
        }
        
        .section {
          margin: 25px 0;
          padding: 20px;
          border: 1px solid var(--reuben-gray-200);
          border-radius: 8px;
          background: white;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--reuben-emerald-dark);
          margin: 0 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--reuben-emerald-light);
        }
        
        .section-content {
          color: var(--reuben-gray-900);
          line-height: 1.7;
        }
        
        .executive-summary {
          background: linear-gradient(135deg, var(--reuben-emerald-light) 0%, white 100%);
          border-left: 4px solid var(--reuben-emerald);
          margin: 30px 0;
        }
        
        .recommendation-box {
          background: linear-gradient(135deg, var(--reuben-emerald-light) 0%, white 100%);
          border: 2px solid var(--reuben-emerald);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        
        .recommendation-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--reuben-emerald-dark);
          margin: 0 0 10px 0;
        }
        
        .table-of-contents {
          background: white;
          border: 1px solid var(--reuben-gray-200);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .toc-title {
          color: var(--reuben-emerald-dark);
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--reuben-emerald-light);
        }
        
        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .toc-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px dotted var(--reuben-gray-200);
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid var(--reuben-gray-200);
          text-align: center;
          color: var(--reuben-gray-600);
          font-size: 10px;
        }
        
        .logo {
          font-size: 18px;
          font-weight: 700;
          color: var(--reuben-emerald);
          margin-bottom: 5px;
        }
        
        .enhanced-insights {
          background: var(--reuben-gray-50);
          border: 1px solid var(--reuben-gray-200);
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .enhanced-insights-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--reuben-emerald-dark);
          margin: 0 0 15px 0;
          display: flex;
          align-items: center;
        }
        
        .enhanced-insights-badge {
          background: var(--reuben-emerald);
          color: white;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 12px;
          margin-left: 10px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div style="display: flex; justify-content: between; align-items: center;">
            <div>
                <div class="company-title">Investment Committee Memorandum</div>
                <div class="fund-info">${company} • ${fundName}</div>
            </div>
            <div class="logo" style="margin-left: auto;">ReubenAI</div>
        </div>
    </div>

    <!-- Deal Metadata -->
    <div class="metadata-grid">
        <div class="metadata-item">
            <h4>Company</h4>
            <p>${company}</p>
        </div>
        <div class="metadata-item">
            <h4>Industry</h4>
            <p>${deal?.industry || 'N/A'}</p>
        </div>
        <div class="metadata-item">
            <h4>Deal Size</h4>
            <p>${deal?.deal_size ? `$${(deal.deal_size / 1000000).toFixed(1)}M` : 'N/A'}</p>
        </div>
        <div class="metadata-item">
            <h4>Valuation</h4>
            <p>${deal?.valuation ? `$${(deal.valuation / 1000000).toFixed(1)}M` : 'N/A'}</p>
        </div>
        <div class="metadata-item">
            <h4>Overall Score</h4>
            <p>${deal?.overall_score || 'N/A'}/100</p>
        </div>
        <div class="metadata-item">
            <h4>RAG Status</h4>
            <p><span class="status-badge status-${deal?.rag_status || 'development'}">${deal?.rag_status || 'N/A'}</span></p>
        </div>
    </div>

    <!-- Table of Contents -->
    <div class="table-of-contents">
        <h2 class="toc-title">Table of Contents</h2>
        <ul class="toc-list">
            <li class="toc-item"><span>Executive Summary</span><span>1</span></li>
            ${Object.keys(sections).map((key, index) => 
              `<li class="toc-item"><span>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span><span>${index + 2}</span></li>`
            ).join('')}
            <li class="toc-item"><span>Investment Recommendation</span><span>${Object.keys(sections).length + 2}</span></li>
        </ul>
    </div>

    <!-- Executive Summary -->
    <div class="section executive-summary">
        <h2 class="section-title">Executive Summary</h2>
        <div class="section-content">
            ${memo.executive_summary || sections.executive_summary || 'Executive summary provides a high-level overview of the investment opportunity, highlighting key strengths, considerations, and strategic alignment with fund investment criteria.'}
        </div>
    </div>

    <!-- Enhanced AI Analysis Section -->
    ${enhancedInsights ? `
      <div class="enhanced-insights">
        <h2 class="enhanced-insights-title">
          🔬 Enhanced Investment Committee Analysis
          <span class="enhanced-insights-badge">AI ENHANCED</span>
        </h2>
        <div class="section-content">
          ${enhancedInsights.strategicInsights ? `
            <h3 style="color: var(--reuben-emerald-dark); margin: 15px 0 10px 0; font-size: 14px;">Strategic Insights</h3>
            <p>${enhancedInsights.strategicInsights}</p>
          ` : ''}
          
          ${enhancedInsights.soWhatAnalysis ? `
            <h3 style="color: var(--reuben-emerald-dark); margin: 15px 0 10px 0; font-size: 14px;">"So What?" Analysis</h3>
            <p>${enhancedInsights.soWhatAnalysis}</p>
          ` : ''}
          
          ${enhancedInsights.comparativeAnalysis ? `
            <h3 style="color: var(--reuben-emerald-dark); margin: 15px 0 10px 0; font-size: 14px;">Comparative Portfolio Analysis</h3>
            <p>${enhancedInsights.comparativeAnalysis}</p>
          ` : ''}
          
          ${enhancedInsights.riskAdjustedReturns ? `
            <h3 style="color: var(--reuben-emerald-dark); margin: 15px 0 10px 0; font-size: 14px;">Risk-Adjusted Return Projections</h3>
            <p>${enhancedInsights.riskAdjustedReturns}</p>
          ` : ''}
          
          ${enhancedInsights.scenarioAnalysis ? `
            <h3 style="color: var(--reuben-emerald-dark); margin: 15px 0 10px 0; font-size: 14px;">Scenario Analysis</h3>
            <p>${enhancedInsights.scenarioAnalysis}</p>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Memo Sections -->
    ${Object.entries(sections).map(([key, content]) => `
    <div class="section">
        <h2 class="section-title">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
        <div class="section-content">
            ${content || `This section provides detailed analysis of ${key.replace(/_/g, ' ').toLowerCase()}, including key insights and strategic considerations relevant to the investment decision.`}
        </div>
    </div>
    `).join('')}

    <!-- Investment Recommendation -->
    <div class="recommendation-box">
        <h2 class="recommendation-title">Investment Recommendation</h2>
        <div class="section-content">
            ${memo.investment_recommendation || sections.investment_recommendation || 'Investment recommendation provides the committee with a clear recommendation based on comprehensive analysis of the opportunity, including rationale and next steps.'}
        </div>
    </div>
      
    <!-- Standard AI Analysis Section -->
    ${Object.keys(memo.memo_content || {}).length > 0 ? `
      <div class="section">
        <h2 class="section-title">AI Analysis Summary</h2>
        <div class="section-content">
          <p><strong>Analysis Confidence:</strong> ${memo.overall_score || 'N/A'}/100</p>
          <p><strong>RAG Status:</strong> ${memo.rag_status || 'Under Review'}</p>
          <p><strong>Data Quality Score:</strong> ${memo.content_quality_score || 'N/A'}/100</p>
          ${memo.generation_metadata?.insights ? `
            <p><strong>Key AI Insights:</strong></p>
            <ul>
              ${memo.generation_metadata.insights.map((insight: string) => `<li>${insight}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
        <div class="logo">ReubenAI Investment Platform</div>
        <p>Confidential and Proprietary • Investment Committee Use Only</p>
        <p style="margin-top: 10px; font-size: 9px; opacity: 0.7;">
            Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} • © ${new Date().getFullYear()} ReubenAI. Enhanced AI Analysis Technology.
        </p>
    </div>
</body>
</html>`;
}