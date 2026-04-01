import { api } from '@/api/api';
import type {
  PatientPracticeResponse,
  PracticeHistoryQuery,
  PracticeHistoryResponse,
  PracticeResponse,
  ReviewFilters,
  ReviewResponse,
  TherapistAttemptModulesResponse
} from '@milobedini/shared-types';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useIsLoggedIn } from './useUsers';

// Patient: unified practice view
export const useMyPractice = () => {
  const isLoggedIn = useIsLoggedIn();
  return useQuery({
    queryKey: ['practice'],
    queryFn: async () => {
      const { data } = await api.get<PracticeResponse>('/user/practice');
      return data;
    },
    enabled: isLoggedIn
  });
};

// Patient: completed history (cursor-paginated)
export const useMyPracticeHistory = (filters: Omit<PracticeHistoryQuery, 'cursor'> = {}) => {
  const isLoggedIn = useIsLoggedIn();
  return useInfiniteQuery({
    queryKey: ['practice', 'history', filters],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = {};
      if (filters.moduleId) params.moduleId = filters.moduleId;
      if (filters.moduleType) params.moduleType = filters.moduleType;
      if (filters.limit) params.limit = String(filters.limit);
      if (pageParam) params.cursor = pageParam;

      const { data } = await api.get<PracticeHistoryResponse>('/user/practice/history', { params });
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isLoggedIn,
    select: (data) => ({
      pages: data.pages,
      items: data.pages.flatMap((p) => p.items),
      nextCursor: data.pages[data.pages.length - 1]?.nextCursor
    })
  });
};

// Therapist: patient practice view
export const usePatientPractice = (patientId: string | undefined) =>
  useQuery({
    queryKey: ['practice', 'patient', patientId],
    queryFn: async () => {
      const { data } = await api.get<PatientPracticeResponse>(`/user/therapist/patients/${patientId}/practice`);
      return data;
    },
    enabled: !!patientId
  });

// Therapist: available module types for filter drawers
export const useTherapistReviewModules = () => {
  const isLoggedIn = useIsLoggedIn();
  return useQuery({
    queryKey: ['review', 'modules'],
    queryFn: async () => {
      const { data } = await api.get<TherapistAttemptModulesResponse>('/user/therapist/attempts/modules');
      return data.modules;
    },
    enabled: isLoggedIn
  });
};

// Therapist: review feed
export const useTherapistReview = (filters: Omit<ReviewFilters, 'cursor'> = {}) => {
  const isLoggedIn = useIsLoggedIn();
  return useInfiniteQuery({
    queryKey: ['review', filters],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string> = {};
      if (filters.sort) params.sort = filters.sort;
      if (filters.patientId) params.patientId = filters.patientId;
      if (filters.moduleId) params.moduleId = filters.moduleId;
      if (filters.severity) params.severity = filters.severity;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.limit) params.limit = String(filters.limit);
      if (pageParam) params.cursor = pageParam;

      const { data } = await api.get<ReviewResponse>('/user/therapist/review', { params });
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.submissions.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
    select: (data) => {
      const lastPage = data.pages[data.pages.length - 1];
      return {
        pages: data.pages,
        needsAttention: data.pages[0]?.needsAttention ?? [],
        submissions: data.pages.flatMap((p) => p.submissions.items),
        nextCursor: lastPage?.submissions.nextCursor,
        total: lastPage?.submissions.total ?? 0
      };
    },
    enabled: isLoggedIn
  });
};
