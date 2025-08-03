import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { GlobalErrorBoundary } from "@/components/ui/global-error-boundary";
import { GuidedTour } from "@/components/ui/guided-tour";
import { FeedbackWidget } from "@/components/ui/feedback-widget";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FundProvider } from "@/contexts/FundContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SetupPassword from "./pages/SetupPassword";
import Funds from "./pages/Funds";
import Pipeline from "./pages/Pipeline";
import Strategy from "./pages/Strategy";
import IC from "./pages/IC";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import FundMemory from "./pages/FundMemory";
import WhatIsReubenAI from "./pages/WhatIsReubenAI";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FundProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <SidebarProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/setup-password" element={<SetupPassword />} />
            <Route path="/" element={
              <AuthGuard>
                <Layout>
                  <ErrorBoundary>
                    <Index />
                  </ErrorBoundary>
                </Layout>
              </AuthGuard>
            } />
            <Route path="/strategy" element={
              <AuthGuard>
                <Layout>
                  <ErrorBoundary>
                    <Strategy />
                  </ErrorBoundary>
                </Layout>
              </AuthGuard>
            } />
            <Route path="/deals" element={
              <AuthGuard>
                <Layout>
                  <ErrorBoundary>
                    <Pipeline />
                  </ErrorBoundary>
                </Layout>
              </AuthGuard>
            } />
            <Route path="/pipeline" element={
              <AuthGuard>
                <Layout>
                  <ErrorBoundary>
                    <Pipeline />
                  </ErrorBoundary>
                </Layout>
              </AuthGuard>
            } />
            <Route path="/ic" element={
              <AuthGuard>
                <Layout>
                  <ErrorBoundary>
                    <IC />
                  </ErrorBoundary>
                </Layout>
              </AuthGuard>
            } />
            <Route path="/founder-scoring" element={
              <AuthGuard>
                <Layout>
                  <div className="space-y-6">
                    <div>
                      <h1 className="text-3xl font-bold">Founder Scoring</h1>
                      <p className="text-muted-foreground">AI-powered founder and deal assessment</p>
                    </div>
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Founder scoring functionality coming soon...</p>
                    </div>
                  </div>
                </Layout>
              </AuthGuard>
            } />
            <Route path="/analytics" element={
              <AuthGuard>
                <Layout>
                  <Analytics />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/fund-memory" element={
              <AuthGuard>
                <Layout>
                  <FundMemory />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/admin" element={
              <AuthGuard>
                <Layout>
                  <Admin />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/funds/*" element={
              <AuthGuard>
                <Layout>
                  <Funds />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/settings" element={
              <AuthGuard>
                <Layout>
                  <Settings />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/help" element={
              <AuthGuard>
                <Help />
              </AuthGuard>
            } />
            <Route path="/what-is-reubenai" element={
              <AuthGuard>
                <WhatIsReubenAI />
              </AuthGuard>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SidebarProvider>
          <GuidedTour />
          <FeedbackWidget />
          </BrowserRouter>
        </TooltipProvider>
        </FundProvider>
      </AuthProvider>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
