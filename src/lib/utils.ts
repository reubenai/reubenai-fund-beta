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
