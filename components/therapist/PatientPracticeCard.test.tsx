import type { PracticeItem } from '@milobedini/shared-types';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush })
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' }
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
  submittedLabel: (d: string) => `on ${d}`
}));

jest.mock('../ui/BarSparkline', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>Sparkline</Text> };
});

const PatientPracticeCard = require('./PatientPracticeCard').default;

const makeItem = (overrides: Partial<PracticeItem> = {}): PracticeItem =>
  ({
    assignmentId: 'a1',
    moduleId: 'm1',
    moduleTitle: 'PHQ-9',
    moduleType: 'questionnaire',
    status: 'not_started',
    percentComplete: 0,
    attemptCount: 1,
    ...overrides
  }) as PracticeItem;

const defaultProps = {
  patientId: 'p1',
  patientName: 'Alice'
};

describe('PatientPracticeCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders module title', () => {
    render(<PatientPracticeCard {...defaultProps} item={makeItem()} />);

    expect(screen.getByText('PHQ-9')).toBeTruthy();
  });

  it('shows "Not started" for not_started status', () => {
    render(<PatientPracticeCard {...defaultProps} item={makeItem()} />);

    expect(screen.getByText('Not started')).toBeTruthy();
  });

  it('shows submitted label for completed items', () => {
    const item = makeItem({
      status: 'completed',
      latestAttempt: {
        attemptId: 'att-1',
        completedAt: '2026-04-10',
        iteration: 1,
        totalScore: 12,
        scoreBandLabel: 'Moderate',
        status: 'submitted'
      }
    });
    render(<PatientPracticeCard {...defaultProps} item={item} />);

    expect(screen.getByText('Submitted on 2026-04-10')).toBeTruthy();
  });

  it('shows percentage for in-progress items', () => {
    const item = makeItem({ status: 'in_progress', percentComplete: 60 });
    render(<PatientPracticeCard {...defaultProps} item={item} />);

    expect(screen.getByText('60% complete')).toBeTruthy();
  });

  it('shows score and band for completed questionnaire', () => {
    const item = makeItem({
      status: 'completed',
      latestAttempt: {
        attemptId: 'att-1',
        completedAt: '2026-04-10',
        iteration: 1,
        totalScore: 15,
        scoreBandLabel: 'Moderate',
        status: 'submitted'
      }
    });
    render(<PatientPracticeCard {...defaultProps} item={item} />);

    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.getByText('Moderate')).toBeTruthy();
  });

  it('shows due date when present and not completed', () => {
    const item = makeItem({ dueAt: '2026-04-20' });
    render(<PatientPracticeCard {...defaultProps} item={item} />);

    expect(screen.getByText('Due: 2026-04-20')).toBeTruthy();
  });

  it('shows overdue badge when past due and not completed', () => {
    const item = makeItem({ dueAt: '2020-01-01' });
    render(<PatientPracticeCard {...defaultProps} item={item} />);

    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('shows recurrence label for weekly recurrence', () => {
    const item = makeItem({ recurrence: { freq: 'weekly', interval: 1 } as never });
    render(<PatientPracticeCard {...defaultProps} item={item} />);

    expect(screen.getByText('Weekly')).toBeTruthy();
  });

  it('shows recurrence label for multi-week recurrence', () => {
    const item = makeItem({ recurrence: { freq: 'weekly', interval: 2 } as never });
    render(<PatientPracticeCard {...defaultProps} item={item} />);

    expect(screen.getByText('Every 2 weeks')).toBeTruthy();
  });

  it('shows attempt count badge when count > 1 and not general_goals', () => {
    const item = makeItem({ attemptCount: 3 });
    render(<PatientPracticeCard {...defaultProps} item={item} />);

    expect(screen.getByText('#3')).toBeTruthy();
  });

  it('hides attempt count badge for general_goals', () => {
    const item = makeItem({ attemptCount: 3, moduleType: 'general_goals' });
    render(<PatientPracticeCard {...defaultProps} item={item} />);

    expect(screen.queryByText('#3')).toBeNull();
  });

  it('renders sparkline when provided with multiple values', () => {
    const item = makeItem({
      status: 'completed',
      latestAttempt: {
        attemptId: 'att-1',
        completedAt: '2026-04-10',
        iteration: 1,
        totalScore: 10,
        scoreBandLabel: 'Mild',
        status: 'submitted'
      }
    });
    render(<PatientPracticeCard {...defaultProps} item={item} sparkline={[5, 10, 15]} />);

    expect(screen.getByText('Sparkline')).toBeTruthy();
  });

  it('navigates on press when attempt is available', () => {
    const item = makeItem({
      status: 'completed',
      latestAttempt: { attemptId: 'att-1', completedAt: '2026-04-10', iteration: 1, status: 'submitted' }
    });
    render(<PatientPracticeCard {...defaultProps} item={item} />);

    fireEvent.press(screen.getByText('PHQ-9'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(main)/(tabs)/patients/attempt/[id]',
      params: { id: 'att-1', headerTitle: 'Alice' }
    });
  });

  it('calls onLongPress with haptic feedback', () => {
    const onLongPress = jest.fn();
    const item = makeItem();
    render(<PatientPracticeCard {...defaultProps} item={item} onLongPress={onLongPress} />);

    fireEvent(screen.getByText('PHQ-9'), 'onLongPress');
    expect(onLongPress).toHaveBeenCalledWith(item);
  });
});
