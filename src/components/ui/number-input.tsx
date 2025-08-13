import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface NumberInputProps extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value?: number | string
  onChange?: (value: number | undefined) => void
  currency?: string
  showCurrency?: boolean
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, currency = "USD", showCurrency = false, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>("")
    const [isFocused, setIsFocused] = React.useState(false)

    // Format number with commas
    const formatNumber = (num: number): string => {
      if (isNaN(num) || num === 0) return ""
      return num.toLocaleString('en-US')
    }

    // Remove commas and parse number
    const parseNumber = (str: string): number | undefined => {
      if (!str || str.trim() === "") return undefined
      const cleaned = str.replace(/,/g, "")
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? undefined : parsed
    }

    // Update display value when external value changes
    React.useEffect(() => {
      if (value === undefined || value === null || value === "" || value === 0) {
        setDisplayValue("")
      } else {
        const numValue = typeof value === "string" ? parseNumber(value) : value
        if (numValue !== undefined && numValue !== 0 && !isFocused) {
          setDisplayValue(formatNumber(numValue))
        } else if (!isFocused) {
          setDisplayValue("")
        }
      }
    }, [value, isFocused])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      
      // Allow empty input
      if (inputValue === "") {
        setDisplayValue("")
        onChange?.(undefined)
        return
      }

      // Remove commas for validation but allow typing
      const cleanValue = inputValue.replace(/,/g, "")
      
      // Only allow numbers, one decimal point, and commas
      if (!/^[\d,]*\.?\d*$/.test(cleanValue)) {
        return
      }

      // Parse and validate the number
      const numValue = parseNumber(inputValue)
      
      // Update display with formatting if valid number
      if (numValue !== undefined) {
        // Only format if not currently typing (after comma or decimal)
        const shouldFormat = !inputValue.endsWith(",") && !inputValue.endsWith(".")
        setDisplayValue(shouldFormat ? formatNumber(numValue) : inputValue)
        onChange?.(numValue)
      } else {
        setDisplayValue(inputValue)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      // Reformat on blur
      const numValue = parseNumber(displayValue)
      if (numValue !== undefined) {
        setDisplayValue(formatNumber(numValue))
      }
      props.onBlur?.(e)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow backspace, delete, tab, escape, enter, and decimal point
      if ([8, 9, 27, 13, 46, 110, 190].indexOf(e.keyCode) !== -1 ||
          // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
          (e.keyCode === 65 && e.ctrlKey === true) ||
          (e.keyCode === 67 && e.ctrlKey === true) ||
          (e.keyCode === 86 && e.ctrlKey === true) ||
          (e.keyCode === 88 && e.ctrlKey === true) ||
          // Allow home, end, left, right, down, up
          (e.keyCode >= 35 && e.keyCode <= 40)) {
        return
      }
      // Ensure that it is a number and stop the keypress
      if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault()
      }
      
      props.onKeyDown?.(e)
    }

    return (
      <div className="relative">
        {showCurrency && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {currency === "USD" ? "$" : 
             currency === "EUR" ? "€" : 
             currency === "GBP" ? "£" : 
             currency === "AUD" ? "A$" : 
             currency === "CAD" ? "C$" :
             currency === "SGD" ? "S$" :
             currency === "HKD" ? "HK$" :
             currency}
          </span>
        )}
        <Input
          {...props}
          type="text"
          ref={ref}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            showCurrency && "pl-8",
            className
          )}
        />
      </div>
    )
  }
)

NumberInput.displayName = "NumberInput"

export { NumberInput }