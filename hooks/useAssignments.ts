import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import { AssignmentStatusSearchOptions } from '@/types/types';
import type {
  BasicMutationResponse,
  CreateAssignmentInput,
  CreateAssignmentResponse,
  MyAssignmentsResponse,
  MyAssignmentView,
  UpdateAssignmentStatusInput,
  UpdateAssignmentStatusResponse
} from '@milobedini/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
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
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

// MUTATIONS
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateAssignmentResponse, AxiosError, CreateAssignmentInput>({
    mutationFn: async (assignmentData): Promise<CreateAssignmentResponse> => {
      const { data } = await api.post<CreateAssignmentResponse>('/assignments', assignmentData);
      return data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
export const useUpdateAssignmentStatus = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateAssignmentStatusResponse, AxiosError, UpdateAssignmentStatusInput>({
    mutationFn: async (status): Promise<UpdateAssignmentStatusResponse> => {
      const { data } = await api.patch<UpdateAssignmentStatusResponse>(`assignments/${assignmentId}`, status);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
export const useRemoveAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<BasicMutationResponse, AxiosError, { assignmentId: string }>({
    mutationFn: async ({ assignmentId }): Promise<BasicMutationResponse> => {
      const { data } = await api.delete<BasicMutationResponse>(`assignments/${assignmentId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
