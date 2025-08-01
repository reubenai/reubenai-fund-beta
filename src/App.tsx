import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import Funds from "./pages/Funds";
import Pipeline from "./pages/Pipeline";
import Strategy from "./pages/Strategy";
import IC from "./pages/IC";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
            <Route path="/" element={
              <AuthGuard>
                <Layout>
                  <Index />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/strategy" element={
              <AuthGuard>
                <Layout>
                  <Strategy />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/deals" element={
              <AuthGuard>
                <Layout>
                  <Pipeline />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/pipeline" element={
              <AuthGuard>
                <Layout>
                  <Pipeline />
                </Layout>
              </AuthGuard>
            } />
            <Route path="/ic" element={
              <AuthGuard>
                <Layout>
                  <IC />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
      </FundProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
