import { api } from '@/api/api';
import { useIsLoggedIn } from '@/hooks/useUsers';
import type { AdminOrphanedAssignmentsResponse, OrphanReason } from '@milobedini/shared-types';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

export type UseAdminOrphanedAssignmentsFilters = {
  reason?: OrphanReason;
};

export const DEFAULT_ORPHANED_FILTERS: UseAdminOrphanedAssignmentsFilters = {};

const PAGE_LIMIT = 50;

export const adminOrphanedAssignmentsQueryKey = (filters: UseAdminOrphanedAssignmentsFilters) =>
  ['admin', 'orphaned-assignments', filters] as const;

export const useAdminOrphanedAssignments = (filters: UseAdminOrphanedAssignmentsFilters = DEFAULT_ORPHANED_FILTERS) => {
  const isLoggedIn = useIsLoggedIn();

  return useInfiniteQuery<AdminOrphanedAssignmentsResponse>({
    queryKey: adminOrphanedAssignmentsQueryKey(filters),
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<AdminOrphanedAssignmentsResponse>('/admin/assignments/orphaned', {
        params: {
          reason: filters.reason,
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
