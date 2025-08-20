import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import { AttemptStatusInput } from '@/types/types';
import {
  AttemptDetailResponse,
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
export type MyAttemptOptions = {
  moduleId?: string;
  limit?: number;
  status?: AttemptStatusInput;
};
export const useGetMyAttempts = ({ moduleId, limit, status }: MyAttemptOptions) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<MyAttemptsResponse>({
    queryKey: ['attempts', 'mine', { moduleId, limit, status }],
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
    queryKey: ['attempts', 'therapist', 'latest', { limit }],
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
    queryKey: ['attempts', 'therapist', 'patientModule', { patientId, moduleId }],
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

export const useGetMyAttemptDetail = (attemptId: string) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AttemptDetailResponse>({
    queryKey: ['attempts', 'detail', 'mine', attemptId],
    queryFn: async (): Promise<AttemptDetailResponse> => {
      const { data } = await api.get<AttemptDetailResponse>(`/attempts/${attemptId}`);
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

export const useTherapistGetAttemptDetail = (attemptId: string) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AttemptDetailResponse>({
    queryKey: ['attempts', 'detail', 'therapist', attemptId],
    queryFn: async (): Promise<AttemptDetailResponse> => {
      const { data } = await api.get<AttemptDetailResponse>(`/attempts/therapist/${attemptId}`);
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
  const qc = useQueryClient();

  return useMutation<StartAttemptResponse, AxiosError, { assignmentId: string }>({
    mutationFn: async (status): Promise<StartAttemptResponse> => {
      const { data } = await api.post<StartAttemptResponse>(`modules/${moduleId}/attempts`, status);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    }
  });
};
export const useSaveModuleAttempt = (attemptId: string) => {
  const qc = useQueryClient();

  return useMutation<SaveProgressResponse, AxiosError, SaveProgressInput>({
    mutationFn: async (responses): Promise<SaveProgressResponse> => {
      const { data } = await api.patch<SaveProgressResponse>(`attempts/${attemptId}`, responses);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attempts', 'detail'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
    }
  });
};
export const useSubmitAttempt = (attemptId: string) => {
  const qc = useQueryClient();

  return useMutation<SubmitAttemptResponse, AxiosError, SubmitAttemptInput>({
    mutationFn: async (responses): Promise<SubmitAttemptResponse> => {
      const { data } = await api.post<SubmitAttemptResponse>(`attempts/${attemptId}/submit`, responses);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'detail'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    }
  });
};
