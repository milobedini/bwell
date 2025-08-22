import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import { AttemptStatusInput } from '@/types/types';
import type {
  AttemptDetailResponse,
  MyAttemptsResponse,
  PatientModuleTimelineResponse,
  SaveProgressInput,
  SaveProgressResponse,
  StartAttemptResponse,
  SubmitAttemptInput,
  SubmitAttemptResponse,
  TherapistLatestResponse,
  TherapistLatestRow
} from '@milobedini/shared-types';
import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export type PatientTimelineOptions = {
  patientId: string;
  moduleId?: string;
  limit?: number;
  status?: AttemptStatusInput | 'all' | string;
  enabled?: boolean;
};

// What the hook returns in data
type PatientTimelineSelected = {
  pages: PatientModuleTimelineResponse[];
  attempts: PatientModuleTimelineResponse['attempts']; // flattened
  nextCursor: string | null; // from the last page
};

export const useGetPatientTimeline = ({
  patientId,
  moduleId,
  limit = 20,
  status = 'submitted',
  enabled = true
}: PatientTimelineOptions) => {
  const isLoggedIn = useIsLoggedIn();

  const query = useInfiniteQuery<
    PatientModuleTimelineResponse, // TQueryFnData (server page)
    AxiosError, // TError
    PatientTimelineSelected, // TData (after select)
    readonly [
      'attempts',
      'therapist',
      'patient-timeline',
      { patientId: string; moduleId?: string; limit: number; status: string }
    ], // TQueryKey
    string | null // TPageParam
  >({
    queryKey: ['attempts', 'therapist', 'patient-timeline', { patientId, moduleId, limit, status }],
    initialPageParam: null,
    queryFn: async ({ pageParam }): Promise<PatientModuleTimelineResponse> => {
      const { data } = await api.get<PatientModuleTimelineResponse>(`/user/therapist/patients/${patientId}/timeline`, {
        params: {
          moduleId,
          limit,
          status,
          cursor: pageParam ?? undefined
        }
      });
      return data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,

    // Flatten the data here -> avoids "pages" typing issues in components
    select: (infinite: InfiniteData<PatientModuleTimelineResponse, string | null>): PatientTimelineSelected => {
      const pages = infinite.pages;
      const attempts = pages.flatMap((p) => p.attempts);
      const nextCursor = pages.at(-1)?.nextCursor ?? null;
      return { pages, attempts, nextCursor };
    },

    enabled: isLoggedIn && !!patientId && enabled,
    staleTime: 1000 * 60 * 60,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  // expose a friendly shape
  const attempts = query.data?.attempts ?? [];
  const nextCursor = query.data?.nextCursor ?? null;

  return {
    ...query,
    attempts,
    nextCursor
  };
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

export const useStartModuleAttempt = () => {
  const qc = useQueryClient();
  type StartAttemptInput = { moduleId: string; assignmentId?: string };

  return useMutation<StartAttemptResponse, AxiosError, StartAttemptInput>({
    mutationFn: async ({ moduleId, assignmentId }): Promise<StartAttemptResponse> => {
      const { data } = await api.post<StartAttemptResponse>(
        `modules/${moduleId}/attempts`,
        assignmentId ? { assignmentId } : {}
      );
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
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist', 'patient-timeline'] });
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
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist', 'patient-timeline'] });
    }
  });
};
