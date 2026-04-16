import { createQueryClientWrapper } from '@/test-utils/createQueryClientWrapper';
import { renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn()
  }
}));

jest.mock('@/hooks/useUsers', () => ({
  useIsLoggedIn: () => true
}));

const { api } = require('@/api/api');
const { useProfileStats } = require('@/hooks/useProfileStats');

describe('useProfileStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches patient profile stats', async () => {
    const mockStats = {
      latestCompletion: { attemptId: 'a1', moduleTitle: 'PHQ-9', completedAt: '2026-04-15T10:00:00.000Z' },
      sessionsThisWeek: 3,
      assignmentsDue: 2
    };

    api.get.mockResolvedValueOnce({ data: mockStats });

    const { result } = renderHook(() => useProfileStats(), {
      wrapper: createQueryClientWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.get).toHaveBeenCalledWith('/user/profile-stats');
    expect(result.current.data).toEqual(mockStats);
  });

  it('does not fetch when enabled is false', () => {
    const { result } = renderHook(() => useProfileStats(false), {
      wrapper: createQueryClientWrapper()
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('handles null latest completion', async () => {
    const mockStats = {
      latestCompletion: null,
      sessionsThisWeek: 0,
      assignmentsDue: 0
    };

    api.get.mockResolvedValueOnce({ data: mockStats });

    const { result } = renderHook(() => useProfileStats(), {
      wrapper: createQueryClientWrapper()
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.latestCompletion).toBeNull();
  });
});
