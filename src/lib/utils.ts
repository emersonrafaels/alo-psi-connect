import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripHtmlTags(html: string): string {
  if (!html) return "";
  
  // Remove HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = withoutTags;
  const decoded = textarea.value;
  
  // Clean up extra whitespace and line breaks
  return decoded.replace(/\s+/g, ' ').trim();
}

export function getBaseUrl(): string {
  // In production, use the configured base URL or fallback to current origin
  if (typeof window !== 'undefined') {
    return import.meta.env.VITE_APP_BASE_URL || window.location.origin;
  }
  return import.meta.env.VITE_APP_BASE_URL || 'https://alopsi.com.br';
}
