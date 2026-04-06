import { type ReactNode } from 'react';
import { api } from '@/api/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  useGetMyAttemptDetail,
  useGetPatientTimeline,
  useSaveModuleAttempt,
  useStartModuleAttempt,
  useSubmitAttempt,
  useTherapistGetAttemptDetail
} from './useAttempts';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn()
  }
}));

jest.mock('sonner-native', () => ({
  toast: {
    loading: jest.fn(() => 'toast-1'),
    success: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('./useUsers', () => ({
  useIsLoggedIn: () => true
}));

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
};

describe('useGetMyAttemptDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches attempt detail by ID', async () => {
    const mockDetail = { attempt: { _id: 'at1' } };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockDetail });

    const { result } = renderHook(() => useGetMyAttemptDetail('at1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/attempts/at1');
    expect(result.current.data).toEqual(mockDetail);
  });

  it('does not fetch when attemptId is empty', () => {
    const { result } = renderHook(() => useGetMyAttemptDetail(''), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useTherapistGetAttemptDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches therapist attempt detail', async () => {
    const mockDetail = { attempt: { _id: 'at1' } };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockDetail });

    const { result } = renderHook(() => useTherapistGetAttemptDetail('at1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/attempts/therapist/at1');
  });
});

describe('useGetPatientTimeline', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches patient timeline with infinite query', async () => {
    const mockPage = { attempts: [{ _id: 'at1' }], nextCursor: null };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockPage });

    const { result } = renderHook(() => useGetPatientTimeline({ patientId: 'p1' }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith(
      '/user/therapist/patients/p1/timeline',
      expect.objectContaining({ params: expect.objectContaining({ limit: 20, status: 'all' }) })
    );
    expect(result.current.attempts).toEqual([{ _id: 'at1' }]);
    expect(result.current.nextCursor).toBeNull();
  });

  it('does not fetch when patientId is empty', () => {
    const { result } = renderHook(() => useGetPatientTimeline({ patientId: '' }), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useStartModuleAttempt', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls POST to start attempt', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { attemptId: 'at1' } });

    const { result } = renderHook(() => useStartModuleAttempt(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ moduleId: 'm1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('modules/m1/attempts', {});
  });

  it('includes assignmentId when provided', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { attemptId: 'at1' } });

    const { result } = renderHook(() => useStartModuleAttempt(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ moduleId: 'm1', assignmentId: 'a1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('modules/m1/attempts', { assignmentId: 'a1' });
  });
});

describe('useSaveModuleAttempt', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls PATCH to save progress', async () => {
    (api.patch as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(() => useSaveModuleAttempt('at1'), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ responses: [] } as Parameters<typeof result.current.mutate>[0]);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.patch).toHaveBeenCalledWith('attempts/at1', expect.any(Object));
  });
});

describe('useSubmitAttempt', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls POST to submit attempt', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(() => useSubmitAttempt('at1'), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ responses: [] } as Parameters<typeof result.current.mutate>[0]);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('attempts/at1/submit', expect.any(Object));
  });
});
