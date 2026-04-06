import { api } from '@/api/api';
import { useAuthStore } from '@/stores/authStore';
import { createQueryClientWrapper } from '@/test-utils/createQueryClientWrapper';
import type { AuthUser } from '@milobedini/shared-types';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  useAddRemoveTherapist,
  useAdminStats,
  useAdminVerifyTherapist,
  useAllPatients,
  useAllUsers,
  useClients,
  useIsLoggedIn,
  useProfile
} from './useUsers';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn()
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

describe('useIsLoggedIn', () => {
  it('returns true when user is in store', () => {
    useAuthStore.setState({ user: mockUser });
    const { result } = renderHook(() => useIsLoggedIn(), { wrapper: createQueryClientWrapper() });
    expect(result.current).toBe(true);
  });

  it('returns false when user is null', () => {
    useAuthStore.setState({ user: null });
    const { result } = renderHook(() => useIsLoggedIn(), { wrapper: createQueryClientWrapper() });
    expect(result.current).toBe(false);
  });
});

describe('useProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
  });

  it('fetches profile when logged in', async () => {
    const mockProfile = { _id: 'u1', name: 'Test' };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockProfile });

    const { result } = renderHook(() => useProfile(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user');
  });

  it('does not fetch when not logged in', () => {
    useAuthStore.setState({ user: null });
    const { result } = renderHook(() => useProfile(), { wrapper: createQueryClientWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useAllPatients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
  });

  it('fetches patients', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { patients: [] } });

    const { result } = renderHook(() => useAllPatients(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/patients');
  });
});

describe('useClients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
  });

  it('fetches clients with query params', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { patients: [] } });

    const { result } = renderHook(() => useClients({ q: 'test', sort: 'name' }), {
      wrapper: createQueryClientWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/clients', { params: { q: 'test', sort: 'name' } });
  });
});

describe('useAllUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
  });

  it('fetches users with infinite query', async () => {
    const mockPage = { users: [], page: 1, totalPages: 1 };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockPage });

    const { result } = renderHook(() => useAllUsers({ limit: 10 }), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      '/user/users',
      expect.objectContaining({ params: expect.objectContaining({ limit: 10, page: 1 }) })
    );
  });
});

describe('useAdminStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
  });

  it('fetches admin stats', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { totalUsers: 10 } });

    const { result } = renderHook(() => useAdminStats(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/admin/stats');
  });
});

describe('useAddRemoveTherapist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
  });

  it('calls POST /user/assign', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Therapist added' } });

    const { result } = renderHook(() => useAddRemoveTherapist(), { wrapper: createQueryClientWrapper() });

    act(() => {
      result.current.mutate({ patientId: 'p1', therapistId: 't1', action: 'add' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/user/assign', expect.any(Object));
  });
});

describe('useAdminVerifyTherapist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: mockUser });
  });

  it('calls POST /user/verify', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { message: 'Verified' } });

    const { result } = renderHook(() => useAdminVerifyTherapist(), { wrapper: createQueryClientWrapper() });

    act(() => {
      result.current.mutate({ therapistId: 't1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/user/verify', expect.any(Object));
  });
});
