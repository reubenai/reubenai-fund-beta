import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  MessageSquare, 
  Mail, 
  Phone, 
  FileText, 
  Video, 
  Users, 
  BookOpen,
  HelpCircle,
  Zap,
  Settings,
  TrendingUp,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I add a new deal to the pipeline?",
        answer: "You can add deals in several ways: 1) Click the '+' button in any pipeline stage, 2) Use the 'Add Deal' button in the pipeline header, 3) Upload multiple deals via CSV using the batch upload feature. Fill in the company details and the deal will be added to the 'Sourced' stage by default."
      },
      {
        question: "How do I move deals between pipeline stages?",
        answer: "Simply drag and drop deals between stages in the Kanban view. You can also use the deal details modal to change the status. All stage changes are automatically tracked in the activity log."
      },
      {
        question: "What information should I include when adding a deal?",
        answer: "At minimum, include the company name. Additional helpful information includes: industry, location, website, deal size, valuation, founder information, and a brief description of the business."
      }
    ]
  },
  {
    category: "AI Analysis",
    questions: [
      {
        question: "How does the AI deal analysis work?",
        answer: "Our AI system analyzes deals across 5 key dimensions: Investment Thesis Alignment, Market Research, Product & IP Analysis, Financial Analysis, and Team Research. It pulls data from multiple sources including company websites, public databases, and financial records to provide comprehensive insights."
      },
      {
        question: "Why is my deal analysis not working?",
        answer: "Analysis requires sufficient company information. Ensure you've provided at least the company name and website. If analysis still fails, the company might be too early-stage or private to have sufficient public data available."
      },
      {
        question: "How accurate is the AI scoring?",
        answer: "AI scores are based on available data and should be used as a starting point for your analysis. They're most accurate for companies with substantial public presence. Always combine AI insights with your own due diligence."
      }
    ]
  },
  {
    category: "Pipeline Management",
    questions: [
      {
        question: "Can I customize pipeline stages?",
        answer: "Yes! Fund managers can rename existing stages, reorder them, and add custom stages. Go to Pipeline Settings to configure stages for your fund's specific workflow."
      },
      {
        question: "How do I track deal progress?",
        answer: "Each deal shows its current stage, last update time, and has an activity log tracking all changes. You can add notes, upload documents, and set next actions to track progress."
      },
      {
        question: "What's the difference between pipeline views?",
        answer: "Kanban view shows deals as cards in columns by stage. List view shows a compact list format. Table view provides detailed information in rows. Funnel view shows conversion rates between stages."
      }
    ]
  },
  {
    category: "Investment Strategy",
    questions: [
      {
        question: "How do I set up my investment strategy?",
        answer: "Go to the Strategy page to configure your investment thesis, criteria weights, target industries, geographic focus, and deal size parameters. This helps the AI provide more relevant analysis and recommendations."
      },
      {
        question: "Can I have different strategies for different funds?",
        answer: "Yes, each fund can have its own investment strategy configuration. Switch between funds to see strategy-specific insights and deal scoring."
      }
    ]
  },
  {
    category: "Data & Security",
    questions: [
      {
        question: "How secure is my deal data?",
        answer: "All data is encrypted in transit and at rest. We use enterprise-grade security measures and comply with SOC 2 standards. Your deal data is only accessible to users in your organization."
      },
      {
        question: "Can I export my deal data?",
        answer: "Yes, you can export deals and analysis data from the Settings page. Exports include deal details, notes, analysis results, and activity history."
      },
      {
        question: "How do I manage user access?",
        answer: "Admins can manage user roles and permissions from the Admin page. Different roles (Viewer, Analyst, Fund Manager, Admin) have different levels of access to deals and features."
      }
    ]
  }
];

const quickLinks = [
  { title: "Pipeline Tutorial", icon: Video, description: "5-minute video walkthrough" },
  { title: "AI Analysis Guide", icon: Zap, description: "Understanding AI insights" },
  { title: "Strategy Setup", icon: Settings, description: "Configure investment criteria" },
  { title: "Team Management", icon: Users, description: "Add and manage users" },
  { title: "Data Export", icon: FileText, description: "Export your deals" },
  { title: "API Documentation", icon: BookOpen, description: "Developer resources" }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [supportForm, setSupportForm] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    email: ''
  });
  const { toast } = useToast();

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const handleSupportSubmit = () => {
    if (!supportForm.subject || !supportForm.description || !supportForm.email) {
      toast({
        title: "Please fill in all fields",
        description: "Subject, description, and email are required.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Support request submitted",
      description: "We'll get back to you within 24 hours.",
    });
    setSupportForm({ subject: '', description: '', priority: 'medium', email: '' });
  };

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Help & Support</h1>
        <p className="text-sm text-muted-foreground">Learn how to use Reuben and get assistance when needed</p>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="h-12 w-auto bg-background border rounded-lg p-1">
          <TabsTrigger value="guides" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <BookOpen className="h-4 w-4 mr-2" />
            How Reuben Works
          </TabsTrigger>
          <TabsTrigger value="faq" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <HelpCircle className="h-4 w-4 mr-2" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="contact" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="status" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Search our knowledge base for quick answers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-6">
                {filteredFAQ.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{category.category}</h3>
                      <Badge variant="secondary">{category.questions.length}</Badge>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((item, index) => (
                        <AccordionItem key={index} value={`${categoryIndex}-${index}`}>
                          <AccordionTrigger className="text-left">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>

              {filteredFAQ.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No FAQ items match your search.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          {/* How Reuben Works */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                How Reuben Works
              </CardTitle>
              <CardDescription>Understanding our AI-powered investment platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">
                  Reuben is an AI-powered investment platform that helps you source, analyze, and manage investment opportunities with unprecedented efficiency and insight.
                </p>
              </div>
              
              <div className="grid gap-4">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-900 mb-2">1. Intelligent Deal Sourcing</h4>
                  <p className="text-sm text-blue-700">Our AI continuously monitors markets and identifies opportunities that match your investment criteria, bringing you high-quality deals before they hit the mainstream market.</p>
                </div>
                
                <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                  <h4 className="font-medium text-green-900 mb-2">2. Reuben Orchestrator Analysis</h4>
                  <p className="text-sm text-green-700">Our proprietary Reuben Orchestrator runs comprehensive analysis across 14+ data engines, evaluating market opportunity, product differentiation, team strength, financial health, and investment thesis alignment.</p>
                </div>
                
                <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                  <h4 className="font-medium text-purple-900 mb-2">3. Investment Committee Support</h4>
                  <p className="text-sm text-purple-700">Generate professional IC memos automatically, schedule sessions, track voting, and manage the entire investment decision process with AI-powered insights.</p>
                </div>
                
                <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                  <h4 className="font-medium text-amber-900 mb-2">4. Portfolio Intelligence</h4>
                  <p className="text-sm text-amber-700">Track portfolio performance, get early warning signals, and receive strategic recommendations to maximize your investment outcomes.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Setup Guide */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Strategy Thesis Setup Guide
              </CardTitle>
              <CardDescription>Step-by-step guide to configure your investment strategy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-medium">Define Investment Focus</h4>
                    <p className="text-sm text-muted-foreground">Set your target industries, geographic focus, deal size range, and investment stage preferences.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-medium">Configure AI Criteria</h4>
                    <p className="text-sm text-muted-foreground">Weight different analysis categories (market, team, product, financials) based on your investment philosophy.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-medium">Set Scoring Thresholds</h4>
                    <p className="text-sm text-muted-foreground">Define what constitutes "Exciting" (85+), "Promising" (70+), and "Needs Development" (50+) deals for your fund.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h4 className="font-medium">Launch & Refine</h4>
                    <p className="text-sm text-muted-foreground">Start analyzing deals and refine your criteria based on AI insights and actual deal outcomes.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reuben Orchestrator */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Reuben Orchestrator
              </CardTitle>
              <CardDescription>Our proprietary AI analysis engine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The Reuben Orchestrator is our proprietary AI engine that runs comprehensive analysis on every deal, combining multiple data sources and analytical frameworks to provide you with actionable insights.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Analysis Engines</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Market Research Engine</li>
                    <li>• Product & IP Analysis Engine</li>
                    <li>• Financial Health Engine</li>
                    <li>• Team Research Engine</li>
                    <li>• Competitive Landscape Engine</li>
                    <li>• Thesis Alignment Engine</li>
                    <li>• RAG Calculation Engine</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium">Data Sources</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Company websites & public filings</li>
                    <li>• Patent databases & IP registries</li>
                    <li>• Financial databases & records</li>
                    <li>• LinkedIn & professional networks</li>
                    <li>• News & market intelligence</li>
                    <li>• Industry reports & analysis</li>
                    <li>• Regulatory filings & compliance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Get help with technical issues or questions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={supportForm.description}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide detailed information about your issue or question"
                    rows={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={supportForm.email}
                    onChange={(e) => setSupportForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high', 'urgent'].map((priority) => (
                      <Button
                        key={priority}
                        variant={supportForm.priority === priority ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSupportForm(prev => ({ ...prev, priority }))}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleSupportSubmit} className="w-full">
                  Submit Support Request
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Other Ways to Reach Us</CardTitle>
                <CardDescription>Alternative contact methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Mail className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="font-medium">Email Support</h4>
                    <p className="text-sm text-muted-foreground">support@reuben.com</p>
                    <p className="text-xs text-muted-foreground">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <Phone className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="font-medium">Phone Support</h4>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="text-xs text-muted-foreground">Mon-Fri 9AM-6PM EST</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border rounded-lg">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  <div>
                    <h4 className="font-medium">Live Chat</h4>
                    <p className="text-sm text-muted-foreground">Available during business hours</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Start Chat
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Enterprise Support</h4>
                  <p className="text-sm text-muted-foreground">
                    For enterprise customers, contact your dedicated account manager or reach out to enterprise@reuben.com for priority support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Real-time status of our services and recent updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium">Core Platform</h4>
                      <p className="text-sm text-muted-foreground">All systems operational</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium">AI Analysis Engine</h4>
                      <p className="text-sm text-muted-foreground">Processing normally</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Operational</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium">Data Sync</h4>
                      <p className="text-sm text-muted-foreground">Minor delays in external data</p>
                    </div>
                  </div>
                  <Badge variant="outline">Degraded</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <h4 className="font-medium">File Storage</h4>
                      <p className="text-sm text-muted-foreground">Upload and download working</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Operational</Badge>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Recent Updates</h4>
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
                    <p className="text-sm font-medium">Enhanced AI Analysis Released</p>
                    <p className="text-xs text-muted-foreground">Jan 30, 2025 - New multi-engine analysis system deployed</p>
                  </div>
                  <div className="p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20">
                    <p className="text-sm font-medium">Performance Improvements</p>
                    <p className="text-xs text-muted-foreground">Jan 28, 2025 - Pipeline loading speed increased by 40%</p>
                  </div>
                  <div className="p-3 border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
                    <p className="text-sm font-medium">Scheduled Maintenance</p>
                    <p className="text-xs text-muted-foreground">Jan 25, 2025 - Database optimization completed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}