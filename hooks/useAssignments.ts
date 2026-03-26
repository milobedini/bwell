import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import { AssignmentStatusSearchOptions } from '@/types/types';
import type {
  BasicMutationResponse,
  CreateAssignmentInput,
  CreateAssignmentResponse,
  MyAssignmentsResponse,
  MyAssignmentView,
  TherapistAssignmentFilters,
  TherapistAssignmentsResponse,
  UpdateAssignmentInput,
  UpdateAssignmentStatusInput,
  UpdateAssignmentStatusResponse
} from '@milobedini/shared-types';
import { InfiniteData, keepPreviousData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

import { useMutationWithToast } from './useMutationWithToast';
import { useIsLoggedIn } from './useUsers';

// QUERIES
export const useViewTherapistOutstandingAssignments = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<MyAssignmentView[]>({
    queryKey: ['assignments'],
    queryFn: async (): Promise<MyAssignmentView[]> => {
      const { data } = await api.get<MyAssignmentsResponse>('/assignments/mine');
      return data.assignments;
    },
    enabled: isLoggedIn
  });
};
export const useViewMyAssignments = ({ status }: { status: AssignmentStatusSearchOptions }) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<MyAssignmentView[]>({
    queryKey: ['assignments', status],
    queryFn: async (): Promise<MyAssignmentView[]> => {
      const { data } = await api.get<MyAssignmentsResponse>('/user/assignments', { params: { status } });
      return data.assignments;
    },
    enabled: isLoggedIn
  });
};

// MUTATIONS
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<CreateAssignmentResponse, AxiosError, CreateAssignmentInput>({
    mutationFn: async (assignmentData): Promise<CreateAssignmentResponse> => {
      const { data } = await api.post<CreateAssignmentResponse>('/assignments', assignmentData);
      return data;
    },
    toast: { pending: 'Creating assignment...', success: 'Assignment created', error: 'Failed to create assignment' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
export const useUpdateAssignmentStatus = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutationWithToast<UpdateAssignmentStatusResponse, AxiosError, UpdateAssignmentStatusInput>({
    mutationFn: async (status): Promise<UpdateAssignmentStatusResponse> => {
      const { data } = await api.patch<UpdateAssignmentStatusResponse>(`assignments/${assignmentId}`, status);
      return data;
    },
    toast: { pending: 'Updating assignment...', success: 'Assignment updated', error: 'Update failed' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
export const useRemoveAssignment = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<BasicMutationResponse, AxiosError, { assignmentId: string }>({
    mutationFn: async ({ assignmentId }): Promise<BasicMutationResponse> => {
      const { data } = await api.delete<BasicMutationResponse>(`assignments/${assignmentId}`);
      return data;
    },
    toast: { pending: 'Removing assignment...', success: 'Assignment removed', error: 'Failed to remove assignment' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};

type TherapistAssignmentsSelected = {
  pages: TherapistAssignmentsResponse[];
  items: MyAssignmentView[];
  totalItems: number;
};

export const useTherapistAssignments = (filters: TherapistAssignmentFilters = {}) => {
  const isLoggedIn = useIsLoggedIn();
  const { patientId, moduleId, status, urgency, sortBy = 'urgency', limit = 20 } = filters;

  const query = useInfiniteQuery<
    TherapistAssignmentsResponse,
    AxiosError,
    TherapistAssignmentsSelected,
    readonly ['assignments', 'therapist', TherapistAssignmentFilters],
    number
  >({
    queryKey: ['assignments', 'therapist', { patientId, moduleId, status, urgency, sortBy, limit }] as const,
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<TherapistAssignmentsResponse> => {
      const { data } = await api.get<TherapistAssignmentsResponse>('/assignments/mine', {
        params: { patientId, moduleId, status, urgency, sortBy, limit, page: pageParam }
      });
      return data;
    },
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    select: (infinite: InfiniteData<TherapistAssignmentsResponse, number>): TherapistAssignmentsSelected => ({
      pages: infinite.pages,
      items: infinite.pages.flatMap((p) => p.items),
      totalItems: infinite.pages[0]?.totalItems ?? 0
    }),
    placeholderData: keepPreviousData,
    enabled: isLoggedIn
  });

  return {
    ...query,
    items: query.data?.items ?? [],
    totalItems: query.data?.totalItems ?? 0
  };
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<
    { success: boolean; assignment: MyAssignmentView },
    AxiosError,
    { assignmentId: string; updates: UpdateAssignmentInput }
  >({
    mutationFn: async ({ assignmentId, updates }) => {
      const { data } = await api.patch(`assignments/${assignmentId}`, updates);
      return data;
    },
    toast: {
      pending: 'Updating assignment...',
      success: 'Assignment updated',
      error: 'Failed to update assignment'
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
};
