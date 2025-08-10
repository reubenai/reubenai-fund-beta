import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, ChevronDown } from "lucide-react";
import { useFund } from '@/contexts/FundContext';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { useAppKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from 'react';

export function AppHeader() {
  const { selectedFund, funds, setSelectedFund } = useFund();
  const { searchVisible, setSearchVisible } = useAppKeyboardShortcuts();

  return (
    <header className="h-14 flex items-center border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 px-4 gap-4 relative">
      <SidebarTrigger className="h-8 w-8 hover:bg-muted rounded-md transition-colors p-1.5" />
      
      {/* Fund Selector */}
      {funds.length > 0 && (
        <Select 
          value={selectedFund?.id || ""} 
          onValueChange={(value) => {
            const fund = funds.find(f => f.id === value);
            if (fund) setSelectedFund(fund);
          }}
        >
          <SelectTrigger className="w-[250px] h-8 bg-muted/50">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select a fund">
                {selectedFund?.name}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="z-50">
            {funds.map((fund) => (
              <SelectItem key={fund.id} value={fund.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{fund.name}</span>
                  {fund.organization?.name && (
                    <span className="text-xs text-muted-foreground">
                      ({fund.organization.name})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-muted-foreground" 
          onClick={() => setSearchVisible(true)}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline ml-1 pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        
        <GlobalSearchModal 
          isOpen={searchVisible} 
          onClose={() => setSearchVisible(false)} 
        />
      </div>
    </header>
  );
}