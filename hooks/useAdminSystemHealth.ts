import { api } from '@/api/api';
import { useIsLoggedIn } from '@/hooks/useUsers';
import type { AdminSystemHealthResponse } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

export const adminSystemHealthQueryKey = ['admin', 'system-health'] as const;

export const useAdminSystemHealth = (enabled = true) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AdminSystemHealthResponse>({
    queryKey: adminSystemHealthQueryKey,
    queryFn: async (): Promise<AdminSystemHealthResponse> => {
      const { data } = await api.get<AdminSystemHealthResponse>('/admin/system/health');
      return data;
    },
    enabled: isLoggedIn && enabled,
    // Ops signal — refresh on focus for anyone reading the health panel.
    staleTime: 60 * 1000
  });
};
