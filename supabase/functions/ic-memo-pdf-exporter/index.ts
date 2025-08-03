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
    console.log('PDF Export Request:', { memoId, dealId, fundId, hasMemoContent: !!memoContent, hasDealData: !!dealData });
    
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
            company_name,
            industry,
            location,
            deal_size,
            valuation,
            website,
            description,
            overall_score,
            rag_status
          ),
          funds (
            name,
            fund_type
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
        .select('name, fund_type')
        .eq('id', fundId)
        .single();
      
      fund = fundData;
    }

    // Generate professional PDF content
    const pdfContent = await generateProfessionalPDF(memo, deal, fund);

    return new Response(JSON.stringify({
      success: true,
      pdfUrl: pdfContent.url,
      fileName: `IC_Memo_${deal?.company_name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ic-memo-pdf-exporter:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateProfessionalPDF(memo: any, deal: any, fund: any): Promise<{ url: string }> {
  // Generate HTML content with Reuben branding
  const htmlContent = generateHTMLContent(memo, deal, fund);
  
  // Use Puppeteer for PDF generation
  try {
    const response = await fetch('https://api.htmlpdfapi.com/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': Deno.env.get('HTML_PDF_API_KEY') || 'demo'
      },
      body: JSON.stringify({
        html: htmlContent,
        displayOptions: {
          format: 'A4',
          margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
          printBackground: true
        }
      })
    });

    if (response.ok) {
      const pdfBlob = await response.blob();
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(await pdfBlob.arrayBuffer())));
      return {
        url: `data:application/pdf;base64,${pdfBase64}`
      };
    }
  } catch (error) {
    console.warn('PDF API failed, falling back to HTML:', error);
  }
  
  // Fallback to HTML for now
  return {
    url: `data:text/html;base64,${btoa(htmlContent)}`
  };
}

function generateHTMLContent(memo: any, deal: any, fund: any): string {
  const sections = memo.memo_content || memo || {};
  const company = deal?.company_name || 'Unknown Company';
  const fundName = fund?.name || 'Investment Fund';
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
            margin: 1in;
            size: letter;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: #ffffff;
        }
        
        .header {
            background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
            color: white;
            padding: 2rem;
            margin: -1in -1in 2rem -1in;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 2rem;
            width: 100px;
            height: 60px;
            background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTAwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSI1MCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UmV1YmVuIEFJPC90ZXh0Pgo8L3N2Zz4K') no-repeat center;
            background-size: contain;
        }
        
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 300;
            font-family: 'Georgia', serif;
        }
        
        .header .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-top: 0.5rem;
            font-weight: 300;
        }
        
        .memo-meta {
            background: #f8f9fa;
            padding: 1.5rem;
            border-left: 4px solid #667eea;
            margin-bottom: 2rem;
        }
        
        .memo-meta table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .memo-meta td {
            padding: 0.5rem 1rem;
            border-bottom: 1px solid #e9ecef;
        }
        
        .memo-meta td:first-child {
            font-weight: 600;
            color: #495057;
            width: 30%;
        }
        
        .toc {
            background: #ffffff;
            border: 1px solid #e9ecef;
            padding: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .toc h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .toc ul {
            list-style: none;
            padding: 0;
        }
        
        .toc li {
            padding: 0.5rem 0;
            border-bottom: 1px dotted #e9ecef;
            display: flex;
            justify-content: space-between;
        }
        
        .section {
            margin-bottom: 2rem;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        
        .section h3 {
            color: #495057;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
        }
        
        .recommendation {
            background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
            border: 2px solid #667eea;
            padding: 2rem;
            margin: 2rem 0;
            text-align: center;
        }
        
        .recommendation h2 {
            color: #667eea;
            margin-top: 0;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }
        
        .metric-card {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e9ecef;
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: 600;
            color: #667eea;
        }
        
        .metric-label {
            color: #6c757d;
            font-size: 0.9rem;
        }
        
        .rag-status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.8rem;
        }
        
        .rag-green { background: #d4edda; color: #155724; }
        .rag-amber { background: #fff3cd; color: #856404; }
        .rag-red { background: #f8d7da; color: #721c24; }
        
        .footer {
            background: #3B82F6;
            color: white;
            padding: 1rem;
            margin: 2rem -1in -1in -1in;
            text-align: center;
            font-size: 0.9rem;
            border-top: 3px solid #1E40AF;
        }
        
        .reuben-branding {
            background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .data-quality {
            background: #e7f3ff;
            border: 1px solid #b3d9ff;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 4px;
        }
        
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>INVESTMENT COMMITTEE MEMORANDUM</h1>
        <div class="subtitle">${company} - ${fund}</div>
    </div>
    
    <div class="memo-meta">
        <table>
            <tr>
                <td>Company:</td>
                <td><strong>${company}</strong></td>
            </tr>
            <tr>
                <td>Industry:</td>
                <td>${memo.deals?.industry || 'N/A'}</td>
            </tr>
            <tr>
                <td>Deal Size:</td>
                <td>${memo.deals?.deal_size ? `$${(memo.deals.deal_size / 1000000).toFixed(1)}M` : 'N/A'}</td>
            </tr>
            <tr>
                <td>Valuation:</td>
                <td>${memo.deals?.valuation ? `$${(memo.deals.valuation / 1000000).toFixed(1)}M` : 'N/A'}</td>
            </tr>
            <tr>
                <td>Overall Score:</td>
                <td>${memo.deals?.overall_score || 'N/A'}/100</td>
            </tr>
            <tr>
                <td>RAG Status:</td>
                <td><span class="rag-status rag-${memo.deals?.rag_status || 'amber'}">${memo.deals?.rag_status || 'N/A'}</span></td>
            </tr>
            <tr>
                <td>Generated:</td>
                <td>${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</td>
            </tr>
        </table>
    </div>
    
    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            <li><span>Executive Summary</span><span>3</span></li>
            ${Object.keys(sections).map((key, index) => 
              `<li><span>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span><span>${index + 4}</span></li>`
            ).join('')}
            <li><span>Investment Recommendation</span><span>${Object.keys(sections).length + 4}</span></li>
        </ul>
    </div>
    
    <div class="page-break"></div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        ${memo.executive_summary || 'Executive summary not available.'}
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${memo.deals?.overall_score || 'N/A'}</div>
                <div class="metric-label">Overall Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${memo.deals?.deal_size ? `$${(memo.deals.deal_size / 1000000).toFixed(1)}M` : 'N/A'}</div>
                <div class="metric-label">Deal Size</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${memo.deals?.valuation ? `$${(memo.deals.valuation / 1000000).toFixed(1)}M` : 'N/A'}</div>
                <div class="metric-label">Valuation</div>
            </div>
            <div class="metric-card">
                <div class="metric-value"><span class="rag-status rag-${memo.deals?.rag_status || 'amber'}">${memo.deals?.rag_status || 'N/A'}</span></div>
                <div class="metric-label">RAG Status</div>
            </div>
        </div>
    </div>
    
    ${Object.entries(sections).map(([key, content]) => `
    <div class="section">
        <h2>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
        ${content || 'Content not available for this section.'}
    </div>
    `).join('')}
    
    <div class="page-break"></div>
    
    <div class="recommendation">
        <h2>Investment Recommendation</h2>
        ${memo.investment_recommendation || 'Investment recommendation not available.'}
    </div>
    
    ${memo.memo_content?.data_quality_assessment ? `
    <div class="data-quality">
        <h3>Data Quality Assessment</h3>
        ${memo.memo_content.data_quality_assessment}
    </div>
    ` : ''}
    
    <div class="footer">
        <div class="reuben-branding">Generated by Reuben AI Investment Platform</div>
        <div style="margin-top: 0.5rem;">Confidential and Proprietary - For Investment Committee Use Only</div>
        <div style="margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.8;">
            © ${new Date().getFullYear()} Reuben AI. Patent Pending Technology.
        </div>
    </div>
</body>
</html>`;
}