import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useValidation, commonSchemas } from '@/hooks/useValidation';
import { z } from 'zod';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const passwordSetupSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface InvitationData {
  email: string;
  role: string;
  organization_name: string;
  invited_by: string;
  custom_message?: string;
}

export default function SetupPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { validate, getFieldError } = useValidation({
    schema: passwordSetupSchema
  });

  useEffect(() => {
    console.log('🔍 SetupPassword useEffect - URL search params:', window.location.search);
    console.log('🔍 SetupPassword useEffect - Token extracted:', token);
    
    if (!token) {
      console.log('❌ No token found in URL parameters');
      setError('Invalid invitation link. Please contact your administrator.');
      setIsVerifying(false);
      return;
    }

    console.log('✅ Token found, starting verification for:', token);
    verifyInvitation();
  }, [token]);

  const verifyInvitation = async () => {
    console.log('🔍 Starting invitation verification for token:', token);
    
    try {
      console.log('📤 Executing Supabase query with token:', token);
      const { data, error } = await supabase
        .from('user_invitations')
        .select(`
          email,
          role,
          custom_message,
          expires_at,
          accepted_at,
          is_active,
          organization_id,
          invited_by
        `)
        .eq('invitation_token', token)
        .eq('is_active', true)
        .single();

      console.log('📥 Supabase query response:', { data, error });

      if (error) {
        console.error('❌ Invitation verification error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        setError('Invalid or expired invitation link.');
        return;
      }

      if (data.accepted_at) {
        setError('This invitation has already been accepted.');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired. Please contact your administrator for a new invitation.');
        return;
      }

      // Get organization and inviter details
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', data.organization_id)
        .single();

      const { data: inviterData } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', data.invited_by)
        .single();

      setInvitationData({
        email: data.email,
        role: data.role,
        organization_name: orgData?.name || 'Unknown Organization',
        invited_by: inviterData?.email || 'Unknown',
        custom_message: data.custom_message
      });
    } catch (err) {
      console.error('Error verifying invitation:', err);
      setError('Failed to verify invitation. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationData) return;

    const formData = { password, confirmPassword };
    if (!validate(formData)) {
      return;
    }

    setIsLoading(true);

    try {
      // Create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitationData.email,
        password,
        options: {
          data: {
            invited_role: invitationData.role,
            invited_by: invitationData.invited_by,
            organization_name: invitationData.organization_name
          }
        }
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        toast({
          title: "Account setup failed",
          description: signUpError.message,
          variant: "destructive",
        });
        return;
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('user_invitations')
        .update({ 
          accepted_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('invitation_token', token);

      if (updateError) {
        console.error('Error marking invitation as accepted:', updateError);
        // Don't fail the process if this fails
      }

      toast({
        title: "Account created successfully!",
        description: "You can now access the platform.",
      });

      // Redirect to main app
      navigate('/');
    } catch (err) {
      console.error('Error setting up password:', err);
      toast({
        title: "Setup failed",
        description: "Failed to set up your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <LoadingSpinner size="sm" />
              <span>Verifying invitation...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-semibold">Invalid Invitation</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => navigate('/auth')} variant="outline">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">R</span>
          </div>
          <CardTitle className="text-2xl font-bold">Set Up Your Password</CardTitle>
          <CardDescription>
            Complete your account setup for {invitationData?.organization_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationData && (
            <div className="bg-muted p-4 rounded-lg mb-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Invitation Details</span>
              </div>
              <div className="text-sm space-y-1 ml-6">
                <div><strong>Email:</strong> {invitationData.email}</div>
                <div><strong>Role:</strong> {invitationData.role}</div>
                <div><strong>Organization:</strong> {invitationData.organization_name}</div>
                <div><strong>Invited by:</strong> {invitationData.invited_by}</div>
                {invitationData.custom_message && (
                  <div className="mt-2 p-2 bg-background rounded border-l-2 border-primary">
                    <div className="text-xs text-muted-foreground">Message:</div>
                    <div className="text-sm italic">"{invitationData.custom_message}"</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSetupPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`pr-10 ${getFieldError('password') ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {getFieldError('password') && (
                <p className="text-sm text-destructive">{getFieldError('password')}</p>
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Password must contain:</div>
                <ul className="ml-4 space-y-1">
                  <li>• At least 8 characters</li>
                  <li>• One uppercase letter</li>
                  <li>• One lowercase letter</li>
                  <li>• One number</li>
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`pr-10 ${getFieldError('confirmPassword') ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {getFieldError('confirmPassword') && (
                <p className="text-sm text-destructive">{getFieldError('confirmPassword')}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !password || !confirmPassword}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  Setting up account...
                </div>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? Contact{' '}
              <a 
                href="mailto:support@goreuben.com" 
                className="text-primary hover:underline font-medium"
              >
                support@goreuben.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}