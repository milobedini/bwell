import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Build a mock UseQueryResult with sensible defaults.
 * Override only the fields your test cares about.
 *
 * UseQueryResult is a discriminated union, so a plain object can't satisfy it directly.
 * This helper produces a test-only approximation — safe for mockReturnValue() calls.
 */
export const mockQueryResult = <TData = unknown, TError = Error>(
  overrides: Partial<UseQueryResult<TData, TError>> = {}
): UseQueryResult<TData, TError> => {
  const base = {
    data: undefined,
    error: null,
    isError: false,
    isPending: true,
    isSuccess: false,
    isLoading: true,
    isLoadingError: false,
    isRefetchError: false,
    isRefetching: false,
    isFetching: true,
    isFetched: false,
    isFetchedAfterMount: false,
    isPlaceholderData: false,
    isStale: false,
    status: 'pending' as const,
    fetchStatus: 'fetching' as const,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    refetch: jest.fn(),
    promise: Promise.resolve(undefined as unknown as TData),
    ...overrides
  };

  // UseQueryResult is a discriminated union that can't be constructed directly.
  // This cast is intentional for test mocking purposes.
  return base as unknown as UseQueryResult<TData, TError>;
};
