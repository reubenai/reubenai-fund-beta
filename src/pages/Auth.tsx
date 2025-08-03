import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useValidation, commonSchemas } from '@/hooks/useValidation';
import { z } from 'zod';
import { LoadingSpinner } from '@/components/ui/loading-states';

const authSchema = z.object({
  email: commonSchemas.email,
  password: z.string().min(1, 'Password is required')
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'reset' | 'update'>('signin');
  const [resetSent, setResetSent] = useState(false);
  const { signIn, resetPassword, updatePassword, user, loading: authLoading, error: authError, session } = useAuth();
  const navigate = useNavigate();
  
  const { validate, getFieldError, errors } = useValidation({
    schema: authSchema
  });

  // Check for password reset or update mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    
    if (type === 'recovery' && session?.user) {
      // User is returning from password reset email
      setMode('update');
    }
  }, [session]);

  // Redirect if already logged in (except during password update)
  useEffect(() => {
    if (user && mode !== 'update') {
      navigate('/');
    }
  }, [user, navigate, mode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const formData = { email, password };
    if (!validate(formData)) {
      return;
    }

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      navigate('/');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await resetPassword(email);
    
    if (error) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setResetSent(true);
      toast({
        title: "Reset email sent",
        description: "If an account with that email exists, we've sent you a password reset link.",
      });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await updatePassword(newPassword);
    
    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated.",
      });
      navigate('/');
    }
  };


  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      {/* Beta Testing Notice - Mobile optimized */}
      <div className="w-full p-3 sm:p-4 lg:p-8 bg-gradient-to-r from-accent-orange/5 to-primary/5 border-b border-accent-orange/10">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex-shrink-0">
                <Badge variant="secondary" className="bg-accent-orange/10 text-accent-orange border-accent-orange/20 font-semibold text-xs sm:text-sm px-2 py-1 sm:px-3">
                  Private Beta
                </Badge>
              </div>
              <p className="text-sm sm:text-base font-medium text-foreground">
                <strong className="text-accent-orange">Beta Testing Notice:</strong> ReubenAI is currently in private beta for functionality testing and feedback.
              </p>
            </div>
            <div className="bg-background/50 rounded-md p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <p><strong>Please Note:</strong> Beta software will be imperfect by design. Our goal is to test core functionality and capture feedback to shape our product roadmap.</p>
              <p className="mt-2 sm:mt-3"><strong>Confidentiality:</strong> By using this platform, you agree to maintain strict confidentiality of all proprietary AI capabilities and platform features.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Form - Mobile centered */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-sm sm:max-w-md shadow-elegant">{/* Responsive width and smaller on mobile */}
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">R</span>
          </div>
          <CardTitle className="text-2xl font-bold">ReubenAI</CardTitle>
          <CardDescription>
            {mode === 'update' 
              ? 'Set Your New Password'
              : mode === 'reset' 
                ? resetSent 
                  ? 'Check Your Email'
                  : 'Reset Your Password'
                : 'Investment Intelligence Platform'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
          {mode === 'update' ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-background border-border/60"
                  disabled={authLoading}
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-background border-border/60"
                  disabled={authLoading}
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={authLoading || !newPassword || !confirmPassword}>
                {authLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Updating...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          ) : mode === 'reset' ? (
            resetSent ? (
              <div className="text-center space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>We've sent a password reset link to your email address.</p>
                  <p className="mt-2">Please check your inbox and follow the instructions.</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setMode('signin');
                    setResetSent(false);
                  }}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background border-border/60"
                    disabled={authLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={authLoading || !email}>
                  {authLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      Sending...
                    </div>
                  ) : (
                    "Send Reset Email"
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setMode('signin')}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </form>
            )
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`bg-background border-border/60 ${getFieldError('email') ? 'border-destructive' : ''}`}
                  disabled={authLoading}
                />
                {getFieldError('email') && (
                  <p className="text-sm text-destructive">{getFieldError('email')}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`bg-background border-border/60 ${getFieldError('password') ? 'border-destructive' : ''}`}
                  disabled={authLoading}
                />
                {getFieldError('password') && (
                  <p className="text-sm text-destructive">{getFieldError('password')}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={authLoading || !email || !password}>
                {authLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          )}
          
          <div className="mt-6 pt-4 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              Need help? Contact us at{' '}
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
    </div>
  );
}