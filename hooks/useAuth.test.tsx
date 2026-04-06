import { type ReactNode } from 'react';
import { api } from '@/api/api';
import { useAuthStore } from '@/stores/authStore';
import type { AuthUser } from '@milobedini/shared-types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useChangePassword, useLogin, useLogout, useRegister, useUpdateName, useVerify } from './useAuth';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('sonner-native', () => ({
  toast: {
    loading: jest.fn(() => 'toast-1'),
    success: jest.fn(),
    error: jest.fn()
  }
}));

const mockUser = {
  _id: 'u1',
  username: 'testuser',
  name: 'Test',
  email: 'test@test.com',
  roles: ['patient'],
  isVerified: true,
  isVerifiedTherapist: false
} as AuthUser;

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
};

describe('useRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('calls POST /register', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { user: mockUser } });

    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ username: 'testuser', email: 'test@test.com', password: 'pass123', roles: ['patient'] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/register', expect.any(Object));
  });
});

describe('useLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('calls POST /login and sets user in store', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { user: mockUser } });

    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ identifier: 'test@test.com', password: 'pass123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/login', expect.any(Object));
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });
});

describe('useLogout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
  });

  it('calls POST /logout and clears user', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Logged out' } });

    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/logout');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('clears user even when logout request fails', async () => {
    (api.post as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // onSettled still clears user
    expect(useAuthStore.getState().user).toBeNull();
  });
});

describe('useVerify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null });
  });

  it('calls POST /verify-email and sets user', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { user: mockUser } });

    const { result } = renderHook(() => useVerify(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ verificationCode: 'abc123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/verify-email', { verificationCode: 'abc123' });
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });
});

describe('useUpdateName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
  });

  it('calls PUT /update-name and updates store', async () => {
    const updated = { ...mockUser, name: 'New Name' };
    (api.put as jest.Mock).mockResolvedValueOnce({ data: { user: updated } });

    const { result } = renderHook(() => useUpdateName(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ newName: 'New Name', userId: 'u1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.put).toHaveBeenCalledWith('/update-name', { newName: 'New Name', userId: 'u1' });
    expect(useAuthStore.getState().user?.name).toBe('New Name');
  });
});

describe('useChangePassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls PUT /change-password', async () => {
    (api.put as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ currentPassword: 'old', newPassword: 'new123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.put).toHaveBeenCalledWith('/change-password', { currentPassword: 'old', newPassword: 'new123' });
  });
});
