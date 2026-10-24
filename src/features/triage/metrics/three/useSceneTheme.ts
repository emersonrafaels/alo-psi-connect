import { useEffect, useState } from 'react';

export interface SceneTheme { foreground: string; muted: string; border: string; primary: string; dark: boolean }

/** CSS tokens are stored as "H S% L%"; three.js parses the comma form. */
const token = (name: string, fallback: string) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? `hsl(${raw.split(/\s+/).join(', ')})` : fallback;
};

const read = (): SceneTheme => ({
  foreground: token('--foreground', '#0f172a'),
  muted: token('--muted-foreground', '#64748b'),
  border: token('--border', '#e2e8f0'),
  primary: token('--primary', '#6b21a8'),
  dark: document.documentElement.classList.contains('dark'),
});

/** Scene colours from the page's design tokens, re-read when the light/dark class on <html> changes. */
export function useSceneTheme(): SceneTheme {
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
