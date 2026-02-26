import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(str: string): string {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function cleanEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function cleanText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function toLowerCaseAll(text: string): string {
  return text.trim().toLowerCase();
}
