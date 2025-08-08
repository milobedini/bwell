import { api } from '@/api/api';
import type { AddRemoveClientInput, AddRemoveClientResponse, PatientsResponse } from '@milobedini/shared-types';
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

export const useAddRemoveClient = () => {
  const queryClient = useQueryClient();

  return useMutation<AddRemoveClientResponse, Error, AddRemoveClientInput>({
    mutationFn: async (clientData): Promise<AddRemoveClientResponse> => {
      const { data } = await api.post<AddRemoveClientResponse>('/user/clients', clientData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
};
