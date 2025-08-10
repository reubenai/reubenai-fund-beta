import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface JWTClaims {
  user_id: string | null;
  email: string | null;
  role: string | null;
  org_id: string | null;
  is_super_admin: boolean;
  claims_valid: boolean;
  missing_claims: string[];
}

export function JWTClaimsDebugger() {
  const { user } = useAuth();
  const { isSuperAdmin, role, organizationId } = useUserRole();
  const [claims, setClaims] = useState<JWTClaims | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateClaims = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: claimsError } = await supabase
        .rpc('validate_jwt_claims');

      if (claimsError) {
        setError(claimsError.message);
        return;
      }

      setClaims(data?.[0] || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      validateClaims();
    }
  }, [user]);

  const getStatusIcon = (valid: boolean) => {
    if (valid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (valid: boolean) => {
    if (valid) return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
    return <Badge variant="destructive">Invalid</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">JWT Claims Status</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={validateClaims}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {claims && (
          <>
            {/* Overall Status */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div className="flex items-center gap-2">
                {getStatusIcon(claims.claims_valid)}
                <span className="font-medium">Overall Claims Status</span>
              </div>
              {getStatusBadge(claims.claims_valid)}
            </div>

            {/* Missing Claims Warning */}
            {claims.missing_claims.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Missing Required Claims:</p>
                  <ul className="text-sm text-amber-700 mt-1">
                    {claims.missing_claims.map((claim) => (
                      <li key={claim} className="list-disc list-inside">
                        {claim}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Claims Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Auth Claims</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>User ID:</span>
                    <code className="text-xs bg-muted px-1 rounded">
                      {claims.user_id || 'NULL'}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <code className="text-xs bg-muted px-1 rounded">
                      {claims.email || 'NULL'}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span>Role:</span>
                    <code className="text-xs bg-muted px-1 rounded">
                      {claims.role || 'NULL'}
                    </code>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground">Context Claims</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Org ID:</span>
                    <code className="text-xs bg-muted px-1 rounded">
                      {claims.org_id || 'NULL'}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span>Super Admin:</span>
                    {getStatusBadge(claims.is_super_admin)}
                  </div>
                </div>
              </div>
            </div>

            {/* Frontend vs Backend Comparison */}
            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Frontend vs Backend</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Frontend (useUserRole)</p>
                  <div className="space-y-1 mt-2">
                    <div>Role: <code className="text-xs bg-muted px-1 rounded">{role}</code></div>
                    <div>Super Admin: {getStatusBadge(isSuperAdmin)}</div>
                    <div>Org ID: <code className="text-xs bg-muted px-1 rounded">{organizationId || 'NULL'}</code></div>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Backend (JWT Claims)</p>
                  <div className="space-y-1 mt-2">
                    <div>Role: <code className="text-xs bg-muted px-1 rounded">{claims.role}</code></div>
                    <div>Super Admin: {getStatusBadge(claims.is_super_admin)}</div>
                    <div>Org ID: <code className="text-xs bg-muted px-1 rounded">{claims.org_id || 'NULL'}</code></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}