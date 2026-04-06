import { api } from '@/api/api';
import { createQueryClientWrapper } from '@/test-utils/createQueryClientWrapper';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
  useCreateAssignment,
  useRemoveAssignment,
  useUpdateAssignment,
  useUpdateAssignmentStatus
} from './useAssignments';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
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

describe('useCreateAssignment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls POST /assignments', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { assignment: { _id: 'a1' } } });

    const { result } = renderHook(() => useCreateAssignment(), { wrapper: createQueryClientWrapper() });

    act(() => {
      result.current.mutate({ userId: 'p1', moduleId: 'm1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.post).toHaveBeenCalledWith('/assignments', expect.any(Object));
  });
});

describe('useUpdateAssignmentStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls PATCH /assignments/:id', async () => {
    (api.patch as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(() => useUpdateAssignmentStatus('a1'), { wrapper: createQueryClientWrapper() });

    act(() => {
      result.current.mutate({ status: 'completed' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.patch).toHaveBeenCalledWith('/assignments/a1', expect.any(Object));
  });
});

describe('useRemoveAssignment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls DELETE /assignments/:id', async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const { result } = renderHook(() => useRemoveAssignment(), { wrapper: createQueryClientWrapper() });

    act(() => {
      result.current.mutate({ assignmentId: 'a1' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.delete).toHaveBeenCalledWith('/assignments/a1');
  });
});

describe('useUpdateAssignment', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls PATCH /assignments/:id with updates', async () => {
    (api.patch as jest.Mock).mockResolvedValueOnce({ data: { success: true, assignment: {} } });

    const { result } = renderHook(() => useUpdateAssignment(), { wrapper: createQueryClientWrapper() });

    act(() => {
      result.current.mutate({
        assignmentId: 'a1',
        updates: { dueAt: '2026-04-10' }
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.patch).toHaveBeenCalledWith('/assignments/a1', expect.any(Object));
  });
});
