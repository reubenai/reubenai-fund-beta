import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { CreateWebhookConfig, WebhookConfig } from '@/hooks/useWebhookConfigs';
import { useFunds } from '@/hooks/useFunds';

interface WebhookConfigFormProps {
  config?: WebhookConfig;
  onSubmit: (config: CreateWebhookConfig) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function WebhookConfigForm({ config, onSubmit, onCancel, loading }: WebhookConfigFormProps) {
  const { funds } = useFunds();
  const [formData, setFormData] = useState<CreateWebhookConfig>({
    fund_id: config?.fund_id || '',
    service_name: config?.service_name || 'dify',
    webhook_url: config?.webhook_url || '',
    is_active: config?.is_active ?? true,
    config_data: config?.config_data || {}
  });

  const [headers, setHeaders] = useState<{ key: string; value: string }[]>(() => {
    const configHeaders = config?.config_data?.headers || {};
    return Object.entries(configHeaders).map(([key, value]) => ({ key, value: value as string }));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build config_data with headers
    const headersObject = headers.reduce((acc, { key, value }) => {
      if (key.trim() && value.trim()) {
        acc[key.trim()] = value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    const configData = {
      ...formData.config_data,
      headers: headersObject
    };

    await onSubmit({
      ...formData,
      fund_id: formData.fund_id || undefined,
      config_data: configData
    });
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{config ? 'Edit' : 'Create'} Dify Webhook Configuration</CardTitle>
        <CardDescription>
          Configure webhook settings to send deal creation events to Dify
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fund Selection */}
          <div className="space-y-2">
            <Label>Fund (Optional)</Label>
            <Select
              value={formData.fund_id || ''}
              onValueChange={(value) => setFormData({ ...formData, fund_id: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a fund (or leave empty for all funds)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Funds</SelectItem>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Leave empty to trigger webhooks for all funds in your organization
            </p>
          </div>

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL *</Label>
            <Input
              id="webhook_url"
              type="url"
              placeholder="https://your-dify-instance.com/webhook/endpoint"
              value={formData.webhook_url}
              onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
              required
            />
          </div>

          {/* Authentication */}
          <div className="space-y-4">
            <Label>Authentication (Optional)</Label>
            
            <div className="space-y-2">
              <Label htmlFor="auth_token">Bearer Token</Label>
              <Input
                id="auth_token"
                type="password"
                placeholder="Enter bearer token"
                value={formData.config_data?.auth_token || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config_data: { ...formData.config_data, auth_token: e.target.value }
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="Enter API key"
                value={formData.config_data?.api_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config_data: { ...formData.config_data, api_key: e.target.value }
                })}
              />
            </div>
          </div>

          {/* Custom Headers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Custom Headers</Label>
              <Button type="button" variant="outline" size="sm" onClick={addHeader}>
                <Plus className="h-4 w-4 mr-2" />
                Add Header
              </Button>
            </div>
            
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Header name"
                  value={header.key}
                  onChange={(e) => updateHeader(index, 'key', e.target.value)}
                />
                <Input
                  placeholder="Header value"
                  value={header.value}
                  onChange={(e) => updateHeader(index, 'value', e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeHeader(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {config ? 'Update' : 'Create'} Configuration
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}