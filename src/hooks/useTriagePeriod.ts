import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'institution:triagePeriod';
const EVENT_NAME = 'institution:triagePeriodChange';
const DEFAULT_PERIOD = 15;

function readStored(): number {
  if (typeof window === 'undefined') return DEFAULT_PERIOD;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_PERIOD;
}

/**
 * Shared "triage analysis period" (in days) across the Institution Portal.
 * Persisted in localStorage and broadcast via a custom event so multiple
 * components (Panorama, StudentTriageTab) stay in sync.
 */
export function useTriagePeriod(): [number, (n: number) => void] {
  const [period, setPeriod] = useState<number>(() => readStored());

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === 'number' && detail > 0) setPeriod(detail);
    };
    const storage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPeriod(readStored());
    };
    window.addEventListener(EVENT_NAME, handler as EventListener);
    window.addEventListener('storage', storage);
    return () => {
      window.removeEventListener(EVENT_NAME, handler as EventListener);
      window.removeEventListener('storage', storage);
    };
  }, []);

  const set = useCallback((n: number) => {
    if (!Number.isFinite(n) || n <= 0) return;
    window.localStorage.setItem(STORAGE_KEY, String(n));
    window.dispatchEvent(new CustomEvent<number>(EVENT_NAME, { detail: n }));
    setPeriod(n);
  }, []);

  return [period, set];
}
