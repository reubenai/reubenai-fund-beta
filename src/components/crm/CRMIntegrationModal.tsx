import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { crmIntegrationService, CRMType } from '@/services/crmIntegrationService';

interface CRMIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  fundId: string;
}

const CRM_CONFIGS = {
  hubspot: {
    name: 'HubSpot',
    description: 'Connect your HubSpot CRM to sync deals and companies',
    color: 'bg-orange-500',
    fields: [
      { key: 'access_token', label: 'Access Token', type: 'password', required: true }
    ]
  },
  salesforce: {
    name: 'Salesforce',
    description: 'Sync opportunities and accounts from Salesforce',
    color: 'bg-blue-600',
    fields: [
      { key: 'instance_url', label: 'Instance URL', type: 'text', required: true, placeholder: 'https://your-domain.salesforce.com' },
      { key: 'access_token', label: 'Access Token', type: 'password', required: true }
    ]
  },
  affinity: {
    name: 'Affinity',
    description: 'Connect to Affinity\'s relationship intelligence platform',
    color: 'bg-purple-600',
    fields: [
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', required: true }
    ]
  },
  pipedrive: {
    name: 'PipeDrive',
    description: 'Sync deals and organizations from PipeDrive',
    color: 'bg-green-600',
    fields: [
      { key: 'api_token', label: 'API Token', type: 'password', required: true }
    ]
  }
};

export function CRMIntegrationModal({ isOpen, onClose, organizationId, fundId }: CRMIntegrationModalProps) {
  const [selectedCRM, setSelectedCRM] = useState<CRMType | null>(null);
  const [connectionName, setConnectionName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleCRMSelect = (crmType: CRMType) => {
    setSelectedCRM(crmType);
    setConnectionName(`${CRM_CONFIGS[crmType].name} Integration`);
    setCredentials({});
    setConnectionStatus('idle');
  };

  const handleCredentialChange = (key: string, value: string) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = async () => {
    if (!selectedCRM) return;

    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      // Create a temporary integration object for testing
      const testIntegration = {
        id: 'test',
        organization_id: organizationId,
        fund_id: fundId,
        crm_type: selectedCRM,
        connection_name: connectionName,
        credentials,
        field_mappings: {},
        sync_settings: {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const isConnected = await crmIntegrationService.testConnection(testIntegration);
      
      if (isConnected) {
        setConnectionStatus('success');
        toast({
          title: "Connection Successful",
          description: `Successfully connected to ${CRM_CONFIGS[selectedCRM].name}`,
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Connection Failed",
          description: `Failed to connect to ${CRM_CONFIGS[selectedCRM].name}. Please check your credentials.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('error');
      toast({
        title: "Connection Error",
        description: "An error occurred while testing the connection.",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCreateIntegration = async () => {
    if (!selectedCRM || connectionStatus !== 'success') return;

    setIsConnecting(true);

    try {
      const integration = await crmIntegrationService.createIntegration(
        organizationId,
        fundId,
        selectedCRM,
        connectionName,
        credentials
      );

      if (integration) {
        toast({
          title: "Integration Created",
          description: `${CRM_CONFIGS[selectedCRM].name} integration has been set up successfully.`,
        });
        
        // Trigger initial sync
        try {
          await crmIntegrationService.syncDeals(integration.id);
          toast({
            title: "Initial Sync Started",
            description: "Your deals are being imported from the CRM.",
          });
        } catch (syncError) {
          console.error('Initial sync error:', syncError);
          // Don't show error toast for sync - integration was created successfully
        }

        onClose();
        window.location.reload(); // Refresh to show new deals
      } else {
        throw new Error('Failed to create integration');
      }
    } catch (error) {
      console.error('Integration creation error:', error);
      toast({
        title: "Integration Failed",
        description: "Failed to create the CRM integration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleBack = () => {
    setSelectedCRM(null);
    setConnectionName('');
    setCredentials({});
    setConnectionStatus('idle');
  };

  const isFormValid = selectedCRM && connectionName && 
    CRM_CONFIGS[selectedCRM].fields.every(field => 
      field.required ? credentials[field.key]?.trim() : true
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selectedCRM ? `Connect to ${CRM_CONFIGS[selectedCRM].name}` : 'Integrate CRM'}
          </DialogTitle>
          <DialogDescription>
            {selectedCRM 
              ? 'Enter your credentials to connect and start syncing deals'
              : 'Choose a CRM platform to integrate with your deal pipeline'
            }
          </DialogDescription>
        </DialogHeader>

        {!selectedCRM ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(CRM_CONFIGS).map(([crmType, config]) => (
              <Card 
                key={crmType}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCRMSelect(crmType as CRMType)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${config.color} rounded-lg`}></div>
                    <CardTitle className="text-lg">{config.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{config.description}</CardDescription>
                  <Badge variant="secondary" className="mt-2">
                    Available
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <div className={`w-8 h-8 ${CRM_CONFIGS[selectedCRM].color} rounded-lg`}></div>
              <div>
                <h3 className="font-medium">{CRM_CONFIGS[selectedCRM].name}</h3>
                <p className="text-sm text-muted-foreground">
                  {CRM_CONFIGS[selectedCRM].description}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="connection-name">Connection Name</Label>
                <Input
                  id="connection-name"
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder="My CRM Integration"
                />
              </div>

              {CRM_CONFIGS[selectedCRM].fields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    value={credentials[field.key] || ''}
                    onChange={(e) => handleCredentialChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                disabled={!isFormValid || isTestingConnection}
              >
                {isTestingConnection && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Test Connection
              </Button>

              {connectionStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Connection successful</span>
                </div>
              )}

              {connectionStatus === 'error' && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Connection failed</span>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={handleCreateIntegration}
                disabled={connectionStatus !== 'success' || isConnecting}
              >
                {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Integration
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}