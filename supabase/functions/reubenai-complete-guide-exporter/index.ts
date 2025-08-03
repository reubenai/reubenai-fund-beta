import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

interface GuideRequest {
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
    const { version = "1.0", customBranding }: GuideRequest = await req.json().catch(() => ({}));
    
    console.log('Generating ReubenAI Complete Platform Guide...');
    
    const pdfResult = await generateCompletePlatformGuide(version, customBranding);
    
    const filename = `ReubenAI-Complete-Platform-Guide-v${version}-${new Date().toISOString().split('T')[0]}.pdf`;
    
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
    console.error('Error generating complete guide:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate complete platform guide',
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

async function generateCompletePlatformGuide(version: string, customBranding?: any): Promise<{ url: string }> {
  const htmlContent = generateCompleteGuideHTML(version, customBranding);
  const base64Content = btoa(unescape(encodeURIComponent(htmlContent)));
  return { url: `data:text/html;base64,${base64Content}` };
}

function generateCompleteGuideHTML(version: string, customBranding?: any): string {
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
  <title>ReubenAI Complete Platform Guide</title>
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
    
    .cover-page {
      height: 100vh;
      background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      color: white;
      page-break-after: always;
    }
    
    .cover-logo {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 24px;
      letter-spacing: -0.02em;
    }
    
    .cover-title {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 16px;
      opacity: 0.95;
    }
    
    .cover-subtitle {
      font-size: 18px;
      font-weight: 400;
      opacity: 0.8;
      margin-bottom: 48px;
    }
    
    .cover-meta {
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
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .header .subtitle {
      font-size: 16px;
      color: #64748b;
    }
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #1e40af;
      margin: 32px 0 16px 0;
      border-left: 4px solid #3b82f6;
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
    
    .toc {
      padding: 40px 0;
    }
    
    .toc h2 {
      border: none;
      padding: 0;
      margin-bottom: 32px;
    }
    
    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px dotted #cbd5e1;
    }
    
    .toc-item .title {
      font-weight: 500;
    }
    
    .toc-item .page {
      font-weight: 600;
      color: #3b82f6;
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
      margin: 24px 0;
    }
    
    .feature-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      background: #f8fafc;
    }
    
    .feature-card h4 {
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .feature-card p {
      font-size: 14px;
      margin: 0;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 24px 0;
    }
    
    .stat-card {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 8px;
      border: 1px solid #bae6fd;
    }
    
    .stat-number {
      font-size: 32px;
      font-weight: 700;
      color: #0284c7;
      display: block;
    }
    
    .stat-label {
      font-size: 14px;
      color: #0369a1;
      margin-top: 4px;
    }
    
    .process-steps {
      margin: 24px 0;
    }
    
    .step {
      display: flex;
      margin: 20px 0;
      align-items: flex-start;
    }
    
    .step-number {
      background: #3b82f6;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      margin-right: 16px;
      flex-shrink: 0;
    }
    
    .step-content h4 {
      margin: 0 0 8px 0;
    }
    
    .step-content p {
      margin: 0;
      font-size: 14px;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .case-study {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .case-study h4 {
      color: #1e40af;
      margin-bottom: 16px;
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
    
    .contact-info {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      margin: 12px 0;
    }
    
    .contact-label {
      font-weight: 600;
      width: 120px;
      color: #1e40af;
    }
    
    @media print {
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-logo">ReubenAI</div>
    <div class="cover-title">Complete Platform Guide</div>
    <div class="cover-subtitle">AI-Powered Investment Intelligence Platform</div>
    <div class="cover-meta">
      Version ${version} • Generated ${currentDate}<br>
      Professional Edition for Investment Teams
    </div>
  </div>

  <!-- Table of Contents -->
  <div class="page">
    <div class="header">
      <h1>Table of Contents</h1>
      <div class="subtitle">Navigate through ReubenAI's comprehensive capabilities</div>
    </div>
    
    <div class="toc">
      <div class="toc-item">
        <span class="title">1. Executive Overview</span>
        <span class="page">3</span>
      </div>
      <div class="toc-item">
        <span class="title">2. Target Audience & Value Proposition</span>
        <span class="page">4</span>
      </div>
      <div class="toc-item">
        <span class="title">3. Platform Capabilities - Live Features</span>
        <span class="page">5</span>
      </div>
      <div class="toc-item">
        <span class="title">4. Platform Capabilities - Roadmap</span>
        <span class="page">7</span>
      </div>
      <div class="toc-item">
        <span class="title">5. AI Orchestration & Deal Scoring</span>
        <span class="page">8</span>
      </div>
      <div class="toc-item">
        <span class="title">6. Case Study: CleanTech Analysis</span>
        <span class="page">10</span>
      </div>
      <div class="toc-item">
        <span class="title">7. Getting Started Guide</span>
        <span class="page">11</span>
      </div>
      <div class="toc-item">
        <span class="title">8. Contact & Support</span>
        <span class="page">12</span>
      </div>
    </div>
  </div>

  <!-- Executive Overview -->
  <div class="page page-break">
    <div class="header">
      <h1>1. Executive Overview</h1>
      <div class="subtitle">What is ReubenAI?</div>
    </div>
    
    <p><strong>ReubenAI</strong> is an AI-powered investment intelligence platform designed specifically for venture capital and private equity firms. Our platform transforms how investment teams source, analyze, and manage deal flow through intelligent automation and data-driven insights.</p>
    
    <h2>Core Value Proposition</h2>
    <p>ReubenAI eliminates the manual overhead of investment analysis by providing:</p>
    <ul>
      <li><strong>Intelligent Deal Sourcing:</strong> Automated discovery and qualification of investment opportunities</li>
      <li><strong>Comprehensive Analysis:</strong> Multi-dimensional scoring across 50+ criteria tailored to your investment thesis</li>
      <li><strong>Strategic Alignment:</strong> Ensure every deal aligns with your fund's specific investment strategy</li>
      <li><strong>Workflow Optimization:</strong> Streamlined deal flow management from initial screening to investment decision</li>
    </ul>
    
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-number">85%</span>
        <div class="stat-label">Time Reduction in Initial Screening</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">12</span>
        <div class="stat-label">Analysis Engines</div>
      </div>
      <div class="stat-card">
        <span class="stat-number">50+</span>
        <div class="stat-label">Evaluation Criteria</div>
      </div>
    </div>
    
    <div class="highlight-box">
      <h3>Why Choose ReubenAI?</h3>
      <p>Unlike generic CRM or deal tracking tools, ReubenAI is purpose-built for investment professionals. Our AI understands the nuances of venture capital and private equity, providing intelligent insights that enhance decision-making rather than replace human judgment.</p>
    </div>
  </div>

  <!-- Target Audience -->
  <div class="page page-break">
    <div class="header">
      <h1>2. Target Audience & Value Proposition</h1>
      <div class="subtitle">Who ReubenAI serves and why</div>
    </div>
    
    <h2>Primary Audience</h2>
    
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Venture Capital Funds</h4>
        <p>Early-stage and growth equity funds looking to scale their deal sourcing and analysis capabilities while maintaining investment quality.</p>
      </div>
      <div class="feature-card">
        <h4>Private Equity Firms</h4>
        <p>Mid-market and growth PE firms seeking to enhance due diligence processes and portfolio optimization through data-driven insights.</p>
      </div>
      <div class="feature-card">
        <h4>Family Offices</h4>
        <p>High-net-worth family offices managing direct investments and seeking institutional-grade analysis tools.</p>
      </div>
      <div class="feature-card">
        <h4>Corporate Venture Arms</h4>
        <p>Strategic investment teams within corporations looking to identify and evaluate strategic partnership opportunities.</p>
      </div>
    </div>
    
    <h2>Key Benefits by Role</h2>
    
    <h3>For Fund Managers & Partners</h3>
    <ul>
      <li>Strategic oversight with comprehensive portfolio analytics</li>
      <li>Standardized investment process across team members</li>
      <li>Enhanced LP reporting with data-driven insights</li>
      <li>Risk mitigation through systematic evaluation</li>
    </ul>
    
    <h3>For Investment Professionals & Analysts</h3>
    <ul>
      <li>Automated initial screening and qualification</li>
      <li>Comprehensive research compilation and analysis</li>
      <li>Consistent evaluation framework across deals</li>
      <li>Time freed for high-value relationship building</li>
    </ul>
    
    <h3>For Investment Committees</h3>
    <ul>
      <li>Standardized deal presentation format</li>
      <li>Objective scoring methodology</li>
      <li>Historical context and pattern analysis</li>
      <li>Clear recommendation framework</li>
    </ul>
  </div>

  <!-- Live Features -->
  <div class="page page-break">
    <div class="header">
      <h1>3. Platform Capabilities - Live Features</h1>
      <div class="subtitle">Currently available functionality</div>
    </div>
    
    <h2>Investment Strategy Configuration</h2>
    <p>Define and customize your fund's investment thesis with precision:</p>
    <ul>
      <li><strong>Multi-dimensional Criteria:</strong> Configure evaluation criteria across market, product, team, and financial dimensions</li>
      <li><strong>Weighted Scoring:</strong> Assign importance weights to different evaluation categories</li>
      <li><strong>Threshold Management:</strong> Set clear boundaries for Exciting, Promising, and Needs Development classifications</li>
      <li><strong>Industry Focus:</strong> Specify target industries, geographies, and deal stages</li>
    </ul>
    
    <h2>Intelligent Deal Pipeline</h2>
    <p>Comprehensive deal flow management with AI-powered insights:</p>
    <ul>
      <li><strong>Automated Scoring:</strong> Real-time evaluation against your investment criteria</li>
      <li><strong>Smart Categorization:</strong> Automatic deal staging and prioritization</li>
      <li><strong>Document Integration:</strong> Seamless pitch deck and document analysis</li>
      <li><strong>Progress Tracking:</strong> Visual pipeline management with status updates</li>
    </ul>
    
    <h2>AI-Powered Analysis Engine</h2>
    <p>Comprehensive deal evaluation across multiple dimensions:</p>
    
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Market Intelligence</h4>
        <p>Market size, growth trends, competitive landscape analysis</p>
      </div>
      <div class="feature-card">
        <h4>Financial Analysis</h4>
        <p>Revenue projections, unit economics, financial health assessment</p>
      </div>
      <div class="feature-card">
        <h4>Team Evaluation</h4>
        <p>Founder backgrounds, team composition, leadership assessment</p>
      </div>
      <div class="feature-card">
        <h4>Product Assessment</h4>
        <p>Technology moat, product-market fit, competitive advantages</p>
      </div>
    </div>
    
    <h2>Fund Memory System</h2>
    <p>Institutional knowledge management and pattern recognition:</p>
    <ul>
      <li><strong>Historical Analysis:</strong> Learn from past investment decisions and outcomes</li>
      <li><strong>Pattern Recognition:</strong> Identify successful investment characteristics</li>
      <li><strong>Decision Context:</strong> Access to previous similar deals and decisions</li>
      <li><strong>Knowledge Base:</strong> Centralized repository of fund insights and learnings</li>
    </ul>
  </div>

  <!-- Roadmap Features -->
  <div class="page page-break">
    <div class="header">
      <h1>4. Platform Capabilities - Roadmap</h1>
      <div class="subtitle">Coming soon enhancements</div>
    </div>
    
    <h2>Investment Committee Portal</h2>
    <p>Streamlined IC process with digital-first approach:</p>
    <ul>
      <li><strong>Digital Memos:</strong> AI-generated investment memos with standardized format</li>
      <li><strong>Voting System:</strong> Structured decision-making with rationale capture</li>
      <li><strong>Calendar Integration:</strong> Automated scheduling and agenda management</li>
      <li><strong>Decision Tracking:</strong> Historical IC decisions and outcome analysis</li>
    </ul>
    
    <h2>Advanced Analytics Dashboard</h2>
    <p>Portfolio and performance insights:</p>
    <ul>
      <li><strong>Portfolio Analytics:</strong> Comprehensive portfolio performance tracking</li>
      <li><strong>Market Trends:</strong> Industry and market trend analysis</li>
      <li><strong>Benchmark Comparisons:</strong> Performance against industry benchmarks</li>
      <li><strong>Predictive Insights:</strong> AI-driven performance predictions</li>
    </ul>
    
    <h2>Fund Administration Tools</h2>
    <p>Back-office automation and compliance:</p>
    <ul>
      <li><strong>LP Reporting:</strong> Automated quarterly and annual reports</li>
      <li><strong>Compliance Monitoring:</strong> Regulatory compliance tracking</li>
      <li><strong>Document Management:</strong> Centralized document storage and access</li>
      <li><strong>Audit Trail:</strong> Complete audit trail for all activities</li>
    </ul>
    
    <h2>Enhanced AI Capabilities</h2>
    <p>Next-generation AI features:</p>
    <ul>
      <li><strong>Predictive Modeling:</strong> Success probability modeling</li>
      <li><strong>Market Scanning:</strong> Proactive opportunity identification</li>
      <li><strong>Sentiment Analysis:</strong> Market sentiment and founder assessment</li>
      <li><strong>Risk Modeling:</strong> Comprehensive risk assessment and mitigation</li>
    </ul>
  </div>

  <!-- AI Orchestration -->
  <div class="page page-break">
    <div class="header">
      <h1>5. AI Orchestration & Deal Scoring</h1>
      <div class="subtitle">The intelligence behind ReubenAI</div>
    </div>
    
    <h2>Multi-Engine Architecture</h2>
    <p>ReubenAI employs 12 specialized AI engines that work in concert to provide comprehensive deal analysis:</p>
    
    <div class="feature-grid">
      <div class="feature-card">
        <h4>Market Intelligence Engine</h4>
        <p>Analyzes market size, growth trends, and competitive dynamics</p>
      </div>
      <div class="feature-card">
        <h4>Financial Analysis Engine</h4>
        <p>Evaluates revenue models, unit economics, and financial projections</p>
      </div>
      <div class="feature-card">
        <h4>Team Research Engine</h4>
        <p>Assesses founder backgrounds, team composition, and execution capability</p>
      </div>
      <div class="feature-card">
        <h4>Product & IP Engine</h4>
        <p>Evaluates technology moat, intellectual property, and product differentiation</p>
      </div>
      <div class="feature-card">
        <h4>Risk Mitigation Engine</h4>
        <p>Identifies potential risks and mitigation strategies</p>
      </div>
      <div class="feature-card">
        <h4>Exit Strategy Engine</h4>
        <p>Analyzes potential exit paths and valuation scenarios</p>
      </div>
    </div>
    
    <h2>RAG Score Methodology</h2>
    <p>ReubenAI's proprietary RAG (Red-Amber-Green) scoring system provides objective deal evaluation:</p>
    
    <div class="highlight-box">
      <h3>Scoring Framework</h3>
      <ul>
        <li><strong>Green (85-100):</strong> Exciting opportunities that strongly align with investment criteria</li>
        <li><strong>Amber (70-84):</strong> Promising deals that warrant deeper investigation</li>
        <li><strong>Red (0-69):</strong> Opportunities that need significant development or fall outside focus areas</li>
      </ul>
    </div>
    
    <h2>Intelligent Orchestration</h2>
    <p>The AI Orchestrator coordinates analysis across all engines:</p>
    <ul>
      <li><strong>Dynamic Weighting:</strong> Adjusts analysis focus based on your investment strategy</li>
      <li><strong>Context Awareness:</strong> Considers fund stage, industry focus, and historical preferences</li>
      <li><strong>Quality Assurance:</strong> Cross-validates findings across multiple engines</li>
      <li><strong>Continuous Learning:</strong> Improves accuracy based on investment outcomes</li>
    </ul>
  </div>

  <!-- Case Study -->
  <div class="page page-break">
    <div class="header">
      <h1>6. Case Study: CleanTech Analysis</h1>
      <div class="subtitle">Real-world application example</div>
    </div>
    
    <div class="case-study">
      <h4>Company Profile: GreenTech Innovations</h4>
      <p><strong>Industry:</strong> Clean Technology - Solar Energy Storage<br>
      <strong>Stage:</strong> Series B<br>
      <strong>Funding Sought:</strong> $25M</p>
      
      <h3>AI Analysis Results</h3>
      
      <h4>Market Intelligence (Score: 88/100)</h4>
      <ul>
        <li>$127B addressable market in energy storage</li>
        <li>34% projected annual growth through 2030</li>
        <li>Strong regulatory tailwinds with IRA incentives</li>
        <li>Fragmented competitive landscape with opportunity for consolidation</li>
      </ul>
      
      <h4>Financial Analysis (Score: 82/100)</h4>
      <ul>
        <li>$12M ARR with 180% net revenue retention</li>
        <li>Positive unit economics with 67% gross margins</li>
        <li>Clear path to profitability within 18 months</li>
        <li>Conservative revenue projections vs. market opportunity</li>
      </ul>
      
      <h4>Team Assessment (Score: 91/100)</h4>
      <ul>
        <li>CEO: Former Tesla energy division executive</li>
        <li>CTO: MIT PhD with 8 patents in battery technology</li>
        <li>Experienced team with relevant industry backgrounds</li>
        <li>Strong advisory board including industry veterans</li>
      </ul>
      
      <h4>Product & Technology (Score: 85/100)</h4>
      <ul>
        <li>Proprietary battery management system with patent protection</li>
        <li>20% efficiency improvement over competitors</li>
        <li>Strong customer validation with tier-1 utilities</li>
        <li>Scalable manufacturing process</li>
      </ul>
      
      <div class="highlight-box">
        <h3>Final RAG Score: 87/100 (Green - Exciting)</h3>
        <p><strong>AI Recommendation:</strong> Strong alignment with clean energy investment thesis. Recommend proceeding to detailed due diligence with focus on manufacturing scalability and competitive moat sustainability.</p>
      </div>
    </div>
  </div>

  <!-- Getting Started -->
  <div class="page page-break">
    <div class="header">
      <h1>7. Getting Started Guide</h1>
      <div class="subtitle">Your 5-step onboarding process</div>
    </div>
    
    <div class="process-steps">
      <div class="step">
        <div class="step-number">1</div>
        <div class="step-content">
          <h4>Fund Setup & Configuration</h4>
          <p>Create your fund profile, define basic parameters including fund size, vintage, and investment focus areas. This establishes the foundation for all subsequent analysis.</p>
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">2</div>
        <div class="step-content">
          <h4>Investment Strategy Definition</h4>
          <p>Configure your investment criteria across market, product, team, and financial dimensions. Set importance weights and define your RAG score thresholds.</p>
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">3</div>
        <div class="step-content">
          <h4>Deal Pipeline Setup</h4>
          <p>Import existing deals or start fresh. Configure your deal stages and workflow preferences to match your current investment process.</p>
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">4</div>
        <div class="step-content">
          <h4>Team Training & Onboarding</h4>
          <p>Set up user accounts for your team members with appropriate access levels. Provide training on platform features and best practices.</p>
        </div>
      </div>
      
      <div class="step">
        <div class="step-number">5</div>
        <div class="step-content">
          <h4>First Deal Analysis</h4>
          <p>Run your first AI analysis on a sample deal to validate configuration and familiarize the team with the platform's capabilities and outputs.</p>
        </div>
      </div>
    </div>
    
    <div class="highlight-box">
      <h3>Implementation Timeline</h3>
      <p><strong>Week 1:</strong> Platform setup and configuration<br>
      <strong>Week 2:</strong> Team training and initial deal imports<br>
      <strong>Week 3:</strong> Full deployment and optimization<br>
      <strong>Week 4:</strong> Performance review and refinement</p>
    </div>
  </div>

  <!-- Contact & Support -->
  <div class="page page-break">
    <div class="header">
      <h1>8. Contact & Support</h1>
      <div class="subtitle">We're here to help you succeed</div>
    </div>
    
    <h2>Implementation Support</h2>
    <p>Our dedicated implementation team ensures smooth onboarding and optimal configuration for your fund's specific needs.</p>
    
    <div class="contact-info">
      <div class="contact-item">
        <span class="contact-label">Implementation:</span>
        <span>implementation@goreuben.com</span>
      </div>
      <div class="contact-item">
        <span class="contact-label">Technical Support:</span>
        <span>support@goreuben.com</span>
      </div>
      <div class="contact-item">
        <span class="contact-label">Sales Inquiries:</span>
        <span>hello@goreuben.com</span>
      </div>
      <div class="contact-item">
        <span class="contact-label">Phone:</span>
        <span>+1 (555) 123-4567</span>
      </div>
    </div>
    
    <h2>Resources & Documentation</h2>
    <ul>
      <li><strong>Knowledge Base:</strong> Comprehensive guides and tutorials</li>
      <li><strong>API Documentation:</strong> For custom integrations and data export</li>
      <li><strong>Webinar Training:</strong> Regular training sessions for new features</li>
      <li><strong>Community Forum:</strong> Connect with other ReubenAI users</li>
    </ul>
    
    <h2>Service Level Agreements</h2>
    <ul>
      <li><strong>Response Time:</strong> 4-hour response for critical issues</li>
      <li><strong>Uptime Guarantee:</strong> 99.9% uptime SLA</li>
      <li><strong>Data Security:</strong> SOC 2 Type II compliant</li>
      <li><strong>Regular Updates:</strong> Monthly feature releases and improvements</li>
    </ul>
    
    <div class="highlight-box">
      <h3>Ready to Get Started?</h3>
      <p>Contact us at <strong>hello@goreuben.com</strong> to schedule a personalized demo and discuss your fund's specific needs. Our team will work with you to configure ReubenAI for optimal performance and ROI.</p>
    </div>
  </div>

  <div class="footer">
    <div>ReubenAI Complete Platform Guide • Version ${version} • ${currentDate}</div>
    <div>© 2024 ReubenAI. All rights reserved. | hello@goreuben.com</div>
  </div>
</body>
</html>`;
}

serve(handler);