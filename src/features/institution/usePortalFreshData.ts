import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Refetches the institutional portal's queries when the page opens and when
 * the manager returns to the tab, so new student records appear without
 * waiting for the global 5-minute cache.
 */
export function usePortalFreshData() {
  const qc = useQueryClient();
  useEffect(() => {
    const refresh = () => qc.invalidateQueries({ refetchType: 'active' });
    refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [qc]);
}
