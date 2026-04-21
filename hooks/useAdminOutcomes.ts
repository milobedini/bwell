import { api } from '@/api/api';
import { useIsLoggedIn } from '@/hooks/useUsers';
import type { AdminOutcomesResponse, CareTier, Granularity, Instrument } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

export type UseAdminOutcomesParams = {
  instrument: Instrument;
  programmeId?: string;
  careTier?: CareTier;
  granularity?: Granularity;
  from?: string;
  to?: string;
  enabled?: boolean;
};

export const adminOutcomesQueryKey = (params: Omit<UseAdminOutcomesParams, 'enabled'>) =>
  [
    'admin',
    'outcomes',
    params.instrument,
    params.programmeId ?? 'all',
    params.careTier ?? 'all',
    params.granularity ?? 'month',
    params.from ?? null,
    params.to ?? null
  ] as const;

export const useAdminOutcomes = ({
  instrument,
  programmeId,
  careTier,
  granularity = 'month',
  from,
  to,
  enabled = true
}: UseAdminOutcomesParams) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AdminOutcomesResponse>({
    queryKey: adminOutcomesQueryKey({ instrument, programmeId, careTier, granularity, from, to }),
    queryFn: async (): Promise<AdminOutcomesResponse> => {
      const { data } = await api.get<AdminOutcomesResponse>('/admin/outcomes', {
        params: {
          instrument,
          programmeId: programmeId ?? undefined,
          careTier: careTier ?? undefined,
          granularity,
          from: from ?? undefined,
          to: to ?? undefined
        }
      });
      return data;
    },
    enabled: isLoggedIn && enabled,
    staleTime: 5 * 60 * 1000
  });
};
