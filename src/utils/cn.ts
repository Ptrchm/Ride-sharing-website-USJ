import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind + clsx className merge helper used across UI components.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
