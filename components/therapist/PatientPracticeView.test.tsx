import type { ReactNode } from 'react';
import type { PatientPracticeResponse, PracticeItem } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

// ── Mocks ──

jest.mock('@/hooks/usePractice', () => ({
  usePatientPractice: jest.fn(),
  usePatientModules: jest.fn(() => ({ data: [] }))
}));

jest.mock('@/hooks/useAttempts', () => ({
  useGetPatientTimeline: jest.fn(() => ({
    attempts: [],
    isFetching: false,
    isPending: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: jest.fn(),
    refetch: jest.fn()
  }))
}));

jest.mock('@/hooks/useAssignments', () => ({
  useRemoveAssignment: jest.fn(() => ({ mutate: jest.fn() }))
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  Stack: { Screen: () => null }
}));

jest.mock('@react-native-vector-icons/material-design-icons', () => 'Icon');

jest.mock('react-native-paper', () => ({
  Badge: () => null
}));

jest.mock('../ContentContainer', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <View>{children}</View>
  };
});

jest.mock('../LoadingScreen', () => ({
  LoadingIndicator: () => {
    const { View } = require('react-native');
    return <View testID="loading" />;
  }
}));

jest.mock('../ui/EmptyState', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: (props: { title: string }) => (
      <View testID="empty-state">
        <Text>{props.title}</Text>
      </View>
    )
  };
});

jest.mock('../ui/ActionMenu', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../ui/AttemptFilterDrawer', () => ({
  AttemptFilterDrawer: () => null
}));

jest.mock('./FilteredAttemptList', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('./PatientPracticeCard', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: (props: { item: PracticeItem }) => (
      <View testID="practice-card">
        <Text>{props.item.moduleTitle}</Text>
      </View>
    )
  };
});

const { usePatientPractice } = require('@/hooks/usePractice');

const PatientPracticeView = require('./PatientPracticeView').default;

const makeItem = (overrides: Partial<PracticeItem> = {}): PracticeItem =>
  ({
    assignmentId: 'a1',
    moduleId: 'm1',
    moduleTitle: 'PHQ-9',
    moduleType: 'questionnaire',
    programTitle: 'Depression',
    status: 'not_started',
    ...overrides
  }) as PracticeItem;

describe('PatientPracticeView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator when isPending', () => {
    usePatientPractice.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: true,
      refetch: jest.fn()
    });

    render(<PatientPracticeView patientId="p1" patientName="Jane" />);
    expect(screen.getByTestId('loading')).toBeTruthy();
  });

  it('shows empty state when no sections and not fetching', () => {
    usePatientPractice.mockReturnValue({
      data: { today: [], thisWeek: [], upcoming: [], recentlyCompleted: [] } as PatientPracticeResponse,
      isPending: false,
      isFetching: false,
      refetch: jest.fn()
    });

    render(<PatientPracticeView patientId="p1" patientName="Jane" />);
    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('No practice items')).toBeTruthy();
  });

  it('renders section headers when data is present', () => {
    usePatientPractice.mockReturnValue({
      data: {
        today: [makeItem()],
        thisWeek: [makeItem({ assignmentId: 'a2', moduleTitle: 'GAD-7' })],
        upcoming: [],
        recentlyCompleted: []
      } as PatientPracticeResponse,
      isPending: false,
      isFetching: false,
      refetch: jest.fn()
    });

    render(<PatientPracticeView patientId="p1" patientName="Jane" />);
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('This Week')).toBeTruthy();
  });

  it('renders PatientPracticeCard for each practice item', () => {
    usePatientPractice.mockReturnValue({
      data: {
        today: [makeItem(), makeItem({ assignmentId: 'a2', moduleTitle: 'GAD-7' })],
        thisWeek: [],
        upcoming: [],
        recentlyCompleted: []
      } as PatientPracticeResponse,
      isPending: false,
      isFetching: false,
      refetch: jest.fn()
    });

    render(<PatientPracticeView patientId="p1" patientName="Jane" />);
    expect(screen.getByText('PHQ-9')).toBeTruthy();
    expect(screen.getByText('GAD-7')).toBeTruthy();
    expect(screen.getAllByTestId('practice-card')).toHaveLength(2);
  });

  it('does not show empty sections', () => {
    usePatientPractice.mockReturnValue({
      data: {
        today: [makeItem()],
        thisWeek: [],
        upcoming: [],
        recentlyCompleted: []
      } as PatientPracticeResponse,
      isPending: false,
      isFetching: false,
      refetch: jest.fn()
    });

    render(<PatientPracticeView patientId="p1" patientName="Jane" />);
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.queryByText('This Week')).toBeNull();
    expect(screen.queryByText('Upcoming')).toBeNull();
    expect(screen.queryByText('Recently Completed')).toBeNull();
  });
});
