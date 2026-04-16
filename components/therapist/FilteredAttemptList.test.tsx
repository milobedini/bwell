import type { AttemptListItem } from '@milobedini/shared-types';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush })
}));

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => <Text>{name}</Text> };
});

jest.mock('@/utils/moduleIcons', () => ({
  getModuleDisplayTitle: (title: string) => title,
  getModuleIcon: () => 'clipboard-text'
}));

jest.mock('@/utils/dates', () => ({
  dueLabel: (d: string) => `Due: ${d}`,
  formatShortDate: (d: string) => `Short: ${d}`
}));

const FilteredAttemptList = require('./FilteredAttemptList').default;

const makeAttempt = (overrides: Partial<AttemptListItem> = {}): AttemptListItem =>
  ({
    _id: 'att-1',
    moduleType: 'questionnaire',
    module: { title: 'PHQ-9' },
    status: 'submitted',
    iteration: 1,
    completedAt: '2026-04-10',
    ...overrides
  }) as AttemptListItem;

const defaultProps = {
  patientName: 'Alice',
  isFetching: false,
  isPending: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
  refetch: jest.fn()
};

describe('FilteredAttemptList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders loading indicator when isPending', () => {
    render(<FilteredAttemptList {...defaultProps} attempts={[]} isPending={true} />);

    // LoadingIndicator renders ActivityIndicator
    expect(screen.queryByText('No results')).toBeNull();
  });

  it('renders empty state when no attempts and not fetching', () => {
    render(<FilteredAttemptList {...defaultProps} attempts={[]} />);

    expect(screen.getByText('No results')).toBeTruthy();
    expect(screen.getByText('Try adjusting your filters')).toBeTruthy();
  });

  it('does not render empty state while fetching', () => {
    render(<FilteredAttemptList {...defaultProps} attempts={[]} isFetching={true} />);

    expect(screen.queryByText('No results')).toBeNull();
  });

  it('renders attempt card with title and status', () => {
    render(<FilteredAttemptList {...defaultProps} attempts={[makeAttempt()]} />);

    expect(screen.getByText('PHQ-9')).toBeTruthy();
    expect(screen.getByText('Submitted Short: 2026-04-10')).toBeTruthy();
  });

  it('shows percentage for in-progress attempts', () => {
    const attempt = makeAttempt({ status: 'started', percentComplete: 45, completedAt: undefined });
    render(<FilteredAttemptList {...defaultProps} attempts={[attempt]} />);

    expect(screen.getByText('45% complete')).toBeTruthy();
  });

  it('shows abandoned status', () => {
    const attempt = makeAttempt({ status: 'abandoned', completedAt: undefined });
    render(<FilteredAttemptList {...defaultProps} attempts={[attempt]} />);

    expect(screen.getByText('Abandoned')).toBeTruthy();
  });

  it('shows due date when present', () => {
    const attempt = makeAttempt({ dueAt: '2026-05-01' });
    render(<FilteredAttemptList {...defaultProps} attempts={[attempt]} />);

    expect(screen.getByText('Due: 2026-05-01')).toBeTruthy();
  });

  it('shows score and band label for completed questionnaires', () => {
    const attempt = makeAttempt({ totalScore: 15, scoreBandLabel: 'Moderate' });
    render(<FilteredAttemptList {...defaultProps} attempts={[attempt]} />);

    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.getByText('Moderate')).toBeTruthy();
  });

  it('navigates on card press', () => {
    render(<FilteredAttemptList {...defaultProps} attempts={[makeAttempt()]} />);

    fireEvent.press(screen.getByText('PHQ-9'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(main)/(tabs)/patients/attempt/[id]',
      params: { id: 'att-1', headerTitle: 'Alice' }
    });
  });
});
