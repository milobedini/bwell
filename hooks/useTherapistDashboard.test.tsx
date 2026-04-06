import { api } from '@/api/api';
import { createQueryClientWrapper } from '@/test-utils/createQueryClientWrapper';
import type { TherapistDashboardResponse } from '@milobedini/shared-types';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useTherapistDashboard } from './useTherapistDashboard';

// TODO: extract shared api mock to test-utils/mockApi.ts — this block is duplicated across 9+ test files
jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('@/hooks/useUsers', () => ({
  useIsLoggedIn: jest.fn()
}));

const { useIsLoggedIn } = require('@/hooks/useUsers');

const mockDashboard: TherapistDashboardResponse = {
  weekStart: '2025-01-06',
  stats: { totalClients: 0, needsAttention: 0, submittedThisWeek: 0, overdueAssignments: 0 },
  needsAttention: [],
  completedThisWeek: [],
  noActivity: []
};

describe('useTherapistDashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches dashboard when logged in', async () => {
    useIsLoggedIn.mockReturnValue(true);
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockDashboard });

    const { result } = renderHook(() => useTherapistDashboard(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/therapist/dashboard');
    expect(result.current.data).toEqual(mockDashboard);
  });

  it('does not fetch when not logged in', () => {
    useIsLoggedIn.mockReturnValue(false);

    const { result } = renderHook(() => useTherapistDashboard(), { wrapper: createQueryClientWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(api.get).not.toHaveBeenCalled();
  });
});
