import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  AddRemoveTherapistInput,
  AddRemoveTherapistResponse,
  AdminStats,
  AvailableModulesResponse,
  PatientsResponse,
  ProfileResponse,
  VerifyTherapistInput,
  VerifyTherapistResponse
} from '@milobedini/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useIsLoggedIn = () => !!useAuthStore((s) => s.user?._id);

// QUERIES

export const useProfile = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: async (): Promise<ProfileResponse> => {
      const { data } = await api.get<ProfileResponse>('/user');
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

export const useAllPatients = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<PatientsResponse>({
    queryKey: ['patients'],
    queryFn: async (): Promise<PatientsResponse> => {
      const { data } = await api.get<PatientsResponse>('/user/patients');
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

export const useClients = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<PatientsResponse>({
    queryKey: ['clients'],
    queryFn: async (): Promise<PatientsResponse> => {
      const { data } = await api.get<PatientsResponse>('/user/clients');
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

export const useGetAvailableModules = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AvailableModulesResponse>({
    queryKey: ['modules'],
    queryFn: async (): Promise<AvailableModulesResponse> => {
      const { data } = await api.get<AvailableModulesResponse>('/user/available');
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};
export const useAdminStats = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AdminStats>({
    queryKey: ['users'],
    queryFn: async (): Promise<AdminStats> => {
      const { data } = await api.get<AdminStats>('/user/admin/stats');
      return data;
    },
    enabled: isLoggedIn
  });
};

// MUTATIONS

export const useAddRemoveTherapist = () => {
  const queryClient = useQueryClient();

  return useMutation<AddRemoveTherapistResponse, AxiosError, AddRemoveTherapistInput>({
    mutationFn: async (clientData): Promise<AddRemoveTherapistResponse> => {
      const { data } = await api.post<AddRemoveTherapistResponse>('/user/assign', clientData);
      return data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['patients'] });
      queryClient.refetchQueries({ queryKey: ['clients'] });
      queryClient.refetchQueries({ queryKey: ['profile'] });
    }
  });
};

export const useAdminVerifyTherapist = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifyTherapistResponse, AxiosError, VerifyTherapistInput>({
    mutationFn: async (therapistId): Promise<VerifyTherapistResponse> => {
      const { data } = await api.post<VerifyTherapistResponse>('/user/verify', therapistId);
      return data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['profile'] });
      queryClient.refetchQueries({ queryKey: ['users'] });
    }
  });
};
