import type { PracticeItem } from '@milobedini/shared-types';
import { fireEvent, render, screen } from '@testing-library/react-native';

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

const ComingUpList = require('./ComingUpList').default;

const makeAssignment = (overrides: Partial<PracticeItem> = {}): PracticeItem =>
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

describe('ComingUpList', () => {
  it('returns null when assignments list is empty', () => {
    const { toJSON } = render(<ComingUpList assignments={[]} hasMore={false} remainingCount={0} />);
    expect(toJSON()).toBeNull();
  });

  it('renders assignment titles', () => {
    render(
      <ComingUpList
        assignments={[makeAssignment(), makeAssignment({ assignmentId: 'a2', moduleTitle: 'GAD-7' })]}
        hasMore={false}
        remainingCount={0}
      />
    );

    expect(screen.getByText('PHQ-9')).toBeTruthy();
    expect(screen.getByText('GAD-7')).toBeTruthy();
    expect(screen.getByText('Coming Up')).toBeTruthy();
  });

  it('shows "Start" for assignments without a draft', () => {
    render(<ComingUpList assignments={[makeAssignment()]} hasMore={false} remainingCount={0} />);

    expect(screen.getByText('Start →')).toBeTruthy();
  });

  it('shows "Continue" for assignments with a draft', () => {
    const assignment = makeAssignment({
      latestAttempt: { attemptId: 'att-1', status: 'started', iteration: 1 }
    });
    render(<ComingUpList assignments={[assignment]} hasMore={false} remainingCount={0} />);

    expect(screen.getByText('Continue →')).toBeTruthy();
  });

  it('shows due date label', () => {
    render(<ComingUpList assignments={[makeAssignment({ dueAt: '2026-04-20' })]} hasMore={false} remainingCount={0} />);

    expect(screen.getByText('Due: 2026-04-20')).toBeTruthy();
  });

  it('shows "No due date" when dueAt is absent', () => {
    render(<ComingUpList assignments={[makeAssignment()]} hasMore={false} remainingCount={0} />);

    expect(screen.getByText('No due date')).toBeTruthy();
  });

  it('shows remaining count and "View all" when hasMore is true', () => {
    render(<ComingUpList assignments={[makeAssignment()]} hasMore={true} remainingCount={5} />);

    expect(screen.getByText('+5 more')).toBeTruthy();
    expect(screen.getByText('View all →')).toBeTruthy();
  });

  it('hides "View all" when hasMore is false', () => {
    render(<ComingUpList assignments={[makeAssignment()]} hasMore={false} remainingCount={0} />);

    expect(screen.queryByText('View all →')).toBeNull();
  });

  it('navigates to practice tab when "View all" is pressed', () => {
    render(<ComingUpList assignments={[makeAssignment()]} hasMore={true} remainingCount={3} />);

    fireEvent.press(screen.getByText('View all →'));
    expect(mockPush).toHaveBeenCalledWith('/(main)/(tabs)/practice');
  });
});
