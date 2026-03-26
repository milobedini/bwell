import { api } from '@/api/api';
import type { ScoreTrendsResponse } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

import { useIsLoggedIn } from './useUsers';

export const useScoreTrends = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<ScoreTrendsResponse>({
    queryKey: ['score-trends', 'mine'],
    queryFn: async (): Promise<ScoreTrendsResponse> => {
      const { data } = await api.get<ScoreTrendsResponse>('/user/score-trends');
      return data;
    },
    enabled: isLoggedIn
  });
};
