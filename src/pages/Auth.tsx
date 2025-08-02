import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
    
    setLoading(false);
  };


  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      {/* Beta Testing Notice - Moved down and enlarged */}
      <div className="fixed top-8 left-4 right-4 z-50">
        <div className="mx-auto max-w-5xl bg-gradient-to-r from-accent-orange/10 to-primary/10 border border-accent-orange/20 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Badge variant="secondary" className="bg-accent-orange/10 text-accent-orange border-accent-orange/20 font-semibold text-sm px-3 py-1">
                  Private Beta
                </Badge>
              </div>
              <p className="text-base font-medium text-foreground">
                <strong className="text-accent-orange">Beta Testing Notice:</strong> ReubenAI is currently in private beta. This platform is designed for functionality testing and feedback collection.
              </p>
            </div>
            <div className="bg-background/50 rounded-md p-4 text-sm text-muted-foreground leading-relaxed">
              <p><strong>Please Note:</strong> Beta software will be imperfect by design. Our goal is to test core functionality, capture your feedback on improvements, wishlist items, and bugs to inform our near-term roadmap and shape a disruptive product together.</p>
              <p className="mt-3"><strong>Confidentiality:</strong> By using this platform, you agree to maintain strict confidentiality of all proprietary AI capabilities, fund data, and platform features under applicable trade secret laws.</p>
            </div>
          </div>
        </div>
      </div>
      
      <Card className="w-full max-w-md shadow-elegant mt-44">{/* Increased top margin to accommodate larger beta notice */}
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">R</span>
          </div>
          <CardTitle className="text-2xl font-bold">ReubenAI</CardTitle>
          <CardDescription>Investment Intelligence Platform</CardDescription>
        </CardHeader>
        <CardContent>
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
                className="bg-background border-border/60"
              />
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
                className="bg-background border-border/60"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
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
  );
}