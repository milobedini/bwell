import { api } from '@/api/api';
import type { AuthResponse, AuthUser, LoginInput, RegisterInput, VerifyInput } from '@milobedini/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export const useVerify = () => {
  return useMutation<AuthResponse, Error, VerifyInput>({
    mutationFn: async (body) => {
      const { data } = await api.post<AuthResponse>('/verify-email', body);
      return data;
    }
  });
};

export const useProfile = () => {
  return useQuery<AuthUser>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await api.get<AuthUser>('/user');
      return data;
    },
    retry: 2
  });
};
