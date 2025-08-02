import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useAppKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { helpVisible, setHelpVisible, shortcuts, formatShortcut } = useAppKeyboardShortcuts();
  const { hasCompleted, startTour } = useOnboarding();
  useActivityTracking(); // Track user activity

  return (
    <>
      <SidebarProvider defaultOpen={true}>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <SidebarInset className="flex-1 min-w-0">
            <div className="flex h-full flex-col">
              <AppHeader />
              <main className="flex-1 overflow-auto">
                <div className="pl-8 pr-8 pt-6 pb-8 max-w-7xl mx-auto">
                  <Breadcrumbs />
                  <div className="mt-2">
                    {children}
                  </div>
                </div>
              </main>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>

      {/* Keyboard shortcuts help dialog */}
      <Dialog open={helpVisible} onOpenChange={setHelpVisible}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{shortcut.description}</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {formatShortcut(shortcut)}
                </Badge>
              </div>
            ))}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Show this help</span>
                <Badge variant="outline" className="font-mono text-xs">?</Badge>
              </div>
              {!hasCompleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startTour}
                  className="w-full text-xs"
                >
                  Start Guided Tour
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}