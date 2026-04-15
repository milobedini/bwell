import type { PracticeItem } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

import FocusCard from './FocusCard';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush })
}));

jest.mock('@/utils/moduleIcons', () => ({
  getModuleDisplayTitle: (title: string) => title
}));

jest.mock('@/utils/dates', () => ({
  dueLabel: (d: string) => `Due: ${d}`
}));

const makeAssignment = (overrides: Partial<PracticeItem> = {}): PracticeItem =>
  ({
    assignmentId: 'a1',
    moduleId: 'm1',
    moduleTitle: 'PHQ-9',
    moduleType: 'questionnaire',
    status: 'in_progress',
    percentComplete: 0,
    attemptCount: 1,
    ...overrides
  }) as PracticeItem;

describe('FocusCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders "all caught up" state when assignment is null', () => {
    render(<FocusCard assignment={null} />);

    expect(screen.getByText("You're up to date")).toBeTruthy();
    expect(screen.getByText('Explore programs or review your past work')).toBeTruthy();
  });

  it('renders assignment title and "Start" CTA for new assignment', () => {
    render(<FocusCard assignment={makeAssignment()} />);

    expect(screen.getByText('PHQ-9')).toBeTruthy();
    expect(screen.getByText('Start →')).toBeTruthy();
  });

  it('renders "Continue where you left off" when draft exists', () => {
    const assignment = makeAssignment({
      latestAttempt: { attemptId: 'att-1', status: 'started', iteration: 1 }
    });
    render(<FocusCard assignment={assignment} />);

    expect(screen.getByText('Continue where you left off →')).toBeTruthy();
  });

  it('shows therapist name when available', () => {
    render(<FocusCard assignment={makeAssignment({ therapistName: 'Dr Smith' })} />);
    expect(screen.getByText(/Dr Smith/)).toBeTruthy();
  });

  it('shows overdue styling when past due', () => {
    const pastDate = new Date(Date.now() - 2 * 86_400_000).toISOString();
    render(<FocusCard assignment={makeAssignment({ dueAt: pastDate })} />);

    expect(screen.getByText(/OVERDUE/)).toBeTruthy();
  });

  it('shows "YOUR FOCUS THIS WEEK" for soon due items', () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
    render(<FocusCard assignment={makeAssignment({ dueAt: tomorrow })} />);

    expect(screen.getByText('YOUR FOCUS THIS WEEK')).toBeTruthy();
  });

  it('shows "No due date" when dueAt is undefined', () => {
    render(<FocusCard assignment={makeAssignment({ dueAt: undefined })} />);
    expect(screen.getByText('No due date')).toBeTruthy();
  });
});
