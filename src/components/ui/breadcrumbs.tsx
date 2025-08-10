import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation();
  const navigate = useNavigate();

  const routeMap: Record<string, string> = {
    '/': 'Dashboard',
    '/strategy': 'Investment Strategy',
    '/deals': 'Deal Pipeline',
    '/pipeline': 'Deal Pipeline',
    '/ic': 'Investment Committee',
    '/analytics': 'Analytics',
    '/fund-memory': 'Fund Memory',
    '/settings': 'Settings',
    '/help': 'Help & Support',
    '/admin': 'Administration',
    '/funds': 'Fund Management',
    '/what-is-reubenai': 'What is ReubenAI?'
  };

  // Handle route aliases - map /deals to /pipeline for breadcrumbs
  const normalizedPath = location.pathname === '/deals' ? '/pipeline' : location.pathname;

  const pathSegments = normalizedPath.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' }
  ];

  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    breadcrumbs.push({
      label: routeMap[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: isLast ? undefined : currentPath,
      current: isLast
    });
  });

  return breadcrumbs;
}

export function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbs();
  const navigate = useNavigate();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index === 0 && <Home className="h-4 w-4" />}
          
          {crumb.href ? (
            <button
              onClick={() => navigate(crumb.href!)}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="text-foreground font-medium">{crumb.label}</span>
          )}
          
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      ))}
    </nav>
  );
}