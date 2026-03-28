import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { fetchMyAttemptDetail, fetchTherapistAttemptDetail } from './useAttempts';

export const usePrefetchMyAttemptDetail = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (attemptId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['attempts', 'detail', 'mine', attemptId],
        queryFn: () => fetchMyAttemptDetail(attemptId),
        staleTime: 1000 * 60 * 60 // 1 hour — mirror global staleTime
      });
    },
    [queryClient]
  );
};

export const usePrefetchTherapistAttemptDetail = () => {
  const queryClient = useQueryClient();

  return useCallback(
    (attemptId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['attempts', 'detail', 'therapist', attemptId],
        queryFn: () => fetchTherapistAttemptDetail(attemptId),
        staleTime: 1000 * 60 * 60 // 1 hour — mirror global staleTime
      });
    },
    [queryClient]
  );
};
