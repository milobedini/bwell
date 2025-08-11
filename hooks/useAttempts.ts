import { api } from '@/api/api';
import {
  MyAttemptsResponse,
  SaveProgressInput,
  SaveProgressResponse,
  StartAttemptResponse,
  SubmitAttemptInput,
  SubmitAttemptResponse
} from '@milobedini/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsLoggedIn } from './useUsers';

// QUERIES
export const useGetMyAttempts = (moduleId?: string, limit?: number, status?: string) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<MyAttemptsResponse>({
    queryKey: ['attempts'],
    queryFn: async (): Promise<MyAttemptsResponse> => {
      const { data } = await api.get<MyAttemptsResponse>('/user/attempts', {
        params: {
          moduleId,
          limit,
          status
        }
      });
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};
export const useTherapistGetLatestAttempts = (limit?: number) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<MyAttemptsResponse>({
    queryKey: ['attempts'],
    queryFn: async (): Promise<MyAttemptsResponse> => {
      const { data } = await api.get<MyAttemptsResponse>('/user/therapist/attempts/latest', {
        params: {
          limit
        }
      });
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};
export const useTherapistGetPatientsModuleAttempts = (patientId: string, moduleId: string) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<MyAttemptsResponse>({
    queryKey: ['attempts'],
    queryFn: async (): Promise<MyAttemptsResponse> => {
      const { data } = await api.get<MyAttemptsResponse>(
        `/user/therapist/patients/${patientId}/modules/${moduleId}/attempts`
      );
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

// MUTATIONS

export const useStartModuleAttempt = (moduleId: string) => {
  const queryClient = useQueryClient();

  return useMutation<StartAttemptResponse, Error, { assignmentId: string }>({
    mutationFn: async (status): Promise<StartAttemptResponse> => {
      const { data } = await api.post<StartAttemptResponse>(`modules/${moduleId}/attempts`, status);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
};
export const useSaveModuleAttempt = (attemptId: string) => {
  const queryClient = useQueryClient();

  return useMutation<SaveProgressResponse, Error, SaveProgressInput>({
    mutationFn: async (responses): Promise<SaveProgressResponse> => {
      const { data } = await api.patch<SaveProgressResponse>(`attempts/${attemptId}`, responses);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
};
export const useSubmitAttempt = (attemptId: string) => {
  const queryClient = useQueryClient();

  return useMutation<SubmitAttemptResponse, Error, SubmitAttemptInput>({
    mutationFn: async (responses): Promise<SubmitAttemptResponse> => {
      const { data } = await api.post<SubmitAttemptResponse>(`attempts/${attemptId}/submit`, responses);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['attempts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
};
