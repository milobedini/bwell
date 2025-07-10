import axios from 'axios';
import Constants from 'expo-constants';
import type { CreateModuleInput, ModuleDTO, ModulesResponse } from '@milobedini/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Axios instance with credentials (cookie-based auth)
const api = axios.create({
  baseURL: Constants.expoConfig?.extra?.BACKEND_BASE_URL,
  withCredentials: true
});

// --- API methods ---
const fetchModules = async (): Promise<ModuleDTO[]> => {
  const { data } = await api.get<ModulesResponse>('/modules');
  return data.modules;
};

const createModule = async (moduleData: CreateModuleInput): Promise<ModuleDTO> => {
  const { data } = await api.post<{ module: ModuleDTO }>('/modules', moduleData);
  return data.module;
};

// --- Hook: Get all modules ---
export const useModules = () => {
  return useQuery<ModuleDTO[]>({
    queryKey: ['modules'],
    queryFn: fetchModules
  });
};

// --- Hook: Create a new module ---
export const useCreateModule = () => {
  const queryClient = useQueryClient();

  return useMutation<ModuleDTO, Error, CreateModuleInput>({
    mutationFn: createModule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    }
  });
};
