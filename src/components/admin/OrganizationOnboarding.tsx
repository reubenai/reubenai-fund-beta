import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnboardingResult {
  organization_id: string | null;
  user_id: string | null;
  success: boolean;
  message: string;
}

export function OrganizationOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  const [formData, setFormData] = useState({
    orgName: '',
    orgDomain: '',
    adminEmail: '',
    adminRole: 'admin' as 'admin' | 'fund_manager'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setResult(null);

      const { data, error } = await supabase
        .rpc('create_organization_with_admin', {
          org_name: formData.orgName,
          org_domain: formData.orgDomain,
          admin_email: formData.adminEmail,
          admin_role: formData.adminRole
        });

      if (error) {
        throw error;
      }

      const resultData = data?.[0];
      setResult(resultData);

      if (resultData?.success) {
        toast.success('Organization created successfully!');
        // Reset form
        setFormData({
          orgName: '',
          orgDomain: '',
          adminEmail: '',
          adminRole: 'admin'
        });
      } else {
        toast.error(resultData?.message || 'Failed to create organization');
      }
    } catch (err: any) {
      toast.error(err.message);
      setResult({
        organization_id: null,
        user_id: null,
        success: false,
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      orgName: '',
      orgDomain: '',
      adminEmail: '',
      adminRole: 'admin'
    });
    setResult(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Onboarding
          </DialogTitle>
          <DialogDescription>
            Create a new organization and assign the first admin user. The user must already have signed up.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={formData.orgName}
              onChange={(e) => setFormData(prev => ({ ...prev, orgName: e.target.value }))}
              placeholder="Enter organization name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgDomain">Domain (Optional)</Label>
            <Input
              id="orgDomain"
              value={formData.orgDomain}
              onChange={(e) => setFormData(prev => ({ ...prev, orgDomain: e.target.value }))}
              placeholder="company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminEmail">Admin User Email</Label>
            <Input
              id="adminEmail"
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
              placeholder="admin@company.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              User must already be registered in the system
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminRole">Admin Role</Label>
            <Select
              value={formData.adminRole}
              onValueChange={(value: 'admin' | 'fund_manager') => 
                setFormData(prev => ({ ...prev, adminRole: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="fund_manager">Fund Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>{result.message}</AlertDescription>
                  {result.success && result.organization_id && (
                    <div className="mt-2 space-y-1 text-xs">
                      <div>Org ID: <code className="bg-muted px-1 rounded">{result.organization_id}</code></div>
                      {result.user_id && (
                        <div>User ID: <code className="bg-muted px-1 rounded">{result.user_id}</code></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Creating...' : 'Create Organization'}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}