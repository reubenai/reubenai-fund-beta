import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const faqData = [
  {
    category: "Getting Started",
    icon: Target,
    questions: [
      {
        question: "How do I add a new deal to the pipeline?",
        answer: "Navigate to the Deal Pipeline page and click the '+' button in any stage, or use the 'Add Deal' button in the header. You can also upload multiple deals via CSV using the batch upload feature."
      },
      {
        question: "How do I move deals between pipeline stages?",
        answer: "Simply drag and drop deals between stages in the Kanban view. You can also edit the deal status in the deal details modal. All changes are automatically tracked."
      },
      {
        question: "What information should I include when adding a deal?",
        answer: "Company name is required. Include industry, location, website, deal size, valuation, and founder information for better AI analysis."
      }
    ]
  },
  {
    category: "AI Analysis",
    icon: Zap,
    questions: [
      {
        question: "How does the AI deal analysis work?",
        answer: "Our Reuben Orchestrator analyzes deals across 5 dimensions: Thesis Alignment, Market Research, Product & IP, Financial Health, and Team Analysis using 14+ specialized engines."
      },
      {
        question: "Why isn't my deal analysis working?",
        answer: "Ensure you've provided company name and website. Early-stage or very private companies may have limited public data for analysis."
      },
      {
        question: "How accurate is the AI scoring?",
        answer: "AI scores provide directional insights based on available data. Combine with your own due diligence for investment decisions."
      }
    ]
  },
  {
    category: "Investment Strategy",
    icon: Settings,
    questions: [
      {
        question: "How do I configure my investment strategy?",
        answer: "Go to Strategy → Investment Criteria to set your thesis, industry focus, geography, deal size parameters, and scoring weights."
      },
      {
        question: "Can different funds have different strategies?",
        answer: "Yes, each fund maintains its own strategy configuration. Switch funds to access fund-specific strategies and scoring."
      }
    ]
  },
  {
    category: "Data & Security",
    icon: Users,
    questions: [
      {
        question: "How secure is my deal data?",
        answer: "All data is encrypted in transit and at rest with enterprise-grade security. We comply with SOC 2 standards and your data is organization-specific."
      },
      {
        question: "Can I export my deal data?",
        answer: "Yes, export functionality is available in Settings. Exports include deal details, notes, analysis results, and activity history."
      }
    ]
  }
];

const quickGuides = [
  {
    title: "Pipeline Setup",
    description: "Get your deal pipeline configured",
    icon: TrendingUp,
    time: "5 min",
    steps: ["Create your first fund", "Configure pipeline stages", "Add your first deal", "Set up team access"]
  },
  {
    title: "AI Analysis",
    description: "Understanding AI insights",
    icon: Zap,
    time: "8 min",
    steps: ["Configure investment strategy", "Add deal with website", "Run AI analysis", "Interpret scores"]
  },
  {
    title: "Team Collaboration",
    description: "Set up your investment team",
    icon: Users,
    time: "10 min",
    steps: ["Invite team members", "Set user roles", "Configure permissions", "Create IC workflow"]
  }
];

const systemStatus = [
  { service: "Deal Pipeline", status: "operational", lastCheck: "2 min ago" },
  { service: "AI Analysis Engine", status: "operational", lastCheck: "1 min ago" },
  { service: "Data Sync", status: "operational", lastCheck: "5 min ago" },
  { service: "Authentication", status: "operational", lastCheck: "1 min ago" }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
  })).filter(category => selectedCategory ? category.category === selectedCategory : category.questions.length > 0);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'degraded': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'down': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-72 border-r border-border/50 bg-sidebar/30 min-h-screen">
          <div className="p-6 border-b border-border/50">
            <h2 className="font-semibold text-lg">Help & Support</h2>
            <p className="text-sm text-muted-foreground mt-1">Find answers and get assistance</p>
          </div>
          
          <div className="p-4">
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border/60"
              />
            </div>

            {/* Quick Guides */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Quick Start</h3>
              {quickGuides.map((guide, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 rounded-lg border border-border/50 hover:border-border hover:bg-background/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <guide.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{guide.title}</p>
                        <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{guide.description}</p>
                      <p className="text-xs text-primary mt-1">{guide.time} read</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Categories</h3>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`w-full text-left p-2.5 rounded-md text-sm transition-all ${
                  !selectedCategory ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                }`}
              >
                All Topics
              </button>
              {faqData.map((category) => (
                <button
                  key={category.category}
                  onClick={() => setSelectedCategory(category.category)}
                  className={`w-full text-left p-2.5 rounded-md text-sm transition-all flex items-center gap-2 ${
                    selectedCategory === category.category ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                  }`}
                >
                  <category.icon className="h-4 w-4" />
                  {category.category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-semibold">
                {selectedCategory || 'Frequently Asked Questions'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {selectedCategory 
                  ? `Common questions about ${selectedCategory.toLowerCase()}`
                  : 'Find answers to common questions about using ReubenAI'
                }
              </p>
            </div>

            {/* FAQ Content */}
            <div className="space-y-6">
              {filteredFAQ.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <category.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.category}</CardTitle>
                        <CardDescription>{category.questions.length} articles</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((item, index) => (
                        <AccordionItem key={index} value={`${categoryIndex}-${index}`} className="border-b border-border/50 last:border-0">
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <span className="font-medium">{item.question}</span>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* System Status */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  System Status
                </CardTitle>
                <CardDescription>Current status of ReubenAI services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemStatus.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <span className="font-medium">{service.service}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm capitalize text-emerald-600 font-medium">{service.status}</p>
                        <p className="text-xs text-muted-foreground">Updated {service.lastCheck}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Contact Support
                </CardTitle>
                <CardDescription>Need help? Get in touch with our team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Contact Methods */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-border/50">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Email Support</p>
                        <p className="text-sm text-muted-foreground">support@goreuben.com</p>
                        <p className="text-xs text-muted-foreground mt-1">Response within 24 hours</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 rounded-lg border border-border/50">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Documentation</p>
                        <p className="text-sm text-muted-foreground">Comprehensive guides and API docs</p>
                        <button className="text-xs text-primary hover:underline mt-1 flex items-center gap-1">
                          View Documentation <ExternalLink className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Support Form */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Your Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={supportForm.email}
                        onChange={(e) => setSupportForm({...supportForm, email: e.target.value})}
                        placeholder="your@email.com"
                        className="bg-background border-border/60"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                        placeholder="Brief description of your issue"
                        className="bg-background border-border/60"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={supportForm.description}
                        onChange={(e) => setSupportForm({...supportForm, description: e.target.value})}
                        placeholder="Detailed description of your issue..."
                        rows={4}
                        className="bg-background border-border/60"
                      />
                    </div>
                    
                    <Button onClick={handleSupportSubmit} className="w-full">
                      Submit Support Request
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}