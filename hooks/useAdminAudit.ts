import { api } from '@/api/api';
import { useIsLoggedIn } from '@/hooks/useUsers';
import type { AdminAuditResponse, AuditedAction } from '@milobedini/shared-types';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

export type UseAdminAuditFilters = {
  action?: AuditedAction;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
};

export const DEFAULT_AUDIT_FILTERS: UseAdminAuditFilters = {};

const PAGE_LIMIT = 50;

export const adminAuditQueryKey = (filters: UseAdminAuditFilters) => ['admin', 'audit', filters] as const;

export const useAdminAudit = (filters: UseAdminAuditFilters = DEFAULT_AUDIT_FILTERS) => {
  const isLoggedIn = useIsLoggedIn();

  return useInfiniteQuery<AdminAuditResponse>({
    queryKey: adminAuditQueryKey(filters),
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<AdminAuditResponse>('/admin/audit', {
        params: {
          action: filters.action,
          actorId: filters.actorId,
          resourceType: filters.resourceType,
          resourceId: filters.resourceId,
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
