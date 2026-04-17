import { render, screen } from '@testing-library/react-native';

import TherapistDashboard from './TherapistDashboard';

jest.mock('@/hooks/useTherapistDashboard', () => ({
  useTherapistDashboard: jest.fn()
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() }))
}));

jest.mock('@/components/LoadingScreen', () => ({
  LoadingIndicator: () => {
    const { View } = require('react-native');
    return <View testID="loading" />;
  }
}));

jest.mock('@/components/ui/EmptyState', () => {
  const { View, Text } = require('react-native');
  return (props: { title: string }) => (
    <View testID="empty-state">
      <Text>{props.title}</Text>
    </View>
  );
});

jest.mock('./dashboard/StatStrip', () => {
  const { View } = require('react-native');
  return () => <View testID="stat-strip" />;
});

jest.mock('./dashboard/TriageBucket', () => {
  const { forwardRef } = require('react');
  const { View } = require('react-native');
  return Object.assign(
    forwardRef((props: { type: string }, ref: unknown) => <View testID={`bucket-${props.type}`} ref={ref} />),
    { BucketType: {} }
  );
});

jest.mock('@/utils/dates', () => ({
  getGreeting: () => 'Good morning',
  formatShortDate: () => '14 Apr'
}));

const { useTherapistDashboard } = require('@/hooks/useTherapistDashboard') as { useTherapistDashboard: jest.Mock };

describe('TherapistDashboard', () => {
  it('shows loading indicator when isPending', () => {
    useTherapistDashboard.mockReturnValue({ isPending: true, isError: false, data: null });

    render(<TherapistDashboard firstName="Alice" />);

    expect(screen.getByTestId('loading')).toBeTruthy();
  });

  it('shows error empty state when isError', () => {
    useTherapistDashboard.mockReturnValue({ isPending: false, isError: true, data: null });

    render(<TherapistDashboard firstName="Alice" />);

    expect(screen.getByText('Could not load dashboard')).toBeTruthy();
  });

  it('shows "No clients yet" empty state when totalClients is 0', () => {
    useTherapistDashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        weekStart: '2026-04-14',
        stats: { totalClients: 0, needsAttention: 0, submittedThisWeek: 0, overdueAssignments: 0 },
        needsAttention: [],
        completedThisWeek: [],
        noActivity: []
      }
    });

    render(<TherapistDashboard firstName="Alice" />);

    expect(screen.getByText('No clients yet')).toBeTruthy();
  });

  it('shows greeting with firstName', () => {
    useTherapistDashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        weekStart: '2026-04-14',
        stats: { totalClients: 3, needsAttention: 1, submittedThisWeek: 2, overdueAssignments: 0 },
        needsAttention: [],
        completedThisWeek: [],
        noActivity: []
      },
      isRefetching: false,
      refetch: jest.fn()
    });

    render(<TherapistDashboard firstName="Alice" />);

    expect(screen.getByText('Good morning, Alice')).toBeTruthy();
  });

  it('shows "Week of" date text', () => {
    useTherapistDashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        weekStart: '2026-04-14',
        stats: { totalClients: 3, needsAttention: 1, submittedThisWeek: 2, overdueAssignments: 0 },
        needsAttention: [],
        completedThisWeek: [],
        noActivity: []
      },
      isRefetching: false,
      refetch: jest.fn()
    });

    render(<TherapistDashboard firstName="Alice" />);

    expect(screen.getByText('Week of 14 Apr')).toBeTruthy();
  });

  it('renders StatStrip and TriageBuckets when data is loaded', () => {
    useTherapistDashboard.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        weekStart: '2026-04-14',
        stats: { totalClients: 3, needsAttention: 1, submittedThisWeek: 2, overdueAssignments: 0 },
        needsAttention: [],
        completedThisWeek: [],
        noActivity: []
      },
      isRefetching: false,
      refetch: jest.fn()
    });

    render(<TherapistDashboard firstName="Alice" />);

    expect(screen.getByTestId('stat-strip')).toBeTruthy();
    expect(screen.getByTestId('bucket-attention')).toBeTruthy();
    expect(screen.getByTestId('bucket-completed')).toBeTruthy();
    expect(screen.getByTestId('bucket-inactive')).toBeTruthy();
  });
});
