import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import {
  MyAttemptsResponse,
  SaveProgressInput,
  SaveProgressResponse,
  StartAttemptResponse,
  SubmitAttemptInput,
  SubmitAttemptResponse,
  TherapistLatestResponse,
  TherapistLatestRow
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

  return useQuery<TherapistLatestRow[]>({
    queryKey: ['attempts'],
    queryFn: async (): Promise<TherapistLatestRow[]> => {
      const { data } = await api.get<TherapistLatestResponse>('/user/therapist/attempts/latest', {
        params: {
          limit: limit ?? 200
        }
      });
      return data.rows;
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

  return useMutation<StartAttemptResponse, AxiosError, { assignmentId: string }>({
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

  return useMutation<SaveProgressResponse, AxiosError, SaveProgressInput>({
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

  return useMutation<SubmitAttemptResponse, AxiosError, SubmitAttemptInput>({
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
