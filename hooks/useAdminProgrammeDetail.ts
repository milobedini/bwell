import { api } from '@/api/api';
import { useIsLoggedIn } from '@/hooks/useUsers';
import type { AdminProgrammeDetailResponse } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

export const adminProgrammeDetailQueryKey = (programmeId: string) => ['admin', 'programme', programmeId] as const;

export const useAdminProgrammeDetail = (programmeId: string | undefined, enabled = true) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AdminProgrammeDetailResponse>({
    queryKey: adminProgrammeDetailQueryKey(programmeId ?? ''),
    queryFn: async (): Promise<AdminProgrammeDetailResponse> => {
      const { data } = await api.get<AdminProgrammeDetailResponse>(`/admin/programmes/${programmeId}`);
      return data;
    },
    enabled: isLoggedIn && enabled && !!programmeId,
    staleTime: 5 * 60 * 1000
  });
};
