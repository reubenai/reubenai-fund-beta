import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExternalLink, Key, AlertTriangle, CheckCircle } from 'lucide-react';

interface APIConfigStatus {
  name: string;
  configured: boolean;
  required: boolean;
  description: string;
  configureUrl?: string;
}

export function APIConfigurationPanel() {
  const apiConfigs: APIConfigStatus[] = [
    {
      name: 'OPENAI_API_KEY',
      configured: true, // This would be checked dynamically
      required: true,
      description: 'Required for AI analysis, market research, and memo generation',
      configureUrl: 'https://platform.openai.com/api-keys'
    },
    {
      name: 'GOOGLE_SEARCH_API_KEY',
      configured: false, // This would be checked dynamically
      required: true,
      description: 'Required for real-time market research and competitive analysis',
      configureUrl: 'https://console.developers.google.com/apis/credentials'
    },
    {
      name: 'GOOGLE_SEARCH_ENGINE_ID',
      configured: false, // This would be checked dynamically
      required: true,
      description: 'Custom Search Engine ID for Google Search API',
      configureUrl: 'https://programmablesearchengine.google.com/controlpanel/all'
    },
    {
      name: 'PERPLEXITY_API_KEY',
      configured: false, // This would be checked dynamically
      required: true,
      description: 'AI-powered research and deal sourcing engine',
      configureUrl: 'https://www.perplexity.ai/hub/api'
    },
    {
      name: 'CORESIGNAL_API_KEY',
      configured: false, // This would be checked dynamically
      required: false,
      description: 'Enhanced company and market intelligence data',
      configureUrl: 'https://coresignal.com/api'
    }
  ];

  const missingRequired = apiConfigs.filter(config => config.required && !config.configured);
  const missingOptional = apiConfigs.filter(config => !config.required && !config.configured);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration Status
          </CardTitle>
          <CardDescription>
            Configure external API keys to enable market research and intelligence features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {missingRequired.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical:</strong> {missingRequired.length} required API keys are missing. 
                Market research will return placeholder data until configured.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            {apiConfigs.map((config) => (
              <div
                key={config.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium">
                      {config.name}
                    </span>
                    <Badge variant={config.configured ? "default" : config.required ? "destructive" : "secondary"}>
                      {config.configured ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Configured
                        </>
                      ) : config.required ? (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Required
                        </>
                      ) : (
                        'Optional'
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {config.configureUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(config.configureUrl, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get Key
                    </Button>
                  )}
                  
                  {!config.configured && (
                    <Button
                      size="sm"
                      onClick={() => {
                        // This would trigger the secret form
                        console.log(`Configure ${config.name}`);
                      }}
                    >
                      Configure
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Current Market Research Status:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Deal sourcing: {missingRequired.some(c => c.name.includes('PERPLEXITY')) ? '❌ Basic keyword search only' : '✅ AI-powered intelligent sourcing'}</li>
              <li>• Market sizing data: {missingRequired.some(c => c.name.includes('GOOGLE')) ? '❌ Placeholder data only' : '✅ Real-time research available'}</li>
              <li>• Competitive analysis: {missingRequired.some(c => c.name.includes('GOOGLE')) ? '❌ Limited to document analysis' : '✅ Web-enhanced intelligence'}</li>
              <li>• Company enrichment: {missingOptional.some(c => c.name.includes('CORESIGNAL')) ? '⚠️ AI estimation only' : '✅ Professional data integration'}</li>
              <li>• AI-powered insights: {missingRequired.some(c => c.name.includes('OPENAI')) ? '❌ Analysis unavailable' : '✅ Full AI analysis enabled'}</li>
            </ul>
          </div>

          {/* Quick Setup Section */}
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <h4 className="font-medium mb-3 text-primary">🚀 Quick Setup Required APIs</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Set up the most critical APIs to unlock AI-powered deal sourcing and market research:
            </p>
            
            <div className="space-y-3">
              {missingRequired.filter(config => 
                config.name === 'PERPLEXITY_API_KEY' || 
                config.name === 'GOOGLE_SEARCH_API_KEY' || 
                config.name === 'GOOGLE_SEARCH_ENGINE_ID'
              ).map((config) => (
                <div key={config.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="font-mono text-sm font-medium">{config.name}</span>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                  <div className="flex gap-2">
                    {config.configureUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(config.configureUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Get Key
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> API keys should be configured in your Supabase Edge Function Secrets. 
                Contact your technical team to add these environment variables to enable full functionality.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}