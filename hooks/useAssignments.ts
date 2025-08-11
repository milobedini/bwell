import { api } from '@/api/api';
import {
  CreateAssignmentInput,
  CreateAssignmentResponse,
  MyAssignmentsResponse,
  UpdateAssignmentStatusInput,
  UpdateAssignmentStatusResponse
} from '@milobedini/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useIsLoggedIn } from './useUsers';

// QUERIES
export const useViewTherapistOutstandingAssignments = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<MyAssignmentsResponse>({
    queryKey: ['assignments'],
    queryFn: async (): Promise<MyAssignmentsResponse> => {
      const { data } = await api.get<MyAssignmentsResponse>('/assignments/mine');
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};
export const useViewMyAssignments = (status?: string) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<MyAssignmentsResponse>({
    queryKey: ['assignments'],
    queryFn: async (): Promise<MyAssignmentsResponse> => {
      const { data } = await api.get<MyAssignmentsResponse>('/user/assignments', { params: status });
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
export const useCreateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation<CreateAssignmentResponse, Error, CreateAssignmentInput>({
    mutationFn: async (assignmentData): Promise<CreateAssignmentResponse> => {
      const { data } = await api.post<CreateAssignmentResponse>('/assignments', assignmentData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
export const useUpdateAssignmentStatus = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation<UpdateAssignmentStatusResponse, Error, UpdateAssignmentStatusInput>({
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
