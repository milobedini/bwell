import { api } from '@/api/api';
import { useIsLoggedIn } from '@/hooks/useUsers';
import { TherapistDashboardResponse } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

export const useTherapistDashboard = (enabled = true) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<TherapistDashboardResponse>({
    queryKey: ['therapist', 'dashboard'],
    queryFn: async (): Promise<TherapistDashboardResponse> => {
      const { data } = await api.get<TherapistDashboardResponse>('/user/therapist/dashboard');
      return data;
    },
    enabled: isLoggedIn && enabled
  });
};
