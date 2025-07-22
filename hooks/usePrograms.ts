import { api } from '@/api/api';
import type { Program, ProgramResponse, ProgramsResponse, ProgramWithModules } from '@milobedini/shared-types';
import { useQuery } from '@tanstack/react-query';

const fetchPrograms = async (): Promise<Program[]> => {
  const { data } = await api.get<ProgramsResponse>('/programs');
  return data.programs;
};

const fetchProgramById = async (id: string): Promise<ProgramWithModules> => {
  const { data } = await api.get<ProgramResponse>(`/programs/${id}`);
  return data.program;
};

export const usePrograms = () => {
  return useQuery<Program[]>({
    queryKey: ['programs'],
    queryFn: fetchPrograms
  });
};

export const useProgram = (id: string) => {
  return useQuery<ProgramWithModules>({
    queryKey: ['program', id],
    queryFn: () => fetchProgramById(id)
  });
};
