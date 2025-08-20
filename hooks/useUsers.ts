import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import { useAuthStore } from '@/stores/authStore';
import type {
  AddRemoveTherapistInput,
  AddRemoveTherapistResponse,
  AdminStats,
  ApiError,
  AvailableModulesResponse,
  GetUsersQuery,
  GetUsersResponse,
  PatientsResponse,
  ProfileResponse,
  UserRole,
  VerifyTherapistInput,
  VerifyTherapistResponse
} from '@milobedini/shared-types';
import { useMutation, useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

// Helpers
const isDefined = <T>(v: T | undefined): v is T => v !== undefined;

const toCsvIfArray = (v?: string | string[]): string | undefined => {
  if (!isDefined(v)) return undefined;
  return Array.isArray(v) ? v.join(',') : v;
};

const toCsvIfRoleArray = (v?: UserRole[] | string): string | undefined => {
  if (!isDefined(v)) return undefined;
  return Array.isArray(v) ? v.join(',') : v;
};

type ParamValue = string | number | boolean;
type Params = Record<string, ParamValue>;

/** Build axios params object without using `any`. */
const buildParams = (q?: GetUsersQuery): Params => {
  const params: Params = {};
  if (!q) return params;

  const {
    page,
    limit,
    q: search,
    roles,
    ids,
    isVerified,
    isVerifiedTherapist,
    hasTherapist,
    therapistId,
    createdFrom,
    createdTo,
    lastLoginFrom,
    lastLoginTo,
    sort,
    select
  } = q;

  if (isDefined(page)) params.page = page;
  if (isDefined(limit)) params.limit = limit;
  if (search) params.q = search;

  const rolesCsv = toCsvIfRoleArray(roles);
  if (rolesCsv) params.roles = rolesCsv;

  const idsCsv = toCsvIfArray(ids);
  if (idsCsv) params.ids = idsCsv;

  if (isDefined(isVerified)) params.isVerified = isVerified;
  if (isDefined(isVerifiedTherapist)) params.isVerifiedTherapist = isVerifiedTherapist;
  if (isDefined(hasTherapist)) params.hasTherapist = hasTherapist;

  if (therapistId) params.therapistId = therapistId;

  if (createdFrom) params.createdFrom = createdFrom;
  if (createdTo) params.createdTo = createdTo;
  if (lastLoginFrom) params.lastLoginFrom = lastLoginFrom;
  if (lastLoginTo) params.lastLoginTo = lastLoginTo;

  if (sort) params.sort = sort;

  const selectCsv = toCsvIfArray(select);
  if (selectCsv) params.select = selectCsv;

  return params;
};

export const useIsLoggedIn = () => !!useAuthStore((s) => s.user?._id);

// QUERIES

export const useProfile = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<ProfileResponse>({
    queryKey: ['profile'],
    queryFn: async (): Promise<ProfileResponse> => {
      const { data } = await api.get<ProfileResponse>('/user');
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 60, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

export const useAllPatients = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<PatientsResponse>({
    queryKey: ['patients'],
    queryFn: async (): Promise<PatientsResponse> => {
      const { data } = await api.get<PatientsResponse>('/user/patients');
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

export const useClients = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<PatientsResponse>({
    queryKey: ['clients'],
    queryFn: async (): Promise<PatientsResponse> => {
      const { data } = await api.get<PatientsResponse>('/user/clients');
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

export const useAllUsers = (query?: GetUsersQuery): UseQueryResult<GetUsersResponse, AxiosError<ApiError>> => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<GetUsersResponse, AxiosError<ApiError>>({
    queryKey: ['admin', 'users', query ?? {}],
    queryFn: async () => {
      const { data } = await api.get<GetUsersResponse>('/user/users', {
        params: buildParams(query)
      });
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

export const useGetAvailableModules = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AvailableModulesResponse>({
    queryKey: ['modules', 'available'],
    queryFn: async (): Promise<AvailableModulesResponse> => {
      const { data } = await api.get<AvailableModulesResponse>('/user/available');
      return data;
    },
    enabled: isLoggedIn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};
export const useAdminStats = () => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<AdminStats>({
    queryKey: ['users'],
    queryFn: async (): Promise<AdminStats> => {
      const { data } = await api.get<AdminStats>('/user/admin/stats');
      return data;
    },
    enabled: isLoggedIn
  });
};

// MUTATIONS

export const useAddRemoveTherapist = () => {
  const queryClient = useQueryClient();

  return useMutation<AddRemoveTherapistResponse, AxiosError, AddRemoveTherapistInput>({
    mutationFn: async (clientData): Promise<AddRemoveTherapistResponse> => {
      const { data } = await api.post<AddRemoveTherapistResponse>('/user/assign', clientData);
      return data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['patients'] });
      queryClient.refetchQueries({ queryKey: ['clients'] });
      queryClient.refetchQueries({ queryKey: ['profile'] });
    }
  });
};

export const useAdminVerifyTherapist = () => {
  const queryClient = useQueryClient();

  return useMutation<VerifyTherapistResponse, AxiosError, VerifyTherapistInput>({
    mutationFn: async (therapistId): Promise<VerifyTherapistResponse> => {
      const { data } = await api.post<VerifyTherapistResponse>('/user/verify', therapistId);
      return data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['profile'] });
      queryClient.refetchQueries({ queryKey: ['users'] });
    }
  });
};
