import { api } from '@/api/api';
import type { CreateModuleInput, Module, ModuleDetailResponse, ModulesResponse } from '@milobedini/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// --- API methods ---
const fetchModules = async (): Promise<Module[]> => {
  const { data } = await api.get<ModulesResponse>('/modules');
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
  return useQuery<ModuleDetailResponse>({
    queryKey: ['module', id],
    queryFn: () => fetchModuleById(id),
    enabled: !!id, // Only fetch if id is provided
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

// --- Hook: Get all modules ---
export const useModules = () => {
  return useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: fetchModules,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
};

// --- Hook: Create a new module ---
export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation<Module, Error, CreateModuleInput>({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
