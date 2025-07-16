import { api } from '@/api/api';
import { useAuthStore } from '@/stores/authStore';
import type { AuthResponse, LoginInput, RegisterInput, VerifyInput } from '@milobedini/shared-types';
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
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<AuthResponse, Error, LoginInput>({
    mutationFn: async (body) => {
      const { data } = await api.post<AuthResponse>('/login', body);
      return data;
    },
    onSuccess: ({ user }) => {
      setUser(user);
    }
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearUser = useAuthStore((s) => s.clearUser);

  return useMutation<{ message: string }, Error>({
    mutationFn: async () => {
      const { data } = await api.post<{ message: string }>('/logout');
      return data;
    },
    onSuccess: () => {
      queryClient.clear();
      clearUser();
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
