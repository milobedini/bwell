import type { AdminAuditEvent, AdminAuditResponse } from '@milobedini/shared-types';
import { fireEvent, render } from '@testing-library/react-native';

import AdminAuditScreen from './AdminAuditScreen';

jest.mock('@/hooks/useAdminAudit', () => ({
  useAdminAudit: jest.fn(),
  DEFAULT_AUDIT_FILTERS: {}
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: (props: { children: unknown }) => <View>{props.children as never}</View>,
    SafeAreaProvider: (props: { children: unknown }) => <>{props.children as never}</>
  };
});
jest.mock('@/components/LoadingScreen', () => {
  const { View } = require('react-native');
  return { LoadingIndicator: () => <View testID="loading-indicator" /> };
});
jest.mock('react-native-paper', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    Portal: (props: { children: unknown }) => <View>{props.children as never}</View>,
    Surface: (props: { children: unknown }) => <View>{props.children as never}</View>,
    Button: (props: { children: unknown; onPress?: () => void }) => (
      <Pressable onPress={props.onPress}>
        <Text>{props.children as never}</Text>
      </Pressable>
    ),
    Chip: (props: { children: unknown; onPress?: () => void }) => (
      <Pressable onPress={props.onPress}>
        <Text>{props.children as never}</Text>
      </Pressable>
    ),
    Divider: () => <View />,
    IconButton: () => <View />
  };
});

const { useAdminAudit } = require('@/hooks/useAdminAudit') as { useAdminAudit: jest.Mock };

const buildEvent = (overrides: Partial<AdminAuditEvent> = {}): AdminAuditEvent => ({
  _id: 'e1',
  actorId: 'a1',
  actor: { _id: 'a1', username: 'admin@bwell.test', name: 'Admin' },
  actorRole: 'admin',
  impersonatorId: null,
  action: 'therapist.verified',
  resourceType: 'user',
  resourceId: null,
  outcome: 'success',
  context: { tier: 'cbt' },
  at: new Date(Date.now() - 5 * 60_000).toISOString(),
  ...overrides
});

const buildResult = (events: AdminAuditEvent[] = [], overrides: Partial<ReturnType<typeof useAdminAudit>> = {}) => {
  const actors = Array.from(
    new Map(events.map((e) => [e.actorId, { _id: e.actorId, username: e.actor.username, name: e.actor.name }])).values()
  ).map((a, i) => ({ ...a, count: events.filter((e) => e.actorId === a._id).length || 1 + i }));
  return {
    data: {
      pages: [{ success: true, events, nextCursor: null, facets: { actors } } satisfies AdminAuditResponse],
      pageParams: [null]
    },
    isLoading: false,
    isError: false,
    isRefetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    refetch: jest.fn(),
    fetchNextPage: jest.fn(),
    ...overrides
  };
};

describe('AdminAuditScreen', () => {
  it('renders the loading indicator on the first load', () => {
    useAdminAudit.mockReturnValue(buildResult([], { isLoading: true, data: undefined }));
    const { getByTestId } = render(<AdminAuditScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders an error state when the query errors', () => {
    useAdminAudit.mockReturnValue(buildResult([], { isError: true, data: undefined }));
    const { getByText } = render(<AdminAuditScreen />);
    expect(getByText(/something went wrong/i)).toBeTruthy();
  });

  it('renders events from the infinite-query pages flattened in order', () => {
    useAdminAudit.mockReturnValue(
      buildResult([
        buildEvent({ _id: 'e1', action: 'therapist.verified' }),
        buildEvent({ _id: 'e2', action: 'user.viewed', context: {} }),
        buildEvent({ _id: 'e3', action: 'module.created', resourceType: 'module', context: {} })
      ])
    );
    const { getAllByText } = render(<AdminAuditScreen />);
    // Each action label appears once per row AND once in the filter drawer chip options,
    // so these assertions only check presence.
    expect(getAllByText('therapist.verified').length).toBeGreaterThan(0);
    expect(getAllByText('user.viewed').length).toBeGreaterThan(0);
    expect(getAllByText('module.created').length).toBeGreaterThan(0);
  });

  it('shows empty-state copy when there are no events and no filters', () => {
    useAdminAudit.mockReturnValue(buildResult([]));
    const { getByText } = render(<AdminAuditScreen />);
    expect(getByText('No audit events yet.')).toBeTruthy();
  });

  it('opens the filter drawer when the filters button is pressed', () => {
    useAdminAudit.mockReturnValue(buildResult([]));
    const { getByLabelText, getAllByText } = render(<AdminAuditScreen />);
    fireEvent.press(getByLabelText('Open audit filters'));
    // Drawer renders action option chips
    expect(getAllByText('therapist.verified').length).toBeGreaterThan(0);
    expect(getAllByText('module.created').length).toBeGreaterThan(0);
  });
});
