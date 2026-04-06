import { toast } from 'sonner-native';
import { createQueryClientWrapper } from '@/test-utils/createQueryClientWrapper';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useMutationWithToast } from './useMutationWithToast';

jest.mock('sonner-native', () => ({
  toast: {
    loading: jest.fn(() => 'toast-1'),
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('useMutationWithToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading and success toasts on successful mutation', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ id: '1' });

    const { result } = renderHook(
      () =>
        useMutationWithToast({
          mutationFn,
          toast: { pending: 'Saving...', success: 'Saved' }
        }),
      { wrapper: createQueryClientWrapper() }
    );

    act(() => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toast.loading).toHaveBeenCalledWith('Saving...', expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith('Saved', expect.objectContaining({ id: 'toast-1' }));
  });

  it('shows loading and error toasts on failed mutation', async () => {
    const mutationFn = jest.fn().mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(
      () =>
        useMutationWithToast({
          mutationFn,
          toast: { pending: 'Saving...', success: 'Saved', error: 'Custom error' }
        }),
      { wrapper: createQueryClientWrapper() }
    );

    act(() => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.loading).toHaveBeenCalledWith('Saving...', expect.any(Object));
    expect(toast.error).toHaveBeenCalledWith('Custom error', expect.objectContaining({ id: 'toast-1' }));
  });

  it('uses dynamic success message when function provided', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ name: 'Test' });

    const { result } = renderHook(
      () =>
        useMutationWithToast({
          mutationFn,
          toast: { pending: 'Saving...', success: (data: { name: string }) => `Saved ${data.name}` }
        }),
      { wrapper: createQueryClientWrapper() }
    );

    act(() => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toast.success).toHaveBeenCalledWith('Saved Test', expect.any(Object));
  });

  it('mutateSilently skips toasts', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ id: '1' });

    const { result } = renderHook(
      () =>
        useMutationWithToast({
          mutationFn,
          toast: { pending: 'Saving...', success: 'Saved' }
        }),
      { wrapper: createQueryClientWrapper() }
    );

    act(() => {
      result.current.mutateSilently(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(toast.loading).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
