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
    console.log('Enhanced PDF Export Request:', { 
      memoId, 
      dealId, 
      fundId, 
      hasMemoContent: !!memoContent, 
      hasDealData: !!dealData 
    });
    
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

    // Generate enhanced PDF with better performance
    const pdfContent = await generateEnhancedPDF(memo, deal, fund);

    return new Response(JSON.stringify({
      success: true,
      pdfUrl: pdfContent.url,
      fileName: pdfContent.fileName,
      metadata: {
        company: deal?.company_name,
        generatedAt: new Date().toISOString(),
        version: '2.0'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhanced-pdf-generator:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateEnhancedPDF(memo: any, deal: any, fund: any): Promise<{ url: string; fileName: string }> {
  const htmlContent = generateEnhancedHTMLContent(memo, deal, fund);
  
  // Convert HTML to blob for better handling
  const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
  const base64Html = btoa(htmlContent);
  
  const fileName = `IC_Memo_${deal?.company_name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
  
  return {
    url: `data:text/html;base64,${base64Html}`,
    fileName
  };
}

function generateEnhancedHTMLContent(memo: any, deal: any, fund: any): string {
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
        
        * { box-sizing: border-box; }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }
        
        .header {
            background: linear-gradient(135deg, hsl(217, 91%, 60%) 0%, hsl(217, 91%, 45%) 100%);
            color: white;
            padding: 2rem;
            text-align: center;
            position: relative;
            margin-bottom: 2rem;
        }
        
        .header h1 {
            margin: 0;
            font-size: 2.2rem;
            font-weight: 300;
            letter-spacing: -0.5px;
        }
        
        .header .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            margin-top: 0.5rem;
            font-weight: 300;
        }
        
        .header .logo {
            position: absolute;
            top: 2rem;
            right: 2rem;
            font-size: 1.2rem;
            font-weight: 600;
            opacity: 0.8;
        }
        
        .memo-meta {
            background: linear-gradient(135deg, hsl(220, 14%, 96%) 0%, hsl(220, 14%, 98%) 100%);
            padding: 1.5rem;
            border-left: 4px solid hsl(217, 91%, 60%);
            margin-bottom: 2rem;
            border-radius: 0 8px 8px 0;
        }
        
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }
        
        .meta-item {
            display: flex;
            flex-direction: column;
        }
        
        .meta-label {
            font-weight: 600;
            color: hsl(217, 32%, 35%);
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
        }
        
        .meta-value {
            color: hsl(217, 32%, 17%);
            font-size: 1rem;
        }
        
        .executive-summary {
            background: linear-gradient(135deg, hsl(217, 91%, 97%) 0%, white 100%);
            border: 2px solid hsl(217, 91%, 60%);
            padding: 2rem;
            margin: 2rem 0;
            border-radius: 12px;
        }
        
        .executive-summary h2 {
            color: hsl(217, 91%, 45%);
            margin-top: 0;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }
        
        .metric-card {
            background: white;
            padding: 1.2rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid hsl(217, 32%, 89%);
            box-shadow: 0 2px 4px hsla(217, 32%, 17%, 0.05);
        }
        
        .metric-value {
            font-size: 1.8rem;
            font-weight: 600;
            color: hsl(217, 91%, 60%);
            margin-bottom: 0.25rem;
        }
        
        .metric-label {
            color: hsl(217, 32%, 53%);
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .section {
            margin-bottom: 2.5rem;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: hsl(217, 91%, 45%);
            border-bottom: 2px solid hsl(217, 91%, 60%);
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
            font-size: 1.4rem;
            font-weight: 500;
        }
        
        .section h3 {
            color: hsl(217, 32%, 35%);
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            font-size: 1.1rem;
        }
        
        .section-content {
            line-height: 1.7;
            color: hsl(217, 32%, 17%);
        }
        
        .rag-status {
            display: inline-block;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.5px;
        }
        
        .rag-green { 
            background: hsl(142, 69%, 85%); 
            color: hsl(142, 69%, 25%); 
            border: 1px solid hsl(142, 69%, 65%);
        }
        .rag-amber { 
            background: hsl(45, 100%, 85%); 
            color: hsl(45, 100%, 25%); 
            border: 1px solid hsl(45, 100%, 65%);
        }
        .rag-red { 
            background: hsl(0, 65%, 85%); 
            color: hsl(0, 65%, 25%); 
            border: 1px solid hsl(0, 65%, 65%);
        }
        
        .recommendation {
            background: linear-gradient(135deg, hsl(217, 91%, 97%) 0%, hsl(142, 69%, 97%) 100%);
            border: 2px solid hsl(217, 91%, 60%);
            padding: 2rem;
            margin: 2rem 0;
            text-align: center;
            border-radius: 12px;
        }
        
        .recommendation h2 {
            color: hsl(217, 91%, 45%);
            margin-top: 0;
            margin-bottom: 1rem;
        }
        
        .analysis-insights {
            background: hsl(220, 14%, 98%);
            border-left: 4px solid hsl(217, 91%, 60%);
            padding: 1.5rem;
            margin: 1.5rem 0;
            border-radius: 0 8px 8px 0;
        }
        
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .insight-item {
            background: white;
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid hsl(217, 32%, 89%);
        }
        
        .insight-label {
            font-weight: 600;
            color: hsl(217, 32%, 35%);
            font-size: 0.9rem;
            margin-bottom: 0.5rem;
        }
        
        .insight-value {
            color: hsl(217, 32%, 17%);
        }
        
        .footer {
            background: hsl(217, 91%, 60%);
            color: white;
            padding: 1.5rem;
            text-align: center;
            font-size: 0.9rem;
            margin-top: 3rem;
            border-radius: 8px;
        }
        
        .reuben-branding {
            font-weight: 600;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .toc {
            background: white;
            border: 1px solid hsl(217, 32%, 89%);
            padding: 1.5rem;
            margin-bottom: 2rem;
            border-radius: 8px;
        }
        
        .toc h2 {
            color: hsl(217, 91%, 45%);
            border-bottom: 2px solid hsl(217, 91%, 60%);
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .toc ul {
            list-style: none;
            padding: 0;
        }
        
        .toc li {
            padding: 0.5rem 0;
            border-bottom: 1px dotted hsl(217, 32%, 89%);
            display: flex;
            justify-content: space-between;
        }
        
        @media print {
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">Reuben AI</div>
        <h1>INVESTMENT COMMITTEE MEMORANDUM</h1>
        <div class="subtitle">${company} • ${fundName}</div>
    </div>
    
    <div class="memo-meta">
        <div class="meta-grid">
            <div class="meta-item">
                <div class="meta-label">Company</div>
                <div class="meta-value">${company}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Industry</div>
                <div class="meta-value">${deal?.industry || 'N/A'}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Deal Size</div>
                <div class="meta-value">${deal?.deal_size ? `$${(deal.deal_size / 1000000).toFixed(1)}M` : 'N/A'}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Valuation</div>
                <div class="meta-value">${deal?.valuation ? `$${(deal.valuation / 1000000).toFixed(1)}M` : 'N/A'}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Overall Score</div>
                <div class="meta-value">${deal?.overall_score || analysisData?.overall_score || 'N/A'}/100</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">RAG Status</div>
                <div class="meta-value"><span class="rag-status rag-${deal?.rag_status || analysisData?.rag_status || 'amber'}">${deal?.rag_status || analysisData?.rag_status || 'N/A'}</span></div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Generated</div>
                <div class="meta-value">${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
            </div>
            <div class="meta-item">
                <div class="meta-label">Fund</div>
                <div class="meta-value">${fundName}</div>
            </div>
        </div>
    </div>
    
    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            <li><span>Executive Summary</span><span>2</span></li>
            ${Object.keys(sections).map((key, index) => 
              `<li><span>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span><span>${index + 3}</span></li>`
            ).join('')}
            <li><span>Investment Recommendation</span><span>${Object.keys(sections).length + 3}</span></li>
            <li><span>Analysis Insights</span><span>${Object.keys(sections).length + 4}</span></li>
        </ul>
    </div>
    
    <div class="page-break"></div>
    
    <div class="executive-summary">
        <h2>Executive Summary</h2>
        <div class="section-content">
            ${memo.executive_summary || sections.executive_summary || 'Executive summary provides a high-level overview of the investment opportunity, highlighting key strengths and considerations for the investment committee.'}
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${deal?.overall_score || analysisData?.overall_score || 'N/A'}</div>
                <div class="metric-label">Overall Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${deal?.deal_size ? `$${(deal.deal_size / 1000000).toFixed(1)}M` : 'N/A'}</div>
                <div class="metric-label">Deal Size</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${deal?.valuation ? `$${(deal.valuation / 1000000).toFixed(1)}M` : 'N/A'}</div>
                <div class="metric-label">Valuation</div>
            </div>
            <div class="metric-card">
                <div class="metric-value"><span class="rag-status rag-${deal?.rag_status || analysisData?.rag_status || 'amber'}">${deal?.rag_status || analysisData?.rag_status || 'N/A'}</span></div>
                <div class="metric-label">RAG Status</div>
            </div>
        </div>
    </div>
    
    ${Object.entries(sections).map(([key, content]) => `
    <div class="section">
        <h2>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
        <div class="section-content">
            ${content || `This section provides detailed analysis of ${key.replace(/_/g, ' ').toLowerCase()}, including key insights and strategic considerations relevant to the investment decision.`}
        </div>
    </div>
    `).join('')}
    
    <div class="page-break"></div>
    
    <div class="recommendation">
        <h2>Investment Recommendation</h2>
        <div class="section-content">
            ${memo.investment_recommendation || sections.investment_recommendation || 'Investment recommendation provides the committee with a clear recommendation based on comprehensive analysis of the opportunity, including rationale and next steps.'}
        </div>
    </div>
    
    ${Object.keys(analysisData).length > 0 ? `
    <div class="analysis-insights">
        <h3>AI Analysis Insights</h3>
        <div class="insights-grid">
            ${Object.entries(analysisData).slice(0, 6).map(([key, value]) => `
            <div class="insight-item">
                <div class="insight-label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                <div class="insight-value">${typeof value === 'object' ? JSON.stringify(value).slice(0, 100) + '...' : value}</div>
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}
    
    <div class="footer">
        <div class="reuben-branding">Generated by Reuben AI Investment Platform</div>
        <div>Confidential and Proprietary - For Investment Committee Use Only</div>
        <div style="margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.8;">
            © ${new Date().getFullYear()} Reuben AI. Patent Pending Technology.
        </div>
    </div>
</body>
</html>`;
}