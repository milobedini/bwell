import { api } from '@/api/api';
import { useIsLoggedIn } from '@/hooks/useUsers';
import type { AdminOverviewResponse } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

export const adminOverviewQueryKey = ['admin', 'overview'] as const;

export const useAdminOverview = (enabled = true) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AdminOverviewResponse>({
    queryKey: adminOverviewQueryKey,
    queryFn: async (): Promise<AdminOverviewResponse> => {
      const { data } = await api.get<AdminOverviewResponse>('/admin/overview');
      return data;
    },
    enabled: isLoggedIn && enabled,
    // Operational signals (verification queue age, stalled, orphaned, rollup freshness) —
    // override the global 1h default so a focused admin sees fresh counts on re-entry.
    staleTime: 60 * 1000
  });
};
