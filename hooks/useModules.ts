import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import type {
  AvailableModulesItem,
  CreateModuleInput,
  Module,
  ModuleDetailResponse,
  ModulesPlainResponse,
  ModulesWithMetaResponse
} from '@milobedini/shared-types';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';

import { useMutationWithToast } from './useMutationWithToast';
import { useIsLoggedIn } from './useUsers';

// --- API methods ---

const fetchModulesPlain = async (programId?: string): Promise<Module[]> => {
  const { data } = await api.get<ModulesPlainResponse>(`/modules?program=${programId}`);
  return data.modules;
};

const fetchModulesWithMeta = async (programId?: string): Promise<AvailableModulesItem[]> => {
  const { data } = await api.get<ModulesWithMetaResponse>(`/modules?program=${programId}&withMeta=true`);
  return data.modules;
};

const fetchModuleById = async (id: string): Promise<ModuleDetailResponse> => {
  const { data } = await api.get<ModuleDetailResponse>(`/modules/detail/${id}`);
  return data;
};

const createModule = async (moduleData: CreateModuleInput): Promise<Module> => {
  const { data } = await api.post<{ module: Module }>('/modules', moduleData);
  return data.module;
};

// --- Hook: Get a module by ID ---
export const useModuleById = (id: string) => {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<ModuleDetailResponse>({
    queryKey: ['module', id],
    queryFn: () => fetchModuleById(id),
    enabled: !!id && isLoggedIn
  });
};

// --- Hook: Get all modules ---

export type UseModuleOptions = {
  programId?: string;
  withMeta?: boolean;
};

export function useModules(options: { programId?: string; withMeta: true }): UseQueryResult<AvailableModulesItem[]>;

// Overload 2: withMeta omitted/false -> Module[]
export function useModules(options?: { programId?: string; withMeta?: false }): UseQueryResult<Module[]>;

export function useModules({ programId, withMeta }: UseModuleOptions = {}) {
  const isLoggedIn = useIsLoggedIn();

  return useQuery<Module[] | AvailableModulesItem[]>({
    queryKey: ['modules', { programId, withMeta: !!withMeta }],
    queryFn: () => {
      if (withMeta) return fetchModulesWithMeta(programId);
      return fetchModulesPlain(programId);
    },
    enabled: isLoggedIn
  });
}

// --- Hook: Create a new module ---
export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutationWithToast<Module, AxiosError, CreateModuleInput>({
    mutationFn: createModule,
    toast: { pending: 'Creating module...', success: 'Module created', error: 'Failed to create module' },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
