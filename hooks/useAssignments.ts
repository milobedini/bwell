import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import { useAuthStore } from '@/stores/authStore';
import { isPatient, isTherapist } from '@/utils/userRoles';
import type {
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
  const user = useAuthStore((s) => s.user);

  return useQuery<MyAssignmentsResponse>({
    queryKey: ['assignments'],
    queryFn: async (): Promise<MyAssignmentsResponse> => {
      const { data } = await api.get<MyAssignmentsResponse>('/assignments/mine');
      return data;
    },
    enabled: isLoggedIn && isTherapist(user?.roles),
    staleTime: 1000 * 60 * 60, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};
export const useViewMyAssignments = (status?: string) => {
  const isLoggedIn = useIsLoggedIn();
  const user = useAuthStore((s) => s.user);

  return useQuery<MyAssignmentView[]>({
    queryKey: ['assignments'],
    queryFn: async (): Promise<MyAssignmentView[]> => {
      const { data } = await api.get<MyAssignmentsResponse>('/user/assignments', { params: status });
      return data.assignments;
    },
    enabled: isLoggedIn && isPatient(user?.roles),
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
