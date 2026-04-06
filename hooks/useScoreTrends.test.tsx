import { api } from '@/api/api';
import { createQueryClientWrapper } from '@/test-utils/createQueryClientWrapper';
import type { ScoreTrendsResponse } from '@milobedini/shared-types';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useScoreTrends } from './useScoreTrends';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));

jest.mock('./useUsers', () => ({
  useIsLoggedIn: jest.fn()
}));

const { useIsLoggedIn } = require('./useUsers');

const mockTrends: ScoreTrendsResponse = {
  success: true,
  trends: []
};

describe('useScoreTrends', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches score trends when logged in', async () => {
    useIsLoggedIn.mockReturnValue(true);
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockTrends });

    const { result } = renderHook(() => useScoreTrends(), { wrapper: createQueryClientWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/user/score-trends');
    expect(result.current.data).toEqual(mockTrends);
  });

  it('does not fetch when not logged in', () => {
    useIsLoggedIn.mockReturnValue(false);

    const { result } = renderHook(() => useScoreTrends(), { wrapper: createQueryClientWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(api.get).not.toHaveBeenCalled();
  });
});
