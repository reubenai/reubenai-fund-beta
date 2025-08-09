import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react';

export function PlatformArchitectureDiagram() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Architecture Overview</CardTitle>
          <CardDescription>
            Complete system architecture showing data flow, queue processing, and component relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Architecture Diagram */}
          <div className="bg-muted/50 p-6 rounded-lg">
            <svg viewBox="0 0 1200 800" className="w-full h-auto">
              {/* Frontend Layer */}
              <g>
                <rect x="50" y="50" width="200" height="80" fill="hsl(var(--primary))" opacity="0.1" stroke="hsl(var(--primary))" strokeWidth="2" rx="8"/>
                <text x="150" y="75" textAnchor="middle" className="fill-foreground text-sm font-medium">Frontend Layer</text>
                <text x="150" y="95" textAnchor="middle" className="fill-muted-foreground text-xs">React + TypeScript</text>
                <text x="150" y="110" textAnchor="middle" className="fill-muted-foreground text-xs">Tailwind CSS</text>
              </g>

              {/* Pipeline Component */}
              <g>
                <rect x="50" y="160" width="120" height="60" fill="hsl(var(--secondary))" opacity="0.1" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="110" y="180" textAnchor="middle" className="fill-foreground text-xs">Pipeline View</text>
                <text x="110" y="195" textAnchor="middle" className="fill-muted-foreground text-xs">Deal Cards</text>
                <text x="110" y="210" textAnchor="middle" className="fill-muted-foreground text-xs">Kanban Board</text>
              </g>

              {/* Admin Dashboard */}
              <g>
                <rect x="180" y="160" width="120" height="60" fill="hsl(var(--secondary))" opacity="0.1" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="240" y="180" textAnchor="middle" className="fill-foreground text-xs">Admin Dashboard</text>
                <text x="240" y="195" textAnchor="middle" className="fill-muted-foreground text-xs">Queue Monitor</text>
                <text x="240" y="210" textAnchor="middle" className="fill-muted-foreground text-xs">System Health</text>
              </g>

              {/* API Layer */}
              <g>
                <rect x="400" y="50" width="200" height="80" fill="hsl(var(--accent))" opacity="0.1" stroke="hsl(var(--accent))" strokeWidth="2" rx="8"/>
                <text x="500" y="75" textAnchor="middle" className="fill-foreground text-sm font-medium">API Layer</text>
                <text x="500" y="95" textAnchor="middle" className="fill-muted-foreground text-xs">Supabase Client</text>
                <text x="500" y="110" textAnchor="middle" className="fill-muted-foreground text-xs">Real-time Subscriptions</text>
              </g>

              {/* Analysis Queue System */}
              <g>
                <rect x="350" y="160" width="300" height="120" fill="hsl(var(--destructive))" opacity="0.1" stroke="hsl(var(--destructive))" strokeWidth="2" rx="8"/>
                <text x="500" y="180" textAnchor="middle" className="fill-foreground text-sm font-medium">Analysis Queue System</text>
                
                {/* Queue Components */}
                <rect x="370" y="200" width="80" height="40" fill="hsl(var(--primary))" opacity="0.2" stroke="hsl(var(--primary))" strokeWidth="1" rx="4"/>
                <text x="410" y="220" textAnchor="middle" className="fill-foreground text-xs font-medium">Queue</text>
                <text x="410" y="235" textAnchor="middle" className="fill-muted-foreground text-xs">409 Items</text>

                <rect x="460" y="200" width="80" height="40" fill="hsl(var(--accent))" opacity="0.2" stroke="hsl(var(--accent))" strokeWidth="1" rx="4"/>
                <text x="500" y="220" textAnchor="middle" className="fill-foreground text-xs font-medium">Processor</text>
                <text x="500" y="235" textAnchor="middle" className="fill-muted-foreground text-xs">25 Concurrent</text>

                <rect x="550" y="200" width="80" height="40" fill="hsl(var(--secondary))" opacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="590" y="220" textAnchor="middle" className="fill-foreground text-xs font-medium">Monitor</text>
                <text x="590" y="235" textAnchor="middle" className="fill-muted-foreground text-xs">Health Check</text>
              </g>

              {/* Edge Functions */}
              <g>
                <rect x="750" y="50" width="200" height="80" fill="hsl(var(--chart-1))" opacity="0.1" stroke="hsl(var(--chart-1))" strokeWidth="2" rx="8"/>
                <text x="850" y="75" textAnchor="middle" className="fill-foreground text-sm font-medium">Edge Functions</text>
                <text x="850" y="95" textAnchor="middle" className="fill-muted-foreground text-xs">Analysis Orchestrator</text>
                <text x="850" y="110" textAnchor="middle" className="fill-muted-foreground text-xs">AI Engines</text>
              </g>

              {/* AI Engines */}
              <g>
                <rect x="700" y="160" width="120" height="50" fill="hsl(var(--chart-2))" opacity="0.1" stroke="hsl(var(--chart-2))" strokeWidth="1" rx="4"/>
                <text x="760" y="180" textAnchor="middle" className="fill-foreground text-xs">Financial Engine</text>
                <text x="760" y="195" textAnchor="middle" className="fill-muted-foreground text-xs">Revenue Analysis</text>
              </g>

              <g>
                <rect x="830" y="160" width="120" height="50" fill="hsl(var(--chart-3))" opacity="0.1" stroke="hsl(var(--chart-3))" strokeWidth="1" rx="4"/>
                <text x="890" y="180" textAnchor="middle" className="fill-foreground text-xs">Market Engine</text>
                <text x="890" y="195" textAnchor="middle" className="fill-muted-foreground text-xs">TAM/SAM/SOM</text>
              </g>

              <g>
                <rect x="960" y="160" width="120" height="50" fill="hsl(var(--chart-4))" opacity="0.1" stroke="hsl(var(--chart-4))" strokeWidth="1" rx="4"/>
                <text x="1020" y="180" textAnchor="middle" className="fill-foreground text-xs">Team Engine</text>
                <text x="1020" y="195" textAnchor="middle" className="fill-muted-foreground text-xs">Founder Research</text>
              </g>

              <g>
                <rect x="700" y="220" width="120" height="50" fill="hsl(var(--chart-5))" opacity="0.1" stroke="hsl(var(--chart-5))" strokeWidth="1" rx="4"/>
                <text x="760" y="240" textAnchor="middle" className="fill-foreground text-xs">Product Engine</text>
                <text x="760" y="255" textAnchor="middle" className="fill-muted-foreground text-xs">IP Assessment</text>
              </g>

              <g>
                <rect x="830" y="220" width="120" height="50" fill="hsl(var(--primary))" opacity="0.1" stroke="hsl(var(--primary))" strokeWidth="1" rx="4"/>
                <text x="890" y="240" textAnchor="middle" className="fill-foreground text-xs">Thesis Engine</text>
                <text x="890" y="255" textAnchor="middle" className="fill-muted-foreground text-xs">Alignment Score</text>
              </g>

              {/* Database Layer */}
              <g>
                <rect x="50" y="350" width="300" height="100" fill="hsl(var(--muted))" opacity="0.1" stroke="hsl(var(--border))" strokeWidth="2" rx="8"/>
                <text x="200" y="375" textAnchor="middle" className="fill-foreground text-sm font-medium">Supabase Database</text>
                
                {/* Database Tables */}
                <rect x="70" y="395" width="70" height="40" fill="hsl(var(--secondary))" opacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="105" y="415" textAnchor="middle" className="fill-foreground text-xs font-medium">Deals</text>

                <rect x="150" y="395" width="70" height="40" fill="hsl(var(--secondary))" opacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="185" y="415" textAnchor="middle" className="fill-foreground text-xs font-medium">Queue</text>

                <rect x="230" y="395" width="70" height="40" fill="hsl(var(--secondary))" opacity="0.2" stroke="hsl(var(--secondary))" strokeWidth="1" rx="4"/>
                <text x="265" y="415" textAnchor="middle" className="fill-foreground text-xs font-medium">Analysis</text>
              </g>

              {/* External APIs */}
              <g>
                <rect x="450" y="350" width="300" height="100" fill="hsl(var(--accent))" opacity="0.1" stroke="hsl(var(--accent))" strokeWidth="2" rx="8"/>
                <text x="600" y="375" textAnchor="middle" className="fill-foreground text-sm font-medium">External APIs</text>
                
                <rect x="470" y="395" width="70" height="40" fill="hsl(var(--chart-1))" opacity="0.2" stroke="hsl(var(--chart-1))" strokeWidth="1" rx="4"/>
                <text x="505" y="415" textAnchor="middle" className="fill-foreground text-xs font-medium">OpenAI</text>

                <rect x="550" y="395" width="70" height="40" fill="hsl(var(--chart-2))" opacity="0.2" stroke="hsl(var(--chart-2))" strokeWidth="1" rx="4"/>
                <text x="585" y="415" textAnchor="middle" className="fill-foreground text-xs font-medium">Google</text>

                <rect x="630" y="395" width="70" height="40" fill="hsl(var(--chart-3))" opacity="0.2" stroke="hsl(var(--chart-3))" strokeWidth="1" rx="4"/>
                <text x="665" y="415" textAnchor="middle" className="fill-foreground text-xs font-medium">Perplexity</text>
              </g>

              {/* Data Flow Arrows */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
                </marker>
              </defs>

              {/* Frontend to API */}
              <line x1="250" y1="90" x2="400" y2="90" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>

              {/* API to Queue */}
              <line x1="500" y1="130" x2="500" y2="160" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>

              {/* Queue to Engines */}
              <line x1="650" y1="220" x2="700" y2="190" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>
              <line x1="650" y1="220" x2="830" y2="190" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>
              <line x1="650" y1="220" x2="960" y2="190" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>

              {/* Queue to Database */}
              <line x1="450" y1="280" x2="350" y2="350" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>

              {/* Engines to External APIs */}
              <line x1="760" y1="270" x2="600" y2="350" stroke="hsl(var(--muted-foreground))" strokeWidth="2" markerEnd="url(#arrowhead)"/>
            </svg>
          </div>

          {/* System Health Indicators */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm">Queue Bottleneck</span>
              <Badge variant="destructive">Critical</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm">Processing Load</span>
              <Badge variant="secondary">High</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Engine Status</span>
              <Badge variant="outline">Mixed</Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Database Health</span>
              <Badge variant="default">Good</Badge>
            </div>
          </div>

          {/* Key Issues & Solutions */}
          <div className="mt-6 space-y-4">
            <h4 className="font-medium">Current Issues & Solutions:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-destructive mb-1">🚨 Queue Bottleneck</h5>
                <p className="text-muted-foreground mb-2">409 queued deals, 13/10 concurrent processing</p>
                <p className="text-green-600">✅ Fixed: Increased to 25 concurrent slots</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-amber-600 mb-1">⚠️ Company Name Display</h5>
                <p className="text-muted-foreground mb-2">QueuePositionIndicator causing "#undefined"</p>
                <p className="text-green-600">✅ Fixed: Added error handling & validation</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-blue-600 mb-1">🔧 Deep-Dive Data Flow</h5>
                <p className="text-muted-foreground mb-2">Engine results not populating deep-dive sections</p>
                <p className="text-amber-600">🚧 In Progress: Enhanced data mapper</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h5 className="font-medium text-green-600 mb-1">✅ UI/UX Fixes</h5>
                <p className="text-muted-foreground mb-2">Admin duplicates, breadcrumb alignment</p>
                <p className="text-green-600">✅ Fixed: Clean admin interface</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}