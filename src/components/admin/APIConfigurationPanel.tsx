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
              <li>• Market sizing data: {missingRequired.some(c => c.name.includes('GOOGLE')) ? '❌ Placeholder data only' : '✅ Real-time research available'}</li>
              <li>• Competitive analysis: {missingRequired.some(c => c.name.includes('GOOGLE')) ? '❌ Limited to document analysis' : '✅ Web-enhanced intelligence'}</li>
              <li>• Growth rate analysis: {missingRequired.some(c => c.name.includes('GOOGLE')) ? '❌ Generic industry estimates' : '✅ Current market data'}</li>
              <li>• AI-powered insights: {missingRequired.some(c => c.name.includes('OPENAI')) ? '❌ Analysis unavailable' : '✅ Full AI analysis enabled'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}