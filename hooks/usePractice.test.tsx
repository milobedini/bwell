import { type ReactNode } from 'react';
import { api } from '@/api/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import {
  useMyPractice,
  useMyPracticeHistory,
  usePatientModules,
  usePatientPractice,
  useTherapistReview,
  useTherapistReviewModules
} from './usePractice';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn()
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

describe('useMyPractice', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches practice data', async () => {
    const mockData = { today: [], thisWeek: [], upcoming: [], recentlyCompleted: [] };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useMyPractice(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/practice');
    expect(result.current.data).toEqual(mockData);
  });
});

describe('useMyPracticeHistory', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches practice history with cursor pagination', async () => {
    const mockPage = { items: [{ _id: 'i1' }], nextCursor: null };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockPage });

    const { result } = renderHook(() => useMyPracticeHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/practice/history', { params: {} });
  });

  it('passes filter params', async () => {
    const mockPage = { items: [], nextCursor: null };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockPage });

    const { result } = renderHook(() => useMyPracticeHistory({ moduleType: 'questionnaire', limit: 10 }), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/practice/history', {
      params: { moduleType: 'questionnaire', limit: '10' }
    });
  });

  it('flattens pages via select', async () => {
    const mockPage = { items: [{ _id: 'i1' }, { _id: 'i2' }], nextCursor: 'abc' };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockPage });

    const { result } = renderHook(() => useMyPracticeHistory(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toEqual([{ _id: 'i1' }, { _id: 'i2' }]);
    expect(result.current.data?.nextCursor).toBe('abc');
  });
});

describe('usePatientPractice', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches patient practice for given ID', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { assignments: [] } });

    const { result } = renderHook(() => usePatientPractice('p1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/therapist/patients/p1/practice');
  });

  it('does not fetch when patientId is undefined', () => {
    const { result } = renderHook(() => usePatientPractice(undefined), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePatientModules', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches modules for a patient', async () => {
    const mockModules = { modules: [{ _id: 'm1', title: 'PHQ-9' }] };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockModules });

    const { result } = renderHook(() => usePatientModules('p1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/therapist/patients/p1/modules');
    expect(result.current.data).toEqual([{ _id: 'm1', title: 'PHQ-9' }]);
  });
});

describe('useTherapistReviewModules', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches therapist review modules', async () => {
    const mockData = { modules: [{ _id: 'm1' }] };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useTherapistReviewModules(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/therapist/attempts/modules');
  });
});

describe('useTherapistReview', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches review feed with infinite query', async () => {
    const mockPage = {
      needsAttention: [],
      submissions: { items: [{ _id: 's1' }], nextCursor: null, total: 1 }
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockPage });

    const { result } = renderHook(() => useTherapistReview(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/therapist/review', { params: {} });
    expect(result.current.data?.submissions).toEqual([{ _id: 's1' }]);
    expect(result.current.data?.total).toBe(1);
  });

  it('passes filter params', async () => {
    const mockPage = {
      needsAttention: [],
      submissions: { items: [], nextCursor: null, total: 0 }
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockPage });

    const { result } = renderHook(() => useTherapistReview({ sort: 'newest', patientId: 'p1' }), {
      wrapper: createWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/therapist/review', {
      params: { sort: 'newest', patientId: 'p1' }
    });
  });
});
