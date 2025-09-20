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

export function formatUserDisplayName(user: { nome?: string | null; email?: string | null; id?: string | null }): string {
  if (user.nome && user.nome.trim()) {
    return user.nome.trim();
  }
  if (user.email && user.email.trim()) {
    return user.email.trim();
  }
  if (user.id) {
    return `Usuário ${user.id.substring(0, 8)}`;
  }
  return 'Usuário desconhecido';
}

// Date utilities to handle timezone issues consistently
export function parseISODateLocal(isoDateString: string): Date {
  // Force local timezone interpretation by adding T00:00:00
  return new Date(isoDateString + 'T00:00:00');
}

export function getTodayLocalDateString(): string {
  // Get today's date in local timezone as YYYY-MM-DD string
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateBR(date: Date | string, formatType: 'short' | 'long' | 'numeric' = 'numeric'): string {
  const dateObj = typeof date === 'string' ? parseISODateLocal(date) : date;
  
  switch (formatType) {
    case 'short':
      return dateObj.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    case 'long':
      return dateObj.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    case 'numeric':
    default:
      return dateObj.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
  }
}

export function formatDateTimeBR(dateTime: Date | string): string {
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  return dateObj.toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
}
