import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MultiSelectOption {
  label: string
  value: string
  category?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  maxDisplay?: number
  disabled?: boolean
  className?: string
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  ({
    options,
    value = [],
    onValueChange,
    placeholder = "Select options...",
    searchPlaceholder = "Search options...",
    maxDisplay = 3,
    disabled = false,
    className,
  }, ref) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredOptions = React.useMemo(() => {
      if (!search) return options
      return options.filter(option =>
        option.label.toLowerCase().includes(search.toLowerCase()) ||
        option.value.toLowerCase().includes(search.toLowerCase())
      )
    }, [options, search])

    const groupedOptions = React.useMemo(() => {
      const grouped = filteredOptions.reduce((acc, option) => {
        const category = option.category || "Other"
        if (!acc[category]) acc[category] = []
        acc[category].push(option)
        return acc
      }, {} as Record<string, MultiSelectOption[]>)
      
      return Object.entries(grouped).sort(([a], [b]) => {
        if (a === "Other") return 1
        if (b === "Other") return -1
        return a.localeCompare(b)
      })
    }, [filteredOptions])

    const selectedOptions = React.useMemo(() => {
      return options.filter(option => value.includes(option.value))
    }, [options, value])

    const handleSelect = (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter(v => v !== optionValue)
        : [...value, optionValue]
      onValueChange?.(newValue)
    }

    const handleRemove = (optionValue: string) => {
      onValueChange?.(value.filter(v => v !== optionValue))
    }

    const displayText = React.useMemo(() => {
      if (selectedOptions.length === 0) return placeholder
      if (selectedOptions.length <= maxDisplay) {
        return selectedOptions.map(option => option.label).join(", ")
      }
      return `${selectedOptions.slice(0, maxDisplay).map(option => option.label).join(", ")} +${selectedOptions.length - maxDisplay} more`
    }, [selectedOptions, maxDisplay, placeholder])

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-auto min-h-[2.5rem] p-2",
              selectedOptions.length > 0 && "text-left",
              className
            )}
          >
            <span className="flex-1 text-left truncate">{displayText}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center border-b p-3">
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <ScrollArea className="h-64">
            <div className="p-1">
              {groupedOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No options found.
                </div>
              ) : (
                groupedOptions.map(([category, categoryOptions]) => (
                  <div key={category}>
                    {category !== "Other" && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                          {category}
                        </div>
                        <Separator className="mb-1" />
                      </>
                    )}
                    {categoryOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2 p-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
                        onClick={() => handleSelect(option.value)}
                      >
                        <Checkbox
                          checked={value.includes(option.value)}
                          onChange={() => handleSelect(option.value)}
                        />
                        <span className="flex-1 text-sm">{option.label}</span>
                        {value.includes(option.value) && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                    {category !== "Other" && <Separator className="my-1" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          {selectedOptions.length > 0 && (
            <>
              <Separator />
              <div className="p-3">
                <div className="text-sm font-medium mb-2">Selected ({selectedOptions.length})</div>
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.map((option) => (
                    <Badge key={option.value} variant="secondary" className="text-xs">
                      {option.label}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemove(option.value)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>
    )
  }
)

MultiSelect.displayName = "MultiSelect"