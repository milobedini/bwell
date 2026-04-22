import type { ReactNode } from 'react';
import type { AdminOrphanedAssignmentRow, AdminOrphanedAssignmentsResponse } from '@milobedini/shared-types';
import { render } from '@testing-library/react-native';

import OrphanedAssignmentsScreen from './OrphanedAssignmentsScreen';

type WithChildren = { children?: ReactNode };

jest.mock('@/hooks/useAdminOrphanedAssignments', () => ({
  useAdminOrphanedAssignments: jest.fn(),
  DEFAULT_ORPHANED_FILTERS: {}
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

const { useAdminOrphanedAssignments } = require('@/hooks/useAdminOrphanedAssignments') as {
  useAdminOrphanedAssignments: jest.Mock;
};

const buildRow = (overrides: Partial<AdminOrphanedAssignmentRow> = {}): AdminOrphanedAssignmentRow => ({
  assignmentId: 'as1',
  moduleType: 'questionnaire',
  module: { _id: 'm1', title: 'PHQ-9' },
  user: { _id: 'u1', username: 'patient-a' },
  therapist: { _id: 't1', username: 'therapist-a', isVerifiedTherapist: false },
  reason: 'therapist_unverified',
  status: 'assigned',
  assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  dueAt: null,
  ...overrides
});

const buildResult = (
  items: AdminOrphanedAssignmentRow[] = [],
  overrides: Partial<ReturnType<typeof useAdminOrphanedAssignments>> = {}
) => ({
  data: {
    pages: [
      {
        success: true,
        items,
        nextCursor: null,
        facets: { reasons: [] }
      } satisfies AdminOrphanedAssignmentsResponse
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

describe('OrphanedAssignmentsScreen', () => {
  it('shows the loading indicator on first load', () => {
    useAdminOrphanedAssignments.mockReturnValue(buildResult([], { isLoading: true, data: undefined }));
    const { getByTestId } = render(<OrphanedAssignmentsScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders the error state when the query errors', () => {
    useAdminOrphanedAssignments.mockReturnValue(buildResult([], { isError: true, data: undefined }));
    const { getByText } = render(<OrphanedAssignmentsScreen />);
    expect(getByText(/something went wrong/i)).toBeTruthy();
  });

  it('renders flattened items and title', () => {
    useAdminOrphanedAssignments.mockReturnValue(
      buildResult([
        buildRow({ assignmentId: 'as1', user: { _id: 'u1', username: 'patient-a' } }),
        buildRow({
          assignmentId: 'as2',
          user: { _id: 'u2', username: 'patient-b' },
          reason: 'therapist_missing',
          therapist: null
        })
      ])
    );
    const { getByText } = render(<OrphanedAssignmentsScreen />);
    expect(getByText('Orphaned assignments')).toBeTruthy();
    expect(getByText('patient-a')).toBeTruthy();
    expect(getByText('patient-b')).toBeTruthy();
    expect(getByText('Therapist account deleted')).toBeTruthy();
  });

  it('shows the empty-state copy when there are no orphaned assignments', () => {
    useAdminOrphanedAssignments.mockReturnValue(buildResult([]));
    const { getByText } = render(<OrphanedAssignmentsScreen />);
    expect(getByText('Every assignment is held by a verified therapist.')).toBeTruthy();
  });
});
