import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Home } from "lucide-react";
import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const getBreadcrumbs = (pathname: string) => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Dashboard', href: '/' }];
  
  if (paths.length > 0) {
    const pathMap: Record<string, string> = {
      'funds': 'Funds',
      'deals': 'Deal Pipeline',
      'pipeline': 'Pipeline',
      'strategy': 'Investment Strategy',
      'dashboard': 'Investment Strategy',
      'ic': 'Investment Committee',
      'investment-committee': 'Investment Committee',
      'settings': 'Settings',
      'founder-scoring': 'Founder Scoring',
      'admin': 'Admin Panel',
    };
    
    paths.forEach((path, index) => {
      const label = pathMap[path] || path;
      const href = '/' + paths.slice(0, index + 1).join('/');
      breadcrumbs.push({ label, href });
    });
  }
  
  return breadcrumbs;
};

export function AppHeader() {
  const location = useLocation();
  const { user } = useAuth();
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedFund, setSelectedFund] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    // Fetch user's profile to get organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, organization_id')
      .eq('user_id', user?.id)
      .single();

    if (profile?.organization_id) {
      setSelectedOrg(profile.organization_id);
      
      // Fetch funds for the organization
      const { data: fundsData } = await supabase
        .from('funds')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true);
      
      setFunds(fundsData || []);
    }
  };

  return (
    <header className="h-14 flex items-center border-b border-border bg-background px-4 gap-4">
      <SidebarTrigger className="h-6 w-6" />
      
      {/* Organization/Fund Selector */}
      <div className="flex items-center gap-2">
        {funds.length > 0 && (
          <Select value={selectedFund} onValueChange={setSelectedFund}>
            <SelectTrigger className="w-48 h-8">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <SelectValue placeholder="Select Fund" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {funds.map((fund) => (
                <SelectItem key={fund.id} value={fund.id}>
                  {fund.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Home Button + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
        
        <Breadcrumb className="flex-1">
          <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.href} className="flex items-center">
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Patent Pending Badge */}
        <Badge variant="outline" className="text-xs font-normal">
          Patent Pending
        </Badge>

        {/* Quick Search */}
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          Quick Search
        </Button>
      </div>
    </header>
  );
}