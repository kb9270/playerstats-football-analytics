import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0";
  
  if (value % 1 === 0) {
    return value.toString();
  }
  
  return value.toFixed(2);
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0%";
  
  return `${Math.round(value)}%`;
}

export function formatMarketValue(value: number | null | undefined): string {
  if (!value) return "N/A";
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M€`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K€`;
  }
  
  return `${value}€`;
}

export function calculatePer90(value: number | null, minutes: number | null): number {
  if (!value || !minutes || minutes === 0) return 0;
  return (value / minutes) * 90;
}

export function getPercentileColor(percentile: number): string {
  if (percentile >= 80) return "text-green-500";
  if (percentile >= 60) return "text-yellow-500";
  if (percentile >= 40) return "text-orange-500";
  return "text-red-500";
}

export function getPercentileBackground(percentile: number): string {
  if (percentile >= 80) return "bg-green-500";
  if (percentile >= 60) return "bg-yellow-500";
  if (percentile >= 40) return "bg-orange-500";
  return "bg-red-500";
}
