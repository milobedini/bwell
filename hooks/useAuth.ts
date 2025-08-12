import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import { useAuthStore } from '@/stores/authStore';
import type { AuthResponse, LoginInput, RegisterInput, UpdateNameInput, VerifyInput } from '@milobedini/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useRegister = () => {
  return useMutation<AuthResponse, AxiosError, RegisterInput>({
    mutationFn: async (body) => {
      const { data } = await api.post('/register', body);
      return data;
    }
  });
};

export const useLogin = () => {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<AuthResponse, AxiosError, LoginInput>({
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

  return useMutation<{ message: string }, AxiosError>({
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
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<AuthResponse, AxiosError, VerifyInput>({
    mutationFn: async (body) => {
      const { data } = await api.post<AuthResponse>('/verify-email', body);
      return data;
    },
    onSuccess: ({ user }) => {
      setUser(user);
    }
  });
};

export const useUpdateName = () => {
  const queryClient = useQueryClient();
  return useMutation<AuthResponse, AxiosError, UpdateNameInput>({
    mutationFn: async (body) => {
      const { data } = await api.put<AuthResponse>('/update-name', body);
      return data;
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    }
  });
};
