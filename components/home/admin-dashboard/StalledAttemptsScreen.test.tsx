import type { ReactNode } from 'react';
import type { AdminStalledAttemptRow, AdminStalledAttemptsResponse } from '@milobedini/shared-types';
import { render } from '@testing-library/react-native';

import StalledAttemptsScreen from './StalledAttemptsScreen';

type WithChildren = { children?: ReactNode };

jest.mock('@/hooks/useAdminStalledAttempts', () => ({
  useAdminStalledAttempts: jest.fn(),
  DEFAULT_STALLED_FILTERS: {}
}));
jest.mock('@/components/LoadingScreen', () => {
  const { View } = require('react-native');
  return { LoadingIndicator: () => <View testID="loading-indicator" /> };
});
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: ({ children }: WithChildren) => <View>{children}</View>,
    SafeAreaProvider: ({ children }: WithChildren) => <>{children}</>
  };
});

const { useAdminStalledAttempts } = require('@/hooks/useAdminStalledAttempts') as {
  useAdminStalledAttempts: jest.Mock;
};

const buildRow = (overrides: Partial<AdminStalledAttemptRow> = {}): AdminStalledAttemptRow => ({
  attemptId: 'a1',
  moduleType: 'questionnaire',
  module: { _id: 'm1', title: 'PHQ-9' },
  user: { _id: 'u1', username: 'patient-a' },
  therapist: null,
  startedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  lastInteractionAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides
});

const buildResult = (
  items: AdminStalledAttemptRow[] = [],
  overrides: Partial<ReturnType<typeof useAdminStalledAttempts>> = {}
) => ({
  data: {
    pages: [
      {
        success: true,
        items,
        nextCursor: null,
        facets: { moduleTypes: [] }
      } satisfies AdminStalledAttemptsResponse
    ],
    pageParams: [null]
  },
  isLoading: false,
  isError: false,
  isFetching: false,
  isRefetching: false,
  isFetchingNextPage: false,
  hasNextPage: false,
  refetch: jest.fn(),
  fetchNextPage: jest.fn(),
  ...overrides
});

describe('StalledAttemptsScreen', () => {
  it('shows the loading indicator on first load', () => {
    useAdminStalledAttempts.mockReturnValue(buildResult([], { isLoading: true, data: undefined }));
    const { getByTestId } = render(<StalledAttemptsScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders the error state when the query errors', () => {
    useAdminStalledAttempts.mockReturnValue(buildResult([], { isError: true, data: undefined }));
    const { getByText } = render(<StalledAttemptsScreen />);
    expect(getByText(/something went wrong/i)).toBeTruthy();
  });

  it('renders flattened items and the title', () => {
    useAdminStalledAttempts.mockReturnValue(
      buildResult([
        buildRow({ attemptId: 'a1', user: { _id: 'u1', username: 'patient-a' } }),
        buildRow({ attemptId: 'a2', user: { _id: 'u2', username: 'patient-b' } })
      ])
    );
    const { getByText } = render(<StalledAttemptsScreen />);
    expect(getByText('Stalled attempts')).toBeTruthy();
    expect(getByText('patient-a')).toBeTruthy();
    expect(getByText('patient-b')).toBeTruthy();
  });

  it('shows empty-state copy when there are no stalled attempts', () => {
    useAdminStalledAttempts.mockReturnValue(buildResult([]));
    const { getByText } = render(<StalledAttemptsScreen />);
    expect(getByText('No stalled attempts right now.')).toBeTruthy();
  });
});
