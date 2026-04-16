import { api } from '@/api/api';
import { useIsLoggedIn } from '@/hooks/useUsers';
import type { PatientProfileStatsResponse } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

export const useProfileStats = (enabled = true) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<PatientProfileStatsResponse>({
    queryKey: ['profile', 'stats'],
    queryFn: async (): Promise<PatientProfileStatsResponse> => {
      const { data } = await api.get<PatientProfileStatsResponse>('/user/profile-stats');
      return data;
    },
    enabled: isLoggedIn && enabled,
    staleTime: 1000 * 60 * 5 // 5 minutes — stats change with activity
  });
};
