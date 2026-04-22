import { api } from '@/api/api';
import { useIsLoggedIn } from '@/hooks/useUsers';
import type { AdminStalledAttemptRow, AdminStalledAttemptsResponse } from '@milobedini/shared-types';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

export type UseAdminStalledAttemptsFilters = {
  moduleType?: AdminStalledAttemptRow['moduleType'];
};

export const DEFAULT_STALLED_FILTERS: UseAdminStalledAttemptsFilters = {};

const PAGE_LIMIT = 50;

export const adminStalledAttemptsQueryKey = (filters: UseAdminStalledAttemptsFilters) =>
  ['admin', 'stalled-attempts', filters] as const;

export const useAdminStalledAttempts = (filters: UseAdminStalledAttemptsFilters = DEFAULT_STALLED_FILTERS) => {
  const isLoggedIn = useIsLoggedIn();

  return useInfiniteQuery<AdminStalledAttemptsResponse>({
    queryKey: adminStalledAttemptsQueryKey(filters),
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<AdminStalledAttemptsResponse>('/admin/attempts/stalled', {
        params: {
          moduleType: filters.moduleType,
          cursor: (pageParam as string | null) ?? undefined,
          limit: PAGE_LIMIT
        }
      });
      return data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: isLoggedIn,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData
  });
};
