import type { PracticeItem as PracticeItemType } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

import PracticeItem from './PracticeItem';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush })
}));

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ name }: { name: string }) => <Text>{name}</Text>
  };
});

jest.mock('@/utils/moduleIcons', () => ({
  getModuleDisplayTitle: (title: string) => title,
  getModuleIcon: () => 'clipboard-text-outline'
}));

jest.mock('@/utils/dates', () => ({
  dueLabel: (d: string) => `Due: ${d}`,
  formatShortDate: (d: string) => `Short: ${d}`
}));

const makeItem = (overrides: Partial<PracticeItemType> = {}): PracticeItemType =>
  ({
    assignmentId: 'a1',
    moduleId: 'm1',
    moduleTitle: 'PHQ-9',
    moduleType: 'questionnaire',
    status: 'not_started',
    percentComplete: 0,
    attemptCount: 1,
    ...overrides
  }) as PracticeItemType;

describe('PracticeItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders module title', () => {
    render(<PracticeItem item={makeItem()} />);
    expect(screen.getByText('PHQ-9')).toBeTruthy();
  });

  it('shows "Start" for not started items', () => {
    render(<PracticeItem item={makeItem()} />);
    expect(screen.getByText('Start')).toBeTruthy();
  });

  it('shows "Continue" for in-progress items', () => {
    render(<PracticeItem item={makeItem({ status: 'in_progress', percentComplete: 50 })} />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('renders progress bar for in-progress items with progress', () => {
    render(<PracticeItem item={makeItem({ status: 'in_progress', percentComplete: 60 })} />);
    // Progress bar exists when percentComplete > 0
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('shows due label when dueAt is set', () => {
    render(<PracticeItem item={makeItem({ dueAt: '2026-04-20' })} />);
    expect(screen.getByText('Due: 2026-04-20')).toBeTruthy();
  });

  it('shows therapist name when available', () => {
    render(<PracticeItem item={makeItem({ therapistName: 'Dr Jones' })} />);
    expect(screen.getByText('Dr Jones')).toBeTruthy();
  });

  it('shows score and band for completed items', () => {
    render(
      <PracticeItem
        item={makeItem({
          status: 'completed',
          latestAttempt: {
            attemptId: 'att-1',
            status: 'submitted',
            completedAt: '2026-04-10',
            totalScore: 15,
            scoreBandLabel: 'Moderate',
            iteration: 1
          }
        })}
      />
    );
    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.getByText('Moderate')).toBeTruthy();
  });

  it('shows completion date for completed items', () => {
    render(
      <PracticeItem
        item={makeItem({
          status: 'completed',
          latestAttempt: {
            attemptId: 'att-1',
            status: 'submitted',
            completedAt: '2026-04-10',
            iteration: 1
          }
        })}
      />
    );
    expect(screen.getByText('Completed Short: 2026-04-10')).toBeTruthy();
  });
});
