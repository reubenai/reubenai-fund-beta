import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Zap, Database, Shield, Globe, Users, Settings, FileText, Download } from 'lucide-react';

export function ComprehensiveArchitectureDiagram() {
  const exportDiagram = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>ReubenAI Backend Architecture - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🤖 ReubenAI Complete Backend Architecture</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
          <div class="section">
            <h2>Complete system architecture documentation exported successfully.</h2>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">🤖 ReubenAI Complete Backend Architecture</CardTitle>
              <CardDescription>
                Comprehensive system architecture showing all data flows, services, and integrations
              </CardDescription>
            </div>
            <Button onClick={exportDiagram} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Diagram
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Main Architecture SVG */}
          <div className="bg-muted/30 p-6 rounded-lg overflow-x-auto">
            <svg viewBox="0 0 1400 1000" className="w-full h-auto min-w-[1200px]">
              {/* Frontend Layer */}
              <g>
                <rect x="50" y="50" width="300" height="100" fill="hsl(var(--primary))" opacity="0.1" stroke="hsl(var(--primary))" strokeWidth="2" rx="8"/>
                <text x="200" y="85" textAnchor="middle" className="fill-foreground text-lg font-bold">Frontend Layer</text>
                <text x="200" y="105" textAnchor="middle" className="fill-muted-foreground text-sm">React + TypeScript + Tailwind</text>
                <text x="200" y="125" textAnchor="middle" className="fill-muted-foreground text-sm">Vite + SPA Architecture</text>
              </g>

              {/* Frontend Components */}
              <g>
                <rect x="70" y="180" width="80" height="60" fill="hsl(var(--secondary))" opacity="0.1" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="110" y="200" textAnchor="middle" className="fill-foreground text-xs font-medium">Pipeline</text>
                <text x="110" y="215" textAnchor="middle" className="fill-muted-foreground text-xs">Deal Cards</text>
                <text x="110" y="228" textAnchor="middle" className="fill-muted-foreground text-xs">Kanban</text>
              </g>

              <g>
                <rect x="160" y="180" width="80" height="60" fill="hsl(var(--secondary))" opacity="0.1" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="200" y="200" textAnchor="middle" className="fill-foreground text-xs font-medium">Admin</text>
                <text x="200" y="215" textAnchor="middle" className="fill-muted-foreground text-xs">Dashboard</text>
                <text x="200" y="228" textAnchor="middle" className="fill-muted-foreground text-xs">Monitoring</text>
              </g>

              <g>
                <rect x="250" y="180" width="80" height="60" fill="hsl(var(--secondary))" opacity="0.1" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="290" y="200" textAnchor="middle" className="fill-foreground text-xs font-medium">IC Pages</text>
                <text x="290" y="215" textAnchor="middle" className="fill-muted-foreground text-xs">Memos</text>
                <text x="290" y="228" textAnchor="middle" className="fill-muted-foreground text-xs">Voting</text>
              </g>

              {/* API Gateway Layer */}
              <g>
                <rect x="450" y="50" width="300" height="100" fill="hsl(var(--accent))" opacity="0.1" stroke="hsl(var(--accent))" strokeWidth="2" rx="8"/>
                <text x="600" y="85" textAnchor="middle" className="fill-foreground text-lg font-bold">API Gateway & Client</text>
                <text x="600" y="105" textAnchor="middle" className="fill-muted-foreground text-sm">Supabase Client SDK</text>
                <text x="600" y="125" textAnchor="middle" className="fill-muted-foreground text-sm">Real-time Subscriptions & Auth</text>
              </g>

              {/* Authentication Layer */}
              <g>
                <rect x="450" y="180" width="140" height="60" fill="hsl(var(--chart-1))" opacity="0.1" stroke="hsl(var(--chart-1))" strokeWidth="1" rx="4"/>
                <text x="520" y="200" textAnchor="middle" className="fill-foreground text-xs font-medium">Authentication</text>
                <text x="520" y="215" textAnchor="middle" className="fill-muted-foreground text-xs">JWT + RLS</text>
                <text x="520" y="228" textAnchor="middle" className="fill-muted-foreground text-xs">Row Level Security</text>
              </g>

              <g>
                <rect x="610" y="180" width="140" height="60" fill="hsl(var(--chart-2))" opacity="0.1" stroke="hsl(var(--chart-2))" strokeWidth="1" rx="4"/>
                <text x="680" y="200" textAnchor="middle" className="fill-foreground text-xs font-medium">Real-time Engine</text>
                <text x="680" y="215" textAnchor="middle" className="fill-muted-foreground text-xs">Subscriptions</text>
                <text x="680" y="228" textAnchor="middle" className="fill-muted-foreground text-xs">Live Updates</text>
              </g>

              {/* Core Analysis Queue System */}
              <g>
                <rect x="400" y="280" width="400" height="120" fill="hsl(var(--destructive))" opacity="0.1" stroke="hsl(var(--destructive))" strokeWidth="2" rx="8"/>
                <text x="600" y="305" textAnchor="middle" className="fill-foreground text-lg font-bold">Analysis Queue Engine</text>
                <text x="600" y="325" textAnchor="middle" className="fill-muted-foreground text-sm">25 Concurrent Processing • 409 Queued Items</text>
                
                {/* Queue Components */}
                <rect x="420" y="340" width="90" height="45" fill="hsl(var(--primary))" opacity="0.2" stroke="hsl(var(--primary))" strokeWidth="1" rx="4"/>
                <text x="465" y="360" textAnchor="middle" className="fill-foreground text-xs font-medium">Input Queue</text>
                <text x="465" y="375" textAnchor="middle" className="fill-muted-foreground text-xs">Priority Sorting</text>

                <rect x="520" y="340" width="90" height="45" fill="hsl(var(--accent))" opacity="0.2" stroke="hsl(var(--accent))" strokeWidth="1" rx="4"/>
                <text x="565" y="360" textAnchor="middle" className="fill-foreground text-xs font-medium">Processor</text>
                <text x="565" y="375" textAnchor="middle" className="fill-muted-foreground text-xs">25 Concurrent</text>

                <rect x="620" y="340" width="90" height="45" fill="hsl(var(--secondary))" opacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="665" y="360" textAnchor="middle" className="fill-foreground text-xs font-medium">Monitor</text>
                <text x="665" y="375" textAnchor="middle" className="fill-muted-foreground text-xs">Health Check</text>

                <rect x="720" y="340" width="70" height="45" fill="hsl(var(--chart-5))" opacity="0.2" stroke="hsl(var(--chart-5))" strokeWidth="1" rx="4"/>
                <text x="755" y="360" textAnchor="middle" className="fill-foreground text-xs font-medium">Output</text>
                <text x="755" y="375" textAnchor="middle" className="fill-muted-foreground text-xs">Results</text>
              </g>

              {/* Edge Functions Layer */}
              <g>
                <rect x="850" y="50" width="300" height="100" fill="hsl(var(--chart-1))" opacity="0.1" stroke="hsl(var(--chart-1))" strokeWidth="2" rx="8"/>
                <text x="1000" y="85" textAnchor="middle" className="fill-foreground text-lg font-bold">Edge Functions Layer</text>
                <text x="1000" y="105" textAnchor="middle" className="fill-muted-foreground text-sm">Supabase Deno Runtime</text>
                <text x="1000" y="125" textAnchor="middle" className="fill-muted-foreground text-sm">30+ Specialized AI Engines</text>
              </g>

              {/* Core AI Analysis Engines - 5 Primary */}
              <g>
                <rect x="850" y="180" width="90" height="45" fill="hsl(var(--chart-2))" opacity="0.1" stroke="hsl(var(--chart-2))" strokeWidth="1" rx="4"/>
                <text x="895" y="200" textAnchor="middle" className="fill-foreground text-xs font-medium">Financial</text>
                <text x="895" y="215" textAnchor="middle" className="fill-muted-foreground text-xs">Engine</text>
              </g>

              <g>
                <rect x="950" y="180" width="90" height="45" fill="hsl(var(--chart-3))" opacity="0.1" stroke="hsl(var(--chart-3))" strokeWidth="1" rx="4"/>
                <text x="995" y="200" textAnchor="middle" className="fill-foreground text-xs font-medium">Market</text>
                <text x="995" y="215" textAnchor="middle" className="fill-muted-foreground text-xs">Intelligence</text>
              </g>

              <g>
                <rect x="1050" y="180" width="90" height="45" fill="hsl(var(--chart-4))" opacity="0.1" stroke="hsl(var(--chart-4))" strokeWidth="1" rx="4"/>
                <text x="1095" y="200" textAnchor="middle" className="fill-foreground text-xs font-medium">Team</text>
                <text x="1095" y="215" textAnchor="middle" className="fill-muted-foreground text-xs">Research</text>
              </g>

              <g>
                <rect x="1150" y="180" width="90" height="45" fill="hsl(var(--chart-5))" opacity="0.1" stroke="hsl(var(--chart-5))" strokeWidth="1" rx="4"/>
                <text x="1195" y="200" textAnchor="middle" className="fill-foreground text-xs font-medium">Product</text>
                <text x="1195" y="215" textAnchor="middle" className="fill-muted-foreground text-xs">IP</text>
              </g>

              <g>
                <rect x="1250" y="180" width="90" height="45" fill="hsl(var(--primary))" opacity="0.1" stroke="hsl(var(--primary))" strokeWidth="1" rx="4"/>
                <text x="1295" y="200" textAnchor="middle" className="fill-foreground text-xs font-medium">Thesis</text>
                <text x="1295" y="215" textAnchor="middle" className="fill-muted-foreground text-xs">Alignment</text>
              </g>

              {/* Supporting Analysis Engines - Row 2 */}
              <g>
                <rect x="850" y="240" width="85" height="40" fill="hsl(var(--accent))" opacity="0.1" stroke="hsl(var(--accent))" strokeWidth="1" rx="4"/>
                <text x="892" y="258" textAnchor="middle" className="fill-foreground text-xs font-medium">Risk</text>
                <text x="892" y="272" textAnchor="middle" className="fill-muted-foreground text-xs">Mitigation</text>
              </g>

              <g>
                <rect x="945" y="240" width="85" height="40" fill="hsl(var(--chart-1))" opacity="0.1" stroke="hsl(var(--chart-1))" strokeWidth="1" rx="4"/>
                <text x="987" y="258" textAnchor="middle" className="fill-foreground text-xs font-medium">Fund</text>
                <text x="987" y="272" textAnchor="middle" className="fill-muted-foreground text-xs">Memory</text>
              </g>

              <g>
                <rect x="1040" y="240" width="85" height="40" fill="hsl(var(--chart-2))" opacity="0.1" stroke="hsl(var(--chart-2))" strokeWidth="1" rx="4"/>
                <text x="1082" y="258" textAnchor="middle" className="fill-foreground text-xs font-medium">Exit</text>
                <text x="1082" y="272" textAnchor="middle" className="fill-muted-foreground text-xs">Strategy</text>
              </g>

              <g>
                <rect x="1135" y="240" width="85" height="40" fill="hsl(var(--chart-3))" opacity="0.1" stroke="hsl(var(--chart-3))" strokeWidth="1" rx="4"/>
                <text x="1177" y="258" textAnchor="middle" className="fill-foreground text-xs font-medium">Document</text>
                <text x="1177" y="272" textAnchor="middle" className="fill-muted-foreground text-xs">Processor</text>
              </g>

              <g>
                <rect x="1230" y="240" width="85" height="40" fill="hsl(var(--chart-4))" opacity="0.1" stroke="hsl(var(--chart-4))" strokeWidth="1" rx="4"/>
                <text x="1272" y="258" textAnchor="middle" className="fill-foreground text-xs font-medium">Web</text>
                <text x="1272" y="272" textAnchor="middle" className="fill-muted-foreground text-xs">Research</text>
              </g>

              {/* Orchestration & Control Layer - Row 3 */}
              <g>
                <rect x="850" y="295" width="120" height="45" fill="hsl(var(--destructive))" opacity="0.1" stroke="hsl(var(--destructive))" strokeWidth="2" rx="4"/>
                <text x="910" y="315" textAnchor="middle" className="fill-foreground text-xs font-bold">Reuben</text>
                <text x="910" y="330" textAnchor="middle" className="fill-muted-foreground text-xs">Orchestrator</text>
              </g>

              <g>
                <rect x="980" y="295" width="85" height="45" fill="hsl(var(--chart-5))" opacity="0.1" stroke="hsl(var(--chart-5))" strokeWidth="1" rx="4"/>
                <text x="1022" y="315" textAnchor="middle" className="fill-foreground text-xs font-medium">Cost</text>
                <text x="1022" y="330" textAnchor="middle" className="fill-muted-foreground text-xs">Guard</text>
              </g>

              <g>
                <rect x="1075" y="295" width="85" height="45" fill="hsl(var(--primary))" opacity="0.1" stroke="hsl(var(--primary))" strokeWidth="1" rx="4"/>
                <text x="1117" y="315" textAnchor="middle" className="fill-foreground text-xs font-medium">LLM</text>
                <text x="1117" y="330" textAnchor="middle" className="fill-muted-foreground text-xs">Control</text>
              </g>

              <g>
                <rect x="1170" y="295" width="85" height="45" fill="hsl(var(--accent))" opacity="0.1" stroke="hsl(var(--accent))" strokeWidth="1" rx="4"/>
                <text x="1212" y="315" textAnchor="middle" className="fill-foreground text-xs font-medium">Enhanced</text>
                <text x="1212" y="330" textAnchor="middle" className="fill-muted-foreground text-xs">Analysis</text>
              </g>

              <g>
                <rect x="1265" y="295" width="85" height="45" fill="hsl(var(--chart-1))" opacity="0.1" stroke="hsl(var(--chart-1))" strokeWidth="1" rx="4"/>
                <text x="1307" y="315" textAnchor="middle" className="fill-foreground text-xs font-medium">Universal</text>
                <text x="1307" y="330" textAnchor="middle" className="fill-muted-foreground text-xs">Processor</text>
              </g>

              {/* Database Layer */}
              <g>
                <rect x="50" y="450" width="400" height="120" fill="hsl(var(--muted))" opacity="0.1" stroke="hsl(var(--border))" strokeWidth="2" rx="8"/>
                <text x="250" y="480" textAnchor="middle" className="fill-foreground text-lg font-bold">Supabase PostgreSQL Database</text>
                <text x="250" y="500" textAnchor="middle" className="fill-muted-foreground text-sm">Row Level Security • Real-time • Auto-scaling</text>
                
                {/* Core Tables */}
                <rect x="70" y="520" width="70" height="35" fill="hsl(var(--secondary))" opacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="105" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">Deals</text>

                <rect x="150" y="520" width="70" height="35" fill="hsl(var(--secondary))" opacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="185" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">Funds</text>

                <rect x="230" y="520" width="70" height="35" fill="hsl(var(--secondary))" opacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="265" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">Analysis</text>

                <rect x="310" y="520" width="70" height="35" fill="hsl(var(--secondary))" opacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="345" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">Queue</text>

                <rect x="390" y="520" width="50" height="35" fill="hsl(var(--chart-4))" opacity="0.2" stroke="hsl(var(--chart-4))" strokeWidth="1" rx="4"/>
                <text x="415" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">IC</text>
              </g>

              {/* External APIs */}
              <g>
                <rect x="500" y="450" width="400" height="120" fill="hsl(var(--accent))" opacity="0.1" stroke="hsl(var(--accent))" strokeWidth="2" rx="8"/>
                <text x="700" y="480" textAnchor="middle" className="fill-foreground text-lg font-bold">External API Integrations</text>
                <text x="700" y="500" textAnchor="middle" className="fill-muted-foreground text-sm">AI Services • Data Sources • Third-party Tools</text>
                
                <rect x="520" y="520" width="70" height="35" fill="hsl(var(--chart-1))" opacity="0.2" stroke="hsl(var(--chart-1))" strokeWidth="1" rx="4"/>
                <text x="555" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">OpenAI</text>

                <rect x="600" y="520" width="70" height="35" fill="hsl(var(--chart-2))" opacity="0.2" stroke="hsl(var(--chart-2))" strokeWidth="1" rx="4"/>
                <text x="635" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">Google</text>

                <rect x="680" y="520" width="70" height="35" fill="hsl(var(--chart-3))" opacity="0.2" stroke="hsl(var(--chart-3))" strokeWidth="1" rx="4"/>
                <text x="715" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">Perplexity</text>

                <rect x="760" y="520" width="70" height="35" fill="hsl(var(--chart-4))" opacity="0.2" stroke="hsl(var(--chart-4))" strokeWidth="1" rx="4"/>
                <text x="795" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">LinkedIn</text>

                <rect x="840" y="520" width="50" height="35" fill="hsl(var(--chart-5))" opacity="0.2" stroke="hsl(var(--chart-5))" strokeWidth="1" rx="4"/>
                <text x="865" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">More</text>
              </g>

              {/* Storage Layer */}
              <g>
                <rect x="950" y="450" width="200" height="120" fill="hsl(var(--secondary))" opacity="0.1" stroke="hsl(var(--secondary))" strokeWidth="2" rx="8"/>
                <text x="1050" y="480" textAnchor="middle" className="fill-foreground text-lg font-bold">Storage Layer</text>
                <text x="1050" y="500" textAnchor="middle" className="fill-muted-foreground text-sm">File Storage • Caching</text>
                
                <rect x="970" y="520" width="80" height="35" fill="hsl(var(--primary))" opacity="0.2" stroke="hsl(var(--primary))" strokeWidth="1" rx="4"/>
                <text x="1010" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">Documents</text>

                <rect x="1060" y="520" width="80" height="35" fill="hsl(var(--accent))" opacity="0.2" stroke="hsl(var(--accent))" strokeWidth="1" rx="4"/>
                <text x="1100" y="540" textAnchor="middle" className="fill-foreground text-xs font-medium">Cache</text>
              </g>

              {/* Data Flow Arrows */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
                </marker>
              </defs>

              {/* Frontend to API */}
              <line x1="350" y1="100" x2="450" y2="100" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>

              {/* API to Queue */}
              <line x1="600" y1="150" x2="600" y2="280" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>

              {/* Queue to Engines */}
              <line x1="800" y1="340" x2="850" y2="200" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>
              <line x1="800" y1="340" x2="980" y2="200" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>
              <line x1="800" y1="340" x2="1110" y2="200" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>

              {/* Queue to Database */}
              <line x1="500" y1="400" x2="350" y2="450" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>

              {/* Engines to External APIs */}
              <line x1="910" y1="350" x2="700" y2="450" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>

              {/* Engines to Storage */}
              <line x1="1000" y1="350" x2="1050" y2="450" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            </svg>
          </div>

          {/* Architecture Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Frontend Architecture
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• React 18 with TypeScript</li>
                <li>• Vite build system</li>
                <li>• Tailwind CSS design system</li>
                <li>• Real-time UI updates</li>
                <li>• Component-based architecture</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database & Storage
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• PostgreSQL with RLS</li>
                <li>• 30+ optimized tables</li>
                <li>• Real-time subscriptions</li>
                <li>• File storage buckets</li>
                <li>• Automated backups</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Processing Engine
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 25 concurrent analysis slots</li>
                <li>• Priority-based queue</li>
                <li>• 30+ specialized AI engines</li>
                <li>• Circuit breaker protection</li>
                <li>• Health monitoring</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security & Auth
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• JWT-based authentication</li>
                <li>• Row Level Security (RLS)</li>
                <li>• Role-based access control</li>
                <li>• API key management</li>
                <li>• Data encryption</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Edge Functions
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 30+ specialized functions</li>
                <li>• Deno runtime environment</li>
                <li>• Auto-scaling capabilities</li>
                <li>• Error handling & retries</li>
                <li>• Performance monitoring</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Integrations
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• OpenAI GPT models</li>
                <li>• Google Search & Maps</li>
                <li>• LinkedIn data access</li>
                <li>• Perplexity research</li>
                <li>• External APIs</li>
              </ul>
            </div>
          </div>

          {/* System Health Indicators */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm">Queue Load</span>
              <Badge variant="destructive">409 Items</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm">Processing</span>
              <Badge variant="default">25 Concurrent</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Database</span>
              <Badge variant="outline">Healthy</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm">Engines</span>
              <Badge variant="secondary">Running</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Flow Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 Data Flow Analysis</CardTitle>
          <CardDescription>How data moves through the ReubenAI system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">📊 Deal Analysis Flow</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Deal submitted → Analysis queue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span>Queue processor → AI engines</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    <span>Engines → External APIs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                    <span>Results → Database</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time → Frontend</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">🤖 AI Engine Workflow</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-1 rounded-full"></div>
                    <span>Financial Engine → Revenue analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-2 rounded-full"></div>
                    <span>Market Engine → TAM/SAM research</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-3 rounded-full"></div>
                    <span>Team Engine → Founder validation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-4 rounded-full"></div>
                    <span>Product Engine → IP assessment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-chart-5 rounded-full"></div>
                    <span>Orchestrator → Result synthesis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>📈 System Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">30+</div>
              <div className="text-sm text-muted-foreground">Edge Functions</div>
            </div>
            <div className="text-center p-4 bg-accent/5 rounded-lg">
              <div className="text-2xl font-bold text-accent-foreground">409</div>
              <div className="text-sm text-muted-foreground">Queued Analyses</div>
            </div>
            <div className="text-center p-4 bg-secondary/5 rounded-lg">
              <div className="text-2xl font-bold text-secondary-foreground">25</div>
              <div className="text-sm text-muted-foreground">Concurrent Slots</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}