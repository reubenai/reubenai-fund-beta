import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Funds from "./pages/Funds";
import Pipeline from "./pages/Pipeline";
import Strategy from "./pages/Strategy";
import IC from "./pages/IC";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <AuthGuard>
                <Layout>
                  <Index />
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
            <Route path="/pipeline" element={
              <AuthGuard>
                <Layout>
                  <Pipeline />
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
            <Route path="/ic" element={
              <AuthGuard>
                <Layout>
                  <IC />
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
