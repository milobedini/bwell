import type { AxiosError } from 'axios';
import { api } from '@/api/api';
import { useAuthStore } from '@/stores/authStore';
import type { AuthResponse, LoginInput, RegisterInput, UpdateNameInput, VerifyInput } from '@milobedini/shared-types';
import { useQueryClient } from '@tanstack/react-query';

import { useMutationWithToast } from './useMutationWithToast';

export const useRegister = () => {
  return useMutationWithToast<AuthResponse, AxiosError, RegisterInput>({
    mutationFn: async (body) => {
      const { data } = await api.post('/register', body);
      return data;
    },
    toast: { pending: 'Creating account...', success: 'Account created', error: 'Registration failed' }
  });
};

export const useLogin = () => {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutationWithToast<AuthResponse, AxiosError, LoginInput>({
    mutationFn: async (body) => {
      const { data } = await api.post<AuthResponse>('/login', body);
      return data;
    },
    onSuccess: ({ user }) => {
      setUser(user);
    },
    toast: { pending: 'Logging in...', success: 'Welcome back', error: 'Login failed' }
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const clearUser = useAuthStore((s) => s.clearUser);

  return useMutationWithToast<{ message: string }, AxiosError>({
    mutationFn: async () => {
      const { data } = await api.post<{ message: string }>('/logout');
      return data;
    },
    onSettled: () => {
      // Clear local state regardless of server response —
      // a failed logout call shouldn't trap the user in the app
      queryClient.clear();
      clearUser();
    },
    toast: { pending: 'Logging out...', success: 'Logged out', error: 'Logout failed' }
  });
};

export const useVerify = () => {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutationWithToast<AuthResponse, AxiosError, VerifyInput>({
    mutationFn: async (body) => {
      const { data } = await api.post<AuthResponse>('/verify-email', body);
      return data;
    },
    onSuccess: ({ user }) => {
      setUser(user);
    },
    toast: { pending: 'Verifying email...', success: 'Email verified', error: 'Verification failed' }
  });
};

export const useUpdateName = () => {
  const queryClient = useQueryClient();
  return useMutationWithToast<AuthResponse, AxiosError, UpdateNameInput>({
    mutationFn: async (body) => {
      const { data } = await api.put<AuthResponse>('/update-name', body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    toast: { pending: 'Updating name...', success: 'Name updated', error: 'Update failed' }
  });
};
