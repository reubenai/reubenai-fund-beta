import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const getBreadcrumbs = (pathname: string) => {
  const paths = pathname.split('/').filter(Boolean);
  const breadcrumbs = [{ label: 'Dashboard', href: '/' }];
  
  if (paths.length > 0) {
    const pathMap: Record<string, string> = {
      'funds': 'Funds',
      'pipeline': 'Pipeline',
      'strategy': 'Investment Strategy',
      'ic': 'Investment Committee',
      'settings': 'Settings',
    };
    
    paths.forEach((path, index) => {
      const label = pathMap[path] || path;
      const href = '/' + paths.slice(0, index + 1).join('/');
      breadcrumbs.push({ label, href });
    });
  }
  
  return breadcrumbs;
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header with breadcrumbs */}
          <header className="h-14 flex items-center border-b border-border bg-background px-4">
            <SidebarTrigger className="mr-4" />
            <Breadcrumb>
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
          </header>

          {/* Main content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}