import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔬 Enhanced PDF Generator: Starting PDF generation...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { memoId, dealId, fundId, memoContent, dealData } = await req.json();
    console.log('📋 Processing request for deal:', dealId, 'memo:', memoId);
    
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
      console.log('🔬 Calling Investment Committee Analysis Enhancer...');
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

    // Generate PDF using Puppeteer
    const pdfResult = await generateEnhancedPDF(memo, deal, fund, enhancedInsights);
    
    return new Response(JSON.stringify({ 
      success: true, 
      pdfUrl: pdfResult.url,
      fileName: pdfResult.fileName,
      metadata: {
        pages: pdfResult.pages || 1,
        size: 'A4',
        format: 'pdf',
        enhanced: !!enhancedInsights,
        generatedAt: new Date().toISOString()
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

async function generateEnhancedPDF(memo: any, deal: any, fund: any, enhancedInsights?: any): Promise<{ url: string; fileName: string; pages?: number }> {
  let browser;
  
  try {
    console.log('🚀 Launching Puppeteer browser...');
    
    // Launch browser with optimized settings for Deno Deploy
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-extensions',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      timeout: 30000
    });

    const page = await browser.newPage();
    
    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });

    // Generate HTML content
    const htmlContent = generateEnhancedHTMLContent(memo, deal, fund, enhancedInsights);
    
    console.log('📄 Setting page content...');
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('🖨️ Generating PDF...');
    
    // Generate PDF with professional formatting
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '0.75in',
        right: '0.75in',
        bottom: '0.75in',
        left: '0.75in'
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666; padding: 0 0.75in;">
          <div style="border-bottom: 1px solid #10b981; padding-bottom: 5px;">
            ${fund?.name || 'Investment Fund'} - Investment Committee Memorandum
          </div>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666; padding: 0 0.75in;">
          <div style="border-top: 1px solid #e5e7eb; padding-top: 5px;">
            <span style="float: left;">Confidential & Proprietary</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            <span style="float: right;">Generated by ReubenAI</span>
          </div>
        </div>
      `
    });

    // Convert buffer to base64
    const base64PDF = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));
    
    // Create descriptive filename
    const companyName = deal?.company_name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Company';
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `IC_Memo_${companyName}_${dateStr}.pdf`;
    
    console.log(`✅ PDF generated successfully: ${fileName} (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    
    return {
      url: `data:application/pdf;base64,${base64PDF}`,
      fileName: fileName,
      pages: await page.evaluate(() => window.print?.length || 1)
    };
    
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('🔒 Browser closed successfully');
      } catch (closeError) {
        console.warn('⚠️ Browser close warning:', closeError);
      }
    }
  }
}

function generateEnhancedHTMLContent(memo: any, deal: any, fund: any, enhancedInsights?: any): string {
  const sections = memo.memo_content?.sections || memo.memo_content || {};
  const company = deal?.company_name || 'Unknown Company';
  const fundName = fund?.name || 'Investment Fund';
  const analysisData = deal?.deal_analyses?.[0]?.analysis_data || {};
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Investment Committee Memorandum - ${company}</title>
    <style>
        @page {
            margin: 0;
            size: A4;
        }
        
        /* CSS variables for ReubenAI emerald + neutrals theme */
        :root {
          --reuben-emerald: #10b981;
          --reuben-emerald-light: #d1fae5;
          --reuben-emerald-dark: #047857;
          --reuben-gray-50: #f9fafb;
          --reuben-gray-100: #f3f4f6;
          --reuben-gray-200: #e5e7eb;
          --reuben-gray-300: #d1d5db;
          --reuben-gray-600: #4b5563;
          --reuben-gray-700: #374151;
          --reuben-gray-900: #111827;
        }
        
        * { 
          box-sizing: border-box; 
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: var(--reuben-gray-900);
          background: white;
          margin: 0;
          padding: 40px;
          font-size: 11px;
        }
        
        .header {
          border-bottom: 4px solid var(--reuben-emerald);
          padding: 30px 0 20px 0;
          margin-bottom: 30px;
          background: linear-gradient(135deg, var(--reuben-emerald-light) 0%, white 100%);
          padding: 30px;
          border-radius: 12px;
          page-break-after: avoid;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .company-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--reuben-emerald-dark);
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        
        .memo-subtitle {
          font-size: 16px;
          color: var(--reuben-gray-700);
          margin: 0 0 4px 0;
          font-weight: 600;
        }
        
        .fund-info {
          color: var(--reuben-gray-600);
          font-size: 13px;
          margin: 0;
        }
        
        .logo {
          font-size: 20px;
          font-weight: 800;
          color: var(--reuben-emerald);
          text-align: right;
        }
        
        .metadata-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin: 25px 0;
          padding: 25px;
          background: var(--reuben-gray-50);
          border-radius: 12px;
          border: 1px solid var(--reuben-gray-200);
        }
        
        .metadata-item h4 {
          margin: 0 0 6px 0;
          font-size: 10px;
          text-transform: uppercase;
          color: var(--reuben-gray-600);
          letter-spacing: 1px;
          font-weight: 700;
        }
        
        .metadata-item p {
          margin: 0;
          font-size: 14px;
          color: var(--reuben-gray-900);
          font-weight: 600;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status-exciting {
          background: var(--reuben-emerald-light);
          color: var(--reuben-emerald-dark);
          border: 2px solid var(--reuben-emerald);
        }
        
        .status-promising {
          background: #dbeafe;
          color: #1e40af;
          border: 2px solid #3b82f6;
        }
        
        .status-development {
          background: #fef3c7;
          color: #92400e;
          border: 2px solid #f59e0b;
        }
        
        .section {
          margin: 30px 0;
          padding: 25px;
          border: 1px solid var(--reuben-gray-200);
          border-radius: 12px;
          background: white;
          page-break-inside: avoid;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--reuben-emerald-dark);
          margin: 0 0 20px 0;
          padding-bottom: 12px;
          border-bottom: 3px solid var(--reuben-emerald-light);
        }
        
        .section-content {
          color: var(--reuben-gray-900);
          line-height: 1.8;
          font-size: 12px;
        }
        
        .section-content p {
          margin-bottom: 16px;
        }
        
        .executive-summary {
          background: linear-gradient(135deg, var(--reuben-emerald-light) 0%, white 100%);
          border-left: 6px solid var(--reuben-emerald);
          margin: 35px 0;
        }
        
        .recommendation-box {
          background: linear-gradient(135deg, var(--reuben-emerald-light) 0%, white 100%);
          border: 3px solid var(--reuben-emerald);
          border-radius: 12px;
          padding: 30px;
          margin: 30px 0;
          text-align: center;
          page-break-inside: avoid;
        }
        
        .recommendation-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--reuben-emerald-dark);
          margin: 0 0 15px 0;
        }
        
        .table-of-contents {
          background: white;
          border: 1px solid var(--reuben-gray-200);
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          page-break-after: avoid;
        }
        
        .toc-title {
          color: var(--reuben-emerald-dark);
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 20px 0;
          padding-bottom: 12px;
          border-bottom: 3px solid var(--reuben-emerald-light);
        }
        
        .toc-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .toc-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px dotted var(--reuben-gray-200);
          font-size: 12px;
        }
        
        .enhanced-insights {
          background: linear-gradient(135deg, #f0f9ff 0%, var(--reuben-emerald-light) 100%);
          border: 2px solid var(--reuben-emerald);
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          page-break-inside: avoid;
        }
        
        .enhanced-insights-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--reuben-emerald-dark);
          margin: 0 0 20px 0;
          display: flex;
          align-items: center;
        }
        
        .enhanced-insights-badge {
          background: var(--reuben-emerald);
          color: white;
          font-size: 9px;
          padding: 4px 10px;
          border-radius: 12px;
          margin-left: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        
        .enhanced-insights h3 {
          color: var(--reuben-emerald-dark);
          margin: 20px 0 12px 0;
          font-size: 14px;
          font-weight: 600;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 25px;
          border-top: 1px solid var(--reuben-gray-200);
          text-align: center;
          color: var(--reuben-gray-600);
          font-size: 10px;
          page-break-inside: avoid;
        }
        
        .disclaimer {
          background: #fff8e1;
          border: 2px solid #ffcc02;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          font-size: 10px;
          color: #8b5a00;
          line-height: 1.6;
        }
        
        .score-highlight {
          background: var(--reuben-emerald);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          display: inline-block;
          margin: 10px 0;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-content">
            <div>
                <div class="company-title">Investment Committee Memorandum</div>
                <div class="memo-subtitle">${company}</div>
                <div class="fund-info">${fundName} • ${currentDate}</div>
            </div>
            <div class="logo">ReubenAI</div>
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
            <p>${deal?.industry || 'Not Specified'}</p>
        </div>
        <div class="metadata-item">
            <h4>Deal Size</h4>
            <p>${deal?.deal_size ? `$${(deal.deal_size / 1000000).toFixed(1)}M` : 'TBD'}</p>
        </div>
        <div class="metadata-item">
            <h4>Valuation</h4>
            <p>${deal?.valuation ? `$${(deal.valuation / 1000000).toFixed(1)}M` : 'TBD'}</p>
        </div>
        <div class="metadata-item">
            <h4>Overall Score</h4>
            <p><span class="score-highlight">${deal?.overall_score || memo?.overall_score || 'TBD'}/100</span></p>
        </div>
        <div class="metadata-item">
            <h4>RAG Status</h4>
            <p><span class="status-badge status-${deal?.rag_status || 'development'}">${deal?.rag_status || 'In Review'}</span></p>
        </div>
    </div>

    <!-- Table of Contents -->
    <div class="table-of-contents">
        <h2 class="toc-title">Table of Contents</h2>
        <ul class="toc-list">
            <li class="toc-item"><span><strong>Executive Summary</strong></span><span>Page 1</span></li>
            ${enhancedInsights ? '<li class="toc-item"><span><strong>🔬 AI-Enhanced Analysis</strong></span><span>Page 2</span></li>' : ''}
            ${Object.keys(sections).map((key, index) => 
              `<li class="toc-item"><span>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span><span>Page ${index + (enhancedInsights ? 3 : 2)}</span></li>`
            ).join('')}
            <li class="toc-item"><span><strong>Investment Recommendation</strong></span><span>Final Page</span></li>
        </ul>
    </div>

    <!-- Executive Summary -->
    <div class="section executive-summary">
        <h2 class="section-title">Executive Summary</h2>
        <div class="section-content">
            ${memo.executive_summary || sections.executive_summary || `
                <p><strong>${company}</strong> represents a compelling investment opportunity in the ${deal?.industry || 'technology'} sector. This comprehensive analysis evaluates the company's strategic position, market dynamics, financial performance, and growth potential within the context of ${fundName}'s investment criteria.</p>
                
                <p>Key highlights include strong market positioning, experienced leadership team, and clear value creation opportunities. The investment aligns with our fund's strategic objectives and risk tolerance parameters.</p>
            `}
        </div>
    </div>

    <!-- Enhanced AI Analysis Section -->
    ${enhancedInsights ? `
      <div class="enhanced-insights">
        <h2 class="enhanced-insights-title">
          🔬 AI-Enhanced Investment Committee Analysis
          <span class="enhanced-insights-badge">AI ENHANCED</span>
        </h2>
        <div class="section-content">
          ${enhancedInsights.strategicInsights ? `
            <h3>Strategic Insights</h3>
            <p>${enhancedInsights.strategicInsights}</p>
          ` : ''}
          
          ${enhancedInsights.soWhatAnalysis ? `
            <h3>"So What?" Analysis</h3>
            <p>${enhancedInsights.soWhatAnalysis}</p>
          ` : ''}
          
          ${enhancedInsights.comparativeAnalysis ? `
            <h3>Comparative Portfolio Analysis</h3>
            <p>${enhancedInsights.comparativeAnalysis}</p>
          ` : ''}
          
          ${enhancedInsights.riskAdjustedReturns ? `
            <h3>Risk-Adjusted Return Projections</h3>
            <p>${enhancedInsights.riskAdjustedReturns}</p>
          ` : ''}
          
          ${enhancedInsights.scenarioAnalysis ? `
            <h3>Scenario Analysis</h3>
            <p>${enhancedInsights.scenarioAnalysis}</p>
          ` : ''}
          
          ${enhancedInsights.confidence_score ? `
            <h3>AI Confidence Assessment</h3>
            <p>Overall Analysis Confidence: <span class="score-highlight">${enhancedInsights.confidence_score}%</span></p>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Standard Memo Sections -->
    ${Object.entries(sections).map(([key, content]) => `
      <div class="section">
        <h2 class="section-title">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
        <div class="section-content">
          ${typeof content === 'string' ? content : JSON.stringify(content)}
        </div>
      </div>
    `).join('')}

    <!-- Investment Recommendation -->
    <div class="recommendation-box">
        <h2 class="recommendation-title">Investment Recommendation</h2>
        <div class="section-content">
            ${memo?.investment_recommendation || sections?.recommendation || `
                <p><strong>Recommendation:</strong> Proceed with detailed due diligence and term sheet negotiation.</p>
                
                <p>Based on our comprehensive analysis, ${company} demonstrates strong fundamentals and strategic alignment with ${fundName}'s investment thesis. The opportunity presents favorable risk-adjusted returns with clear value creation pathways.</p>
                
                <p><strong>Next Steps:</strong> Initiate formal due diligence process, engage management team, and prepare preliminary term sheet for IC consideration.</p>
            `}
        </div>
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
        <strong>CONFIDENTIAL AND PROPRIETARY:</strong> This investment memorandum contains confidential and proprietary information prepared exclusively for ${fundName}. The analysis and recommendations herein are based on information available as of ${currentDate} and are subject to change. This document does not constitute an offer to sell or solicitation to buy any securities. Distribution is strictly limited to authorized personnel.
    </div>

    <!-- Footer -->
    <div class="footer">
        <div class="logo" style="margin-bottom: 10px;">ReubenAI</div>
        <p>Generated on ${currentDate} • ${fundName} • Confidential & Proprietary</p>
    </div>
</body>
</html>
  `;
}