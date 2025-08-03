import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Building2 } from "lucide-react";
import { useFund } from '@/contexts/FundContext';

export function AppHeader() {
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Combined Status Badge */}
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-xs font-normal bg-accent-orange/10 text-accent-orange border-accent-orange/20">
            BETA
          </Badge>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">Patent Pending</span>
        </div>

        {/* Quick Search */}
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </header>
  );
}