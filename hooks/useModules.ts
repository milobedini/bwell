import { api } from '@/api/api';
import type { CreateModuleInput, Module, ModulesResponse } from '@milobedini/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// --- API methods ---
const fetchModules = async (): Promise<Module[]> => {
  const { data } = await api.get<ModulesResponse>('/modules');
  return data.modules;
};

const createModule = async (moduleData: CreateModuleInput): Promise<Module> => {
  const { data } = await api.post<{ module: Module }>('/modules', moduleData);
  return data.module;
};

// --- Hook: Get all modules ---
export const useModules = () => {
  return useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: fetchModules
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
