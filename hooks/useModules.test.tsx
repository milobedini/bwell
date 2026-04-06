import { type ReactNode } from 'react';
import { api } from '@/api/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useCreateModule, useModuleById, useModules } from './useModules';

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

jest.mock('./useUsers', () => ({
  useIsLoggedIn: () => true
}));

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
};

describe('useModuleById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches module by ID', async () => {
    const mockModule = { module: { _id: 'm1', title: 'PHQ-9' } };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockModule });

    const { result } = renderHook(() => useModuleById('m1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/modules/detail/m1');
    expect(result.current.data).toEqual(mockModule);
  });
});

describe('useModules', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches plain modules by default', async () => {
    const mockModules = { modules: [{ _id: 'm1' }] };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockModules });

    const { result } = renderHook(() => useModules({ programId: 'p1' }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/modules?program=p1');
  });

  it('fetches modules with meta when withMeta is true', async () => {
    const mockModules = { modules: [{ _id: 'm1', canStart: true }] };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockModules });

    const { result } = renderHook(() => useModules({ programId: 'p1', withMeta: true }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/modules?program=p1&withMeta=true');
  });
});

describe('useCreateModule', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls POST /modules', async () => {
    const newModule = { _id: 'm1', title: 'New Module' };
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { module: newModule } });

    const { result } = renderHook(() => useCreateModule(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({ title: 'New Module', type: 'questionnaire' } as Parameters<
        typeof result.current.mutate
      >[0]);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/modules', expect.any(Object));
  });
});
