import { api } from '@/api/api';
import { AuthResponse, LoginInput, RegisterInput } from '@milobedini/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useRegister = () => {
  return useMutation<AuthResponse, Error, RegisterInput>({
    mutationFn: async (body) => {
      const { data } = await api.post('/register', body);
      return data;
    }
  });
};

export const useLogin = () => {
  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: async (body) => {
      const { data } = await api.post<AuthResponse>('/login', body);
      return data;
    }
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error>({
    mutationFn: async () => {
      const { data } = await api.post<{ message: string }>('/logout');
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
    }
  });
};
