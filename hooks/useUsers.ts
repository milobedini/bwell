import { api } from '@/api/api';
import { PatientsResponse } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

export const useAllPatients = () => {
  return useQuery<PatientsResponse>({
    queryKey: ['patients'],
    queryFn: async (): Promise<PatientsResponse> => {
      const { data } = await api.get<PatientsResponse>('/user/patients');
      return data;
    }
  });
};
