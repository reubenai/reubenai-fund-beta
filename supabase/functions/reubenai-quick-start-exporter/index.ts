import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

interface QuickStartRequest {
  version?: string;
  customBranding?: {
    companyName?: string;
    logoUrl?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { version = "1.0", customBranding }: QuickStartRequest = await req.json().catch(() => ({}));
    
    console.log('Generating ReubenAI Quick Start Guide...');
    
    const pdfResult = await generateQuickStartGuide(version, customBranding);
    
    const filename = `ReubenAI-Quick-Start-Guide-v${version}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    return new Response(JSON.stringify({
      success: true,
      url: pdfResult.url,
      filename: filename,
      generatedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error generating quick start guide:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate quick start guide',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

async function generateQuickStartGuide(version: string, customBranding?: any): Promise<{ url: string }> {
  const htmlContent = generateQuickStartHTML(version, customBranding);
  
  // Return as downloadable text file for now
  const base64Content = btoa(unescape(encodeURIComponent(htmlContent)));
  return { url: `data:text/html;base64,${base64Content}` };
}

function generateQuickStartHTML(version: string, customBranding?: any): string {
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
  <title>ReubenAI Quick Start Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
    }
    
    .welcome-page {
      height: 100vh;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: white;
      page-break-after: always;
    }
    
    .welcome-logo {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 24px;
      letter-spacing: -0.02em;
    }
    
    .welcome-title {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 16px;
      opacity: 0.95;
    }
    
    .welcome-subtitle {
      font-size: 18px;
      font-weight: 400;
      opacity: 0.8;
      margin-bottom: 48px;
      max-width: 600px;
    }
    
    .welcome-meta {
      font-size: 14px;
      opacity: 0.7;
    }
    
    .page {
      padding: 60px 80px;
      min-height: 100vh;
      page-break-before: always;
    }
    
    .header {
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    
    .header h1 {
      font-size: 28px;
      font-weight: 700;
      color: #059669;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      font-size: 16px;
      color: #64748b;
    }
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #059669;
      margin: 32px 0 16px 0;
      border-left: 4px solid #10b981;
      padding-left: 16px;
    }
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 24px 0 12px 0;
    }
    
    h4 {
      font-size: 16px;
      font-weight: 600;
      color: #475569;
      margin: 16px 0 8px 0;
    }
    
    p {
      margin: 12px 0;
      color: #334155;
      line-height: 1.7;
    }
    
    .step-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      position: relative;
    }
    
    .step-number {
      position: absolute;
      top: -12px;
      left: 24px;
      background: #10b981;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }
    
    .step-title {
      font-size: 18px;
      font-weight: 600;
      color: #065f46;
      margin-bottom: 12px;
      margin-top: 8px;
    }
    
    .step-description {
      color: #374151;
      margin-bottom: 16px;
    }
    
    .step-actions {
      background: white;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #d1fae5;
    }
    
    .step-actions h5 {
      font-size: 14px;
      font-weight: 600;
      color: #059669;
      margin-bottom: 8px;
    }
    
    .step-actions ul {
      margin: 0;
      padding-left: 16px;
    }
    
    .step-actions li {
      color: #374151;
      font-size: 14px;
      margin: 4px 0;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 24px 0;
    }
    
    .feature-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      background: #f8fafc;
    }
    
    .feature-card h4 {
      color: #059669;
      margin-bottom: 8px;
    }
    
    .feature-card p {
      font-size: 14px;
      margin: 0;
    }
    
    .quick-ref-card {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    
    .quick-ref-card h3 {
      color: #92400e;
      margin-bottom: 16px;
    }
    
    .ref-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .ref-item {
      background: white;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #fcd34d;
    }
    
    .ref-label {
      font-weight: 600;
      color: #92400e;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .ref-value {
      font-size: 14px;
      color: #374151;
      margin-top: 4px;
    }
    
    .support-box {
      background: #eff6ff;
      border: 1px solid #93c5fd;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .support-box h3 {
      color: #1e40af;
      margin-bottom: 16px;
    }
    
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 16px;
    }
    
    .contact-item {
      background: white;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
    }
    
    .contact-type {
      font-weight: 600;
      color: #1e40af;
      font-size: 14px;
    }
    
    .contact-details {
      color: #374151;
      font-size: 14px;
      margin-top: 4px;
    }
    
    .timeline {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    
    .timeline h4 {
      color: #475569;
      margin-bottom: 16px;
      text-align: center;
    }
    
    .timeline-items {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    
    .timeline-item {
      text-align: center;
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }
    
    .timeline-week {
      font-weight: 600;
      color: #1e40af;
      font-size: 12px;
    }
    
    .timeline-task {
      font-size: 11px;
      color: #374151;
      margin-top: 4px;
    }
    
    .footer {
      position: fixed;
      bottom: 30px;
      left: 80px;
      right: 80px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }
    
    ul {
      margin: 16px 0;
      padding-left: 24px;
    }
    
    li {
      margin: 8px 0;
      color: #334155;
    }
    
    .highlight {
      background: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      margin: 16px 0;
      border-radius: 0 8px 8px 0;
    }
    
    @media print {
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <!-- Welcome Page -->
  <div class="welcome-page">
    <div class="welcome-logo">ReubenAI</div>
    <div class="welcome-title">Quick Start Guide</div>
    <div class="welcome-subtitle">Get up and running with AI-powered investment intelligence in just 5 steps</div>
    <div class="welcome-meta">
      Version ${version} • Generated ${currentDate}<br>
      Your journey to smarter investing starts here
    </div>
  </div>

  <!-- 5-Step Process -->
  <div class="page">
    <div class="header">
      <h1>Your 5-Step Journey to Success</h1>
      <div class="subtitle">Follow these steps to unlock the full power of ReubenAI</div>
    </div>
    
    <div class="step-card">
      <div class="step-number">1</div>
      <div class="step-title">Fund Setup & Configuration</div>
      <div class="step-description">
        Create your fund profile and establish the foundation for intelligent analysis.
      </div>
      <div class="step-actions">
        <h5>What You'll Do:</h5>
        <ul>
          <li>Enter fund name, size, and vintage year</li>
          <li>Define your primary investment focus (VC/PE)</li>
          <li>Set geographic and industry preferences</li>
          <li>Configure team access and permissions</li>
        </ul>
      </div>
    </div>
    
    <div class="step-card">
      <div class="step-number">2</div>
      <div class="step-title">Investment Strategy Definition</div>
      <div class="step-description">
        Configure your investment thesis and criteria to ensure every analysis aligns with your fund's goals.
      </div>
      <div class="step-actions">
        <h5>What You'll Do:</h5>
        <ul>
          <li>Set evaluation criteria weights across 4 key dimensions</li>
          <li>Define RAG score thresholds (Exciting: 85+, Promising: 70-84)</li>
          <li>Customize industry and stage preferences</li>
          <li>Review and validate strategy configuration</li>
        </ul>
      </div>
    </div>
    
    <div class="step-card">
      <div class="step-number">3</div>
      <div class="step-title">Deal Pipeline Navigation</div>
      <div class="step-description">
        Master the pipeline interface and understand how AI-powered insights enhance your deal flow.
      </div>
      <div class="step-actions">
        <h5>What You'll Do:</h5>
        <ul>
          <li>Explore the Kanban-style deal pipeline</li>
          <li>Understand RAG scoring and what it means</li>
          <li>Learn to filter and sort deals effectively</li>
          <li>Practice moving deals through stages</li>
        </ul>
      </div>
    </div>
    
    <div class="step-card">
      <div class="step-number">4</div>
      <div class="step-title">AI Analysis Understanding</div>
      <div class="step-description">
        Learn how to interpret and leverage AI-generated insights for better investment decisions.
      </div>
      <div class="step-actions">
        <h5>What You'll Do:</h5>
        <ul>
          <li>Review sample AI analysis reports</li>
          <li>Understand the 12 analysis engines</li>
          <li>Learn to read scoring breakdowns</li>
          <li>Practice using AI recommendations</li>
        </ul>
      </div>
    </div>
    
    <div class="step-card">
      <div class="step-number">5</div>
      <div class="step-title">Key Features Overview</div>
      <div class="step-description">
        Explore advanced features including Fund Memory, document management, and team collaboration tools.
      </div>
      <div class="step-actions">
        <h5>What You'll Do:</h5>
        <ul>
          <li>Upload and analyze your first pitch deck</li>
          <li>Explore Fund Memory insights</li>
          <li>Set up team workflows and notifications</li>
          <li>Plan your investment committee integration</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Platform Navigation -->
  <div class="page page-break">
    <div class="header">
      <h1>Platform Navigation Essentials</h1>
      <div class="subtitle">Master the key areas of ReubenAI</div>
    </div>
    
    <div class="feature-grid">
      <div class="feature-card">
        <h4>📊 Pipeline Dashboard</h4>
        <p>Your main workspace for managing deals. View all opportunities, track progress, and see AI scores at a glance.</p>
      </div>
      <div class="feature-card">
        <h4>⚙️ Strategy Configuration</h4>
        <p>Define and update your investment criteria. This is where you customize AI analysis to match your thesis.</p>
      </div>
      <div class="feature-card">
        <h4>📁 Fund Memory</h4>
        <p>Access historical insights and patterns. Learn from past decisions to improve future investments.</p>
      </div>
      <div class="feature-card">
        <h4>👥 Investment Committee</h4>
        <p>Streamlined IC process with AI-generated memos, voting system, and decision tracking.</p>
      </div>
    </div>
    
    <h2>Essential Features You'll Use Daily</h2>
    
    <h3>Deal Cards & Scoring</h3>
    <ul>
      <li><strong>RAG Indicators:</strong> Green (Exciting), Amber (Promising), Red (Needs Development)</li>
      <li><strong>Quick Actions:</strong> Move stages, view analysis, upload documents</li>
      <li><strong>Smart Filtering:</strong> Find deals by score, stage, industry, or date</li>
    </ul>
    
    <h3>AI Analysis Reports</h3>
    <ul>
      <li><strong>Executive Summary:</strong> Key insights and recommendation at the top</li>
      <li><strong>Dimensional Scores:</strong> Market, Product, Team, Financial breakdown</li>
      <li><strong>Risk Assessment:</strong> Identified risks and mitigation strategies</li>
      <li><strong>Exit Analysis:</strong> Potential exit paths and valuation scenarios</li>
    </ul>
    
    <h3>Document Management</h3>
    <ul>
      <li><strong>Auto-Processing:</strong> Pitch decks analyzed automatically upon upload</li>
      <li><strong>Version Control:</strong> Track document updates and changes</li>
      <li><strong>Search & Discovery:</strong> Find specific information across all documents</li>
    </ul>
  </div>

  <!-- Quick Reference -->
  <div class="page page-break">
    <div class="header">
      <h1>Quick Reference Card</h1>
      <div class="subtitle">Keep this handy for daily use</div>
    </div>
    
    <div class="quick-ref-card">
      <h3>🎯 RAG Score Quick Guide</h3>
      <div class="ref-grid">
        <div class="ref-item">
          <div class="ref-label">Exciting (Green)</div>
          <div class="ref-value">85-100 points<br>Strong fit for investment</div>
        </div>
        <div class="ref-item">
          <div class="ref-label">Promising (Amber)</div>
          <div class="ref-value">70-84 points<br>Worth deeper investigation</div>
        </div>
        <div class="ref-item">
          <div class="ref-label">Needs Development</div>
          <div class="ref-value">0-69 points<br>Requires significant work</div>
        </div>
        <div class="ref-item">
          <div class="ref-label">Analysis Pending</div>
          <div class="ref-value">Gray indicator<br>AI analysis in progress</div>
        </div>
      </div>
    </div>
    
    <h2>Keyboard Shortcuts</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Pipeline Navigation</h4>
        <p><strong>Ctrl/Cmd + K:</strong> Quick search<br>
        <strong>Ctrl/Cmd + N:</strong> Add new deal<br>
        <strong>Ctrl/Cmd + F:</strong> Filter deals</p>
      </div>
      <div class="feature-card">
        <h4>Deal Management</h4>
        <p><strong>Enter:</strong> Open deal details<br>
        <strong>D:</strong> Download analysis<br>
        <strong>U:</strong> Upload document</p>
      </div>
    </div>
    
    <h2>Common Workflows</h2>
    
    <div class="timeline">
      <h4>New Deal Processing Workflow</h4>
      <div class="timeline-items">
        <div class="timeline-item">
          <div class="timeline-week">Step 1</div>
          <div class="timeline-task">Add deal to pipeline</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-week">Step 2</div>
          <div class="timeline-task">Upload pitch deck</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-week">Step 3</div>
          <div class="timeline-task">Review AI analysis</div>
        </div>
        <div class="timeline-item">
          <div class="timeline-week">Step 4</div>
          <div class="timeline-task">Make investment decision</div>
        </div>
      </div>
    </div>
    
    <h2>Best Practices</h2>
    <ul>
      <li><strong>Upload Documents Early:</strong> The more information AI has, the better the analysis</li>
      <li><strong>Review Strategy Regularly:</strong> Update criteria as your fund evolves</li>
      <li><strong>Use Fund Memory:</strong> Reference past similar deals for context</li>
      <li><strong>Collaborate Effectively:</strong> Share insights and notes with team members</li>
      <li><strong>Track Outcomes:</strong> Record investment results to improve AI accuracy</li>
    </ul>
  </div>

  <!-- Support Resources -->
  <div class="page page-break">
    <div class="header">
      <h1>Support & Resources</h1>
      <div class="subtitle">We're here to ensure your success</div>
    </div>
    
    <div class="support-box">
      <h3>🚀 Implementation Timeline</h3>
      <p>Your 4-week journey to full ReubenAI deployment:</p>
      
      <div class="timeline">
        <div class="timeline-items">
          <div class="timeline-item">
            <div class="timeline-week">Week 1</div>
            <div class="timeline-task">Setup & Configuration</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-week">Week 2</div>
            <div class="timeline-task">Team Training</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-week">Week 3</div>
            <div class="timeline-task">Deal Import & Testing</div>
          </div>
          <div class="timeline-item">
            <div class="timeline-week">Week 4</div>
            <div class="timeline-task">Full Deployment</div>
          </div>
        </div>
      </div>
    </div>
    
    <h2>Get Help When You Need It</h2>
    
    <div class="contact-grid">
      <div class="contact-item">
        <div class="contact-type">📧 Email Support</div>
        <div class="contact-details">support@goreuben.com<br>4-hour response time</div>
      </div>
      <div class="contact-item">
        <div class="contact-type">💬 Live Chat</div>
        <div class="contact-details">Available in platform<br>Business hours: 9AM-6PM EST</div>
      </div>
      <div class="contact-item">
        <div class="contact-type">📞 Phone Support</div>
        <div class="contact-details">+1 (555) 123-4567<br>Urgent issues only</div>
      </div>
      <div class="contact-item">
        <div class="contact-type">📚 Knowledge Base</div>
        <div class="contact-details">help.goreuben.com<br>24/7 self-service resources</div>
      </div>
    </div>
    
    <h2>Training & Resources</h2>
    <ul>
      <li><strong>Weekly Webinars:</strong> Join our Tuesday training sessions for new features</li>
      <li><strong>Video Tutorials:</strong> Step-by-step guides for all platform features</li>
      <li><strong>Best Practices Guide:</strong> Learn from successful ReubenAI implementations</li>
      <li><strong>API Documentation:</strong> For custom integrations and data export</li>
      <li><strong>Community Forum:</strong> Connect with other investment professionals</li>
    </ul>
    
    <div class="highlight">
      <h3>Pro Tip: Bookmark These Resources</h3>
      <p><strong>Platform Status:</strong> status.goreuben.com - Check system status and planned maintenance<br>
      <strong>Feature Requests:</strong> feedback.goreuben.com - Request new features and vote on priorities<br>
      <strong>Release Notes:</strong> updates.goreuben.com - Stay informed about new features and improvements</p>
    </div>
    
    <h2>Success Metrics to Track</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Time Savings</h4>
        <p>Track hours saved on initial deal screening and analysis preparation</p>
      </div>
      <div class="feature-card">
        <h4>Deal Quality</h4>
        <p>Monitor how AI scoring correlates with your investment outcomes</p>
      </div>
      <div class="feature-card">
        <h4>Team Efficiency</h4>
        <p>Measure improvement in deal processing time and decision speed</p>
      </div>
      <div class="feature-card">
        <h4>Portfolio Performance</h4>
        <p>Compare pre- and post-ReubenAI investment performance metrics</p>
      </div>
    </div>
  </div>

  <div class="footer">
    <div>ReubenAI Quick Start Guide • Version ${version} • ${currentDate}</div>
    <div>© 2024 ReubenAI. All rights reserved. | support@goreuben.com</div>
  </div>
</body>
</html>`;
}

serve(handler);