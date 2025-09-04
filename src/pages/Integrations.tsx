import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Webhook, 
  Zap, 
  Database, 
  MessageSquare, 
  Mail, 
  Slack, 
  Chrome,
  Settings
} from 'lucide-react';
import { WebhookSettingsPage } from '@/components/webhooks/WebhookSettingsPage';

interface IntegrationCard {
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'available' | 'coming_soon' | 'beta';
  category: string;
}

const integrations: IntegrationCard[] = [
  {
    title: 'Webhooks',
    description: 'Send real-time notifications and data to external services like Dify workflows',
    icon: Webhook,
    status: 'available',
    category: 'automation'
  },
  {
    title: 'Zapier',
    description: 'Connect with thousands of apps through Zapier automation',
    icon: Zap,
    status: 'coming_soon',
    category: 'automation'
  },
  {
    title: 'Salesforce',
    description: 'Sync deal data with your Salesforce CRM',
    icon: Database,
    status: 'coming_soon',
    category: 'crm'
  },
  {
    title: 'Slack',
    description: 'Get notifications and updates in your Slack workspace',
    icon: Slack,
    status: 'coming_soon',
    category: 'communication'
  },
  {
    title: 'Email Notifications',
    description: 'Customizable email alerts for deal updates and activities',
    icon: Mail,
    status: 'coming_soon',
    category: 'communication'
  },
  {
    title: 'Browser Extension',
    description: 'Capture deal information from any website',
    icon: Chrome,
    status: 'coming_soon',
    category: 'productivity'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'available':
      return 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-400 dark:border-green-800';
    case 'beta':
      return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800';
    case 'coming_soon':
      return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-400 dark:border-gray-800';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-400 dark:border-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'available':
      return 'Available';
    case 'beta':
      return 'Beta';
    case 'coming_soon':
      return 'Coming Soon';
    default:
      return 'Unknown';
  }
};

const categorizeIntegrations = (integrations: IntegrationCard[]) => {
  return integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, IntegrationCard[]>);
};

export default function Integrations() {
  const categorizedIntegrations = categorizeIntegrations(integrations);

  return (
    <div className="space-y-6 pr-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect ReubenAI with your favorite tools and services</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-12 w-auto bg-background border rounded-lg p-1">
          <TabsTrigger value="overview" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="h-10 px-6 rounded-md text-sm font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {Object.entries(categorizedIntegrations).map(([category, categoryIntegrations]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground capitalize">
                {category.replace('_', ' ')} Integrations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryIntegrations.map((integration) => (
                  <Card key={integration.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <integration.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{integration.title}</CardTitle>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-medium ${getStatusColor(integration.status)}`}
                        >
                          {getStatusLabel(integration.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm">
                        {integration.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <WebhookSettingsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}