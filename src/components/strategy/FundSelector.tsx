import { Check, ChevronsUpDown, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Fund {
  id: string;
  name: string;
  fund_type: string;
  is_active: boolean;
}

interface FundSelectorProps {
  funds: Fund[];
  selectedFund: Fund | null;
  onFundSelect: (fund: Fund) => void;
  hasStrategy?: boolean;
}

export function FundSelector({ funds, selectedFund, onFundSelect, hasStrategy }: FundSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Fund:</span>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[200px] justify-between"
          >
            {selectedFund ? (
              <div className="flex items-center gap-2">
                <span>{selectedFund.name}</span>
                {hasStrategy && (
                  <Badge variant="secondary" className="text-xs">
                    Configured
                  </Badge>
                )}
              </div>
            ) : (
              "Select fund..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search funds..." />
            <CommandList>
              <CommandEmpty>No funds found.</CommandEmpty>
              <CommandGroup>
                {funds.map((fund) => (
                  <CommandItem
                    key={fund.id}
                    value={fund.name}
                    onSelect={() => {
                      onFundSelect(fund);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedFund?.id === fund.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">{fund.name}</div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {fund.fund_type}
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}