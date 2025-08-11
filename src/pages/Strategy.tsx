import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Plus, AlertCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InvestmentStrategyManager } from '@/components/strategy/InvestmentStrategyManager';
import { RAGThresholdManager } from '@/components/strategy/RAGThresholdManager';
import { useFund } from '@/contexts/FundContext';
// Breadcrumbs removed - using Layout breadcrumbs

export default function Strategy() {
  const { selectedFund, funds, loading } = useFund();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Investment Strategy</h1>
            <p className="text-muted-foreground mt-1">Configure your investment criteria and approach</p>
          </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // No funds setup
  if (!funds.length) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Strategy</h1>
            <p className="text-muted-foreground mt-1">Configure your investment criteria and approach</p>
          </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to create a fund before setting up your investment strategy.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader className="text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>No Funds Available</CardTitle>
              <CardDescription>
                Create your first fund to start defining your investment strategy and criteria.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button className="gap-2" onClick={() => window.location.href = '/funds'}>
                <Plus className="h-4 w-4" />
                Go to Funds
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No fund selected
  if (!selectedFund) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Strategy</h1>
            <p className="text-muted-foreground mt-1">Configure your investment criteria and approach</p>
          </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Please select a fund to configure its strategy</p>
          </div>
        </div>
      </div>
    );
  }

  // Main strategy view
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Beta v1 Notice */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <h3 className="font-semibold text-primary mb-2">Beta v1 Notice</h3>
        <p className="text-sm text-muted-foreground">
          Thanks for joining the ReubenAI private beta! Over the coming weeks, your feedback and platform activities will help us shape Reuben into a fit-for-purpose product for investment teams globally. The main objective of v1 Thesis Configurator is to enable Fund Mangers to define and activate a Mandate per Fund, and serves as the single source of truth for Deal Analysis, Deal Scoring (coming soon), and Investment Committee preparation.
        </p>
      </div>
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investment Strategy</h1>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Strategy Configuration
          </TabsTrigger>
          <TabsTrigger value="thresholds" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            RAG Thresholds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration">
          <Card className="shadow-sm border-0">
            <InvestmentStrategyManager 
              fundId={selectedFund.id} 
              fundName={selectedFund.name}
              fundType={selectedFund.fund_type === 'venture_capital' ? 'vc' : 'pe'}
              key={selectedFund.id} // Force re-render when fund changes
            />
          </Card>
        </TabsContent>

        <TabsContent value="thresholds">
          <RAGThresholdManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}