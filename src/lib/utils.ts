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
