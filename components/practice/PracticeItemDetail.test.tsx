import type { ReactNode } from 'react';
import PracticeItemDetail from '@/components/practice/PracticeItemDetail';
import { render, screen } from '@testing-library/react-native';

// ── Mocks ──

jest.mock('@/hooks/useAttempts', () => ({
  useGetMyAttemptDetail: jest.fn(),
  useStartModuleAttempt: jest.fn(() => ({ mutate: jest.fn(), isPending: false }))
}));

jest.mock('@/hooks/usePractice', () => ({
  useMyPractice: jest.fn()
}));

jest.mock('@/components/attempts/presenters/AttemptPresenter', () => {
  const { View } = require('react-native');
  return (_props: { attempt: unknown }) => <View testID="attempt-presenter" />;
});

jest.mock('@/components/ErrorComponent', () => {
  const { View, Text } = require('react-native');
  const comp = (props: { errorType: string }) => (
    <View testID="error">
      <Text>{props.errorType}</Text>
    </View>
  );
  comp.ErrorTypes = { NO_CONTENT: 'NoContentError' };
  return { __esModule: true, default: comp, ErrorTypes: { NO_CONTENT: 'NoContentError' } };
});

jest.mock('@/components/LoadingScreen', () => ({
  LoadingIndicator: () => {
    const { View } = require('react-native');
    return <View testID="loading" />;
  }
}));

jest.mock('@/components/ContentContainer', () => {
  const { View } = require('react-native');
  return ({ children }: { children: ReactNode }) => <View>{children}</View>;
});

jest.mock('../ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children }: { children: ReactNode }) => <Text>{children}</Text>
  };
});

const { useGetMyAttemptDetail } = require('@/hooks/useAttempts');
const { useMyPractice } = require('@/hooks/usePractice');

// ── Helpers ──

const makePracticeItem = (assignmentId: string) => ({
  assignmentId,
  moduleId: 'mod-1',
  moduleTitle: 'PHQ-9',
  moduleType: 'questionnaire',
  status: 'not_started',
  latestAttempt: null
});

const setup = ({
  isPracticePending = false,
  practiceData = null as {
    today: ReturnType<typeof makePracticeItem>[];
    thisWeek: never[];
    upcoming: never[];
    recentlyCompleted: never[];
  } | null,
  attemptData = undefined as { attempt: { _id: string; status: string } | null } | undefined,
  isAttemptPending = false,
  assignmentId = 'assign-1',
  attemptIdParam = undefined as string | undefined
} = {}) => {
  useMyPractice.mockReturnValue({ data: practiceData, isPending: isPracticePending });
  useGetMyAttemptDetail.mockReturnValue({ data: attemptData, isPending: isAttemptPending });
  render(<PracticeItemDetail assignmentId={assignmentId} attemptIdParam={attemptIdParam} />);
};

// ── Tests ──

describe('PracticeItemDetail', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading when practice data is pending', () => {
    setup({ isPracticePending: true });
    expect(screen.getByTestId('loading')).toBeTruthy();
  });

  it('shows "Practice item not found" when item is not in data', () => {
    setup({
      practiceData: { today: [], thisWeek: [], upcoming: [], recentlyCompleted: [] },
      assignmentId: 'nonexistent'
    });
    expect(screen.getByText('Practice item not found.')).toBeTruthy();
  });

  it('shows error when attemptData has no attempt', () => {
    setup({
      practiceData: { today: [makePracticeItem('assign-1')], thisWeek: [], upcoming: [], recentlyCompleted: [] },
      attemptIdParam: 'attempt-1',
      attemptData: { attempt: null },
      isAttemptPending: false
    });
    expect(screen.getByTestId('error')).toBeTruthy();
    expect(screen.getByText('NoContentError')).toBeTruthy();
  });

  it('renders AttemptPresenter when data is loaded', () => {
    setup({
      practiceData: { today: [makePracticeItem('assign-1')], thisWeek: [], upcoming: [], recentlyCompleted: [] },
      attemptIdParam: 'attempt-1',
      attemptData: { attempt: { _id: 'attempt-1', status: 'started' } },
      isAttemptPending: false
    });
    expect(screen.getByTestId('attempt-presenter')).toBeTruthy();
  });
});
