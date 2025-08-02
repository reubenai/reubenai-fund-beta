import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Home } from "lucide-react";
import { useLocation, Link } from 'react-router-dom';
import { useFund } from '@/contexts/FundContext';

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
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const { selectedFund } = useFund();

  return (
    <header className="h-14 flex items-center border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 px-4 gap-4 relative">
      <SidebarTrigger className="h-8 w-8 hover:bg-muted rounded-md transition-colors z-50" />
      
      {/* Current Fund Display */}
      {selectedFund && (
        <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-md">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{selectedFund.name}</span>
        </div>
      )}

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
        {/* Beta Badge */}
        <Badge variant="outline" className="text-xs font-normal bg-accent-orange/10 text-accent-orange border-accent-orange/20">
          BETA
        </Badge>

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