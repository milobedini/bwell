import { api } from '@/api/api';
import type { AddRemoveTherapistInput, AddRemoveTherapistResponse, PatientsResponse } from '@milobedini/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useAllPatients = () => {
  return useQuery<PatientsResponse>({
    queryKey: ['patients'],
    queryFn: async (): Promise<PatientsResponse> => {
      const { data } = await api.get<PatientsResponse>('/user/patients');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

export const useClients = () => {
  return useQuery<PatientsResponse>({
    queryKey: ['clients'],
    queryFn: async (): Promise<PatientsResponse> => {
      const { data } = await api.get<PatientsResponse>('/user/clients');
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

export const useAddRemoveTherapist = () => {
  const queryClient = useQueryClient();

  return useMutation<AddRemoveTherapistResponse, Error, AddRemoveTherapistInput>({
    mutationFn: async (clientData): Promise<AddRemoveTherapistResponse> => {
      const { data } = await api.post<AddRemoveTherapistResponse>('/user/assign', clientData);
      return data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['patients'] });
      queryClient.refetchQueries({ queryKey: ['clients'] });
    }
  });
};
