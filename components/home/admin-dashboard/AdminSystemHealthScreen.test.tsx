import type { ReactNode } from 'react';
import type { AdminSystemHealthResponse } from '@milobedini/shared-types';
import { render } from '@testing-library/react-native';

import AdminSystemHealthScreen from './AdminSystemHealthScreen';

type WithChildren = { children?: ReactNode };

jest.mock('@/hooks/useAdminSystemHealth', () => ({
  useAdminSystemHealth: jest.fn()
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

const { useAdminSystemHealth } = require('@/hooks/useAdminSystemHealth') as {
  useAdminSystemHealth: jest.Mock;
};

const buildResult = (
  data: AdminSystemHealthResponse | undefined,
  overrides: Partial<ReturnType<typeof useAdminSystemHealth>> = {}
) => ({
  data,
  isLoading: false,
  isError: false,
  isRefetching: false,
  refetch: jest.fn(),
  ...overrides
});

describe('AdminSystemHealthScreen', () => {
  it('renders the loading indicator on first load', () => {
    useAdminSystemHealth.mockReturnValue(buildResult(undefined, { isLoading: true }));
    const { getByTestId } = render(<AdminSystemHealthScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders the error state when the query errors', () => {
    useAdminSystemHealth.mockReturnValue(buildResult(undefined, { isError: true }));
    const { getByText } = render(<AdminSystemHealthScreen />);
    expect(getByText(/something went wrong/i)).toBeTruthy();
  });

  it('renders rollup run details and status label when present', () => {
    useAdminSystemHealth.mockReturnValue(
      buildResult({
        rollupLastRun: {
          startedAt: new Date(Date.now() - 2 * 60_000).toISOString(),
          completedAt: new Date(Date.now() - 1 * 60_000).toISOString(),
          status: 'success',
          rowsWritten: 1_234
        },
        auditEventsTotal: 42
      })
    );
    const { getByText } = render(<AdminSystemHealthScreen />);
    expect(getByText('SUCCESS')).toBeTruthy();
    expect(getByText('1,234')).toBeTruthy();
    expect(getByText('42')).toBeTruthy();
  });

  it('renders "No rollup recorded yet" when the rollup has never run', () => {
    useAdminSystemHealth.mockReturnValue(buildResult({ rollupLastRun: null, auditEventsTotal: 0 }));
    const { getByText } = render(<AdminSystemHealthScreen />);
    expect(getByText('No rollup recorded yet.')).toBeTruthy();
    expect(getByText('0')).toBeTruthy();
  });

  it('renders "Still running" when a rollup started but has no completion', () => {
    useAdminSystemHealth.mockReturnValue(
      buildResult({
        rollupLastRun: {
          startedAt: new Date(Date.now() - 60_000).toISOString(),
          completedAt: null,
          status: 'partial',
          rowsWritten: 0
        },
        auditEventsTotal: 10
      })
    );
    const { getByText } = render(<AdminSystemHealthScreen />);
    expect(getByText('Still running')).toBeTruthy();
    expect(getByText('PARTIAL')).toBeTruthy();
  });
});
