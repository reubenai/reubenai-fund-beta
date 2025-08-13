import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to round numbers and handle floating point precision issues
export function roundToDecimal(value: number, decimals: number = 1): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Format percentage with proper rounding
export function formatPercentage(value: number, decimals: number = 1): string {
  const rounded = roundToDecimal(value, decimals);
  return decimals === 0 || rounded % 1 === 0 ? `${Math.round(rounded)}%` : `${rounded}%`;
}

// Format currency with commas and proper currency symbol
export function formatCurrency(
  amount: number | null | undefined, 
  currency: string = 'USD',
  options?: {
    compact?: boolean;
    decimals?: number;
  }
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'N/A';
  }

  const { compact = false, decimals } = options || {};

  // For very large numbers, use compact notation if requested
  if (compact && Math.abs(amount) >= 1000000) {
    return formatCompactCurrency(amount, currency);
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals !== undefined ? decimals : (amount % 1 === 0 ? 0 : 2),
      maximumFractionDigits: decimals !== undefined ? decimals : 2,
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${formatNumber(amount, { decimals })}`;
  }
}

// Format numbers with commas (non-currency)
export function formatNumber(
  value: number | null | undefined,
  options?: {
    compact?: boolean;
    decimals?: number;
  }
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }

  const { compact = false, decimals } = options || {};

  // For very large numbers, use compact notation if requested
  if (compact && Math.abs(value) >= 1000000) {
    return formatCompactNumber(value);
  }

  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals !== undefined ? decimals : (value % 1 === 0 ? 0 : 2),
      maximumFractionDigits: decimals !== undefined ? decimals : 2,
    }).format(value);
  } catch (error) {
    return value.toLocaleString('en-US');
  }
}

// Format large numbers in compact notation (1.2M, 5.3K)
export function formatCompactNumber(value: number): string {
  if (Math.abs(value) >= 1000000000) {
    return `${roundToDecimal(value / 1000000000, 1)}B`;
  } else if (Math.abs(value) >= 1000000) {
    return `${roundToDecimal(value / 1000000, 1)}M`;
  } else if (Math.abs(value) >= 1000) {
    return `${roundToDecimal(value / 1000, 1)}K`;
  }
  return value.toString();
}

// Format currency in compact notation
export function formatCompactCurrency(amount: number, currency: string = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${formatCompactNumber(amount)}`;
}

// Get currency symbol
function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    HKD: 'HK$',
  };
  return symbols[currency] || currency;
}
