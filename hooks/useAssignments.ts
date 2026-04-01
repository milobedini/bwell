import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import type {
  BasicMutationResponse,
  CreateAssignmentInput,
  CreateAssignmentResponse,
  MyAssignmentView,
  UpdateAssignmentInput,
  UpdateAssignmentStatusInput,
  UpdateAssignmentStatusResponse
} from '@milobedini/shared-types';
import { useQueryClient } from '@tanstack/react-query';

import { useMutationWithToast } from './useMutationWithToast';

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
      queryClient.invalidateQueries({ queryKey: ['practice'] });
      queryClient.invalidateQueries({ queryKey: ['review'] });
    }
  });
};
export const useUpdateAssignmentStatus = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutationWithToast<UpdateAssignmentStatusResponse, AxiosError, UpdateAssignmentStatusInput>({
    mutationFn: async (status): Promise<UpdateAssignmentStatusResponse> => {
      const { data } = await api.patch<UpdateAssignmentStatusResponse>(`/assignments/${assignmentId}`, status);
      return data;
    },
    toast: { pending: 'Updating assignment...', success: 'Assignment updated', error: 'Update failed' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['practice'] });
      queryClient.invalidateQueries({ queryKey: ['review'] });
    }
  });
};
export const useRemoveAssignment = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<BasicMutationResponse, AxiosError, { assignmentId: string }>({
    mutationFn: async ({ assignmentId }): Promise<BasicMutationResponse> => {
      const { data } = await api.delete<BasicMutationResponse>(`/assignments/${assignmentId}`);
      return data;
    },
    toast: { pending: 'Removing assignment...', success: 'Assignment removed', error: 'Failed to remove assignment' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['practice'] });
      queryClient.invalidateQueries({ queryKey: ['review'] });
    }
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<
    { success: boolean; assignment: MyAssignmentView },
    AxiosError,
    { assignmentId: string; updates: UpdateAssignmentInput }
  >({
    mutationFn: async ({ assignmentId, updates }) => {
      const { data } = await api.patch(`/assignments/${assignmentId}`, updates);
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
      queryClient.invalidateQueries({ queryKey: ['practice'] });
      queryClient.invalidateQueries({ queryKey: ['review'] });
    }
  });
};
