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
  const { signIn, user, loading: authLoading, error: authError } = useAuth();
  const navigate = useNavigate();
  
  const { validate, getFieldError, errors } = useValidation({
    schema: authSchema
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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
          <CardDescription>Investment Intelligence Platform</CardDescription>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          
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
          </form>
          
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