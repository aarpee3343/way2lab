import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ ADD THIS FUNCTION TO FIX DECIMAL ERRORS
export function safeData(data: any): any {
  return JSON.parse(JSON.stringify(data, (key, value) =>
    typeof value === 'object' && value !== null && 'toFixed' in value
      ? Number(value) // Convert Decimal to Number
      : typeof value === 'bigint' 
      ? value.toString() // Convert BigInt to String
      : value
  ));
}