import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import { AttemptStatusInput } from '@/types/types';
import type {
  AttemptDetailResponse,
  PatientModuleTimelineResponse,
  SaveProgressInput,
  SaveProgressResponse,
  StartAttemptResponse,
  SubmitAttemptInput,
  SubmitAttemptResponse
} from '@milobedini/shared-types';
import { type InfiniteData, keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

import { useMutationWithToast } from './useMutationWithToast';
import { useIsLoggedIn } from './useUsers';

// QUERIES
export type PatientTimelineOptions = {
  patientId: string;
  moduleId?: string;
  limit?: number;
  status?: AttemptStatusInput | 'all' | string;
  severity?: string;
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
  status = 'all',
  severity,
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
      { patientId: string; moduleId?: string; limit: number; status: string; severity?: string }
    ], // TQueryKey
    string | null // TPageParam
  >({
    queryKey: ['attempts', 'therapist', 'patient-timeline', { patientId, moduleId, limit, status, severity }],
    initialPageParam: null,
    queryFn: async ({ pageParam }): Promise<PatientModuleTimelineResponse> => {
      const { data } = await api.get<PatientModuleTimelineResponse>(`/user/therapist/patients/${patientId}/timeline`, {
        params: {
          moduleId,
          limit,
          status,
          severity,
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

    placeholderData: keepPreviousData,
    enabled: isLoggedIn && !!patientId && enabled
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
    enabled: isLoggedIn && !!attemptId
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
    enabled: isLoggedIn && !!attemptId
  });
};

// MUTATIONS

export const useStartModuleAttempt = () => {
  const qc = useQueryClient();
  type StartAttemptInput = { moduleId: string; assignmentId?: string };

  return useMutationWithToast<StartAttemptResponse, AxiosError, StartAttemptInput>({
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
      qc.invalidateQueries({ queryKey: ['practice'] });
      qc.invalidateQueries({ queryKey: ['review'] });
    },
    toast: { pending: 'Starting attempt...', success: 'Attempt started', error: 'Failed to start attempt' }
  });
};
export const useSaveModuleAttempt = (attemptId: string) => {
  const qc = useQueryClient();

  return useMutationWithToast<SaveProgressResponse, AxiosError, SaveProgressInput>({
    mutationFn: async (responses): Promise<SaveProgressResponse> => {
      const { data } = await api.patch<SaveProgressResponse>(`attempts/${attemptId}`, responses);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attempts', 'detail'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'mine'] });
      qc.invalidateQueries({ queryKey: ['attempts', 'therapist', 'patient-timeline'] });
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
    toast: { pending: 'Saving progress...', success: 'Progress saved', error: 'Failed to save' }
  });
};
export const useSubmitAttempt = (attemptId: string) => {
  const qc = useQueryClient();

  return useMutationWithToast<SubmitAttemptResponse, AxiosError, SubmitAttemptInput>({
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
      qc.invalidateQueries({ queryKey: ['score-trends'] });
      qc.invalidateQueries({ queryKey: ['practice'] });
      qc.invalidateQueries({ queryKey: ['review'] });
    },
    toast: { pending: 'Submitting...', success: 'Submitted successfully', error: 'Submission failed' }
  });
};
