import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isPortalQueryStale } from './portalFreshness';

/**
 * Refetches the institutional portal's queries when the page opens and when
 * the manager returns to the tab, but only those older than a short window,
 * so large institutions don't re-download every list on each visit.
 */
export function usePortalFreshData() {
  const qc = useQueryClient();
  useEffect(() => {
    const refresh = () =>
      qc.invalidateQueries({
        refetchType: 'active',
        predicate: (q) => isPortalQueryStale(q.queryKey, q.state.dataUpdatedAt, Date.now()),
      });
    refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [qc]);
}
