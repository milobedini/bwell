import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';

// ── Mock child components ──

jest.mock('./Dots', () => () => null);
jest.mock('./QuestionSlide', () => () => null);
jest.mock('@/components/ui/Chip', () => ({ SaveProgressChip: () => null }));

// ── Mock react-native-paper as lightweight RN equivalents ──

jest.mock('react-native-paper', () => {
  const { View, Text } = require('react-native');
  return {
    Card: Object.assign(
      ({ children, ...props }: { children: ReactNode; style?: object }) => <View {...props}>{children}</View>,
      {
        Content: ({ children }: { children: ReactNode }) => <View>{children}</View>
      }
    ),
    Chip: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
    Divider: () => <View />,
    ProgressBar: () => <View />
  };
});

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ back: jest.fn() })),
  useLocalSearchParams: jest.fn(() => ({}))
}));

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve())
}));

const mockSaveSilently = jest.fn();
const mockSubmitMutate = jest.fn();

jest.mock('@/hooks/useAttempts', () => ({
  useSaveModuleAttempt: () => ({
    mutateSilently: mockSaveSilently,
    isPending: false,
    isSuccess: false
  }),
  useSubmitAttempt: () => ({
    mutate: mockSubmitMutate
  })
}));

jest.mock('@/components/ThemedButton', () => {
  const { Text, Pressable } = require('react-native');
  return {
    PrimaryButton: ({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) => (
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
        <Text>{title}</Text>
      </Pressable>
    )
  };
});

const QuestionnairePresenter = require('./QuestionnairePresenter').default;

// ── Test data ──

const makeMockAttempt = (overrides = {}) => ({
  _id: 'att-1',
  moduleSnapshot: { title: 'PHQ-9', disclaimer: 'Test disclaimer', content: '' },
  totalScore: 15,
  scoreBandLabel: 'Moderate',
  band: { label: 'Moderate' },
  durationSecs: 125,
  userNote: 'Test note',
  startedAt: '2026-01-01T00:00:00Z',
  completedAt: '2026-01-02T00:00:00Z',
  status: 'submitted',
  ...overrides
});

const makeMockDetail = (overrides = {}) => ({
  items: [
    {
      questionId: 'q1',
      questionText: 'Q1',
      choices: [{ text: 'Never', score: 0 }],
      chosenScore: 0,
      chosenIndex: 0,
      chosenText: 'Never'
    },
    {
      questionId: 'q2',
      questionText: 'Q2',
      choices: [{ text: 'Always', score: 3 }],
      chosenScore: null,
      chosenIndex: null,
      chosenText: null
    }
  ],
  totalQuestions: 2,
  answeredCount: 1,
  percentComplete: 50,
  ...overrides
});

describe('QuestionnairePresenter', () => {
  // ── Header / title ──

  it('renders module title from attempt.moduleSnapshot.title', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="view" />);

    expect(screen.getByText(/PHQ-9/)).toBeTruthy();
  });

  it('shows patient name when provided', () => {
    render(
      <QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="view" patientName="Alice" />
    );

    expect(screen.getByText(/PHQ-9 by Alice/)).toBeTruthy();
  });

  // ── Progress ──

  it('shows answered count and progress percentage', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="view" />);

    expect(screen.getByText('1/2 answered \u2022 50%')).toBeTruthy();
  });

  // ── View mode chips ──

  it('shows "Completed" chip with date in view mode', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="view" />);

    const completedDate = new Date('2026-01-02T00:00:00Z').toLocaleDateString();
    expect(screen.getByText(`Completed ${completedDate}`)).toBeTruthy();
  });

  it('shows "In progress" chip in edit mode', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="edit" />);

    const startedDate = new Date('2026-01-01T00:00:00Z').toLocaleDateString();
    expect(screen.getByText(`In progress \u2022 ${startedDate}`)).toBeTruthy();
  });

  // ── Disclaimer ──

  it('shows disclaimer when moduleSnapshot.disclaimer exists', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="view" />);

    expect(screen.getByText('Test disclaimer')).toBeTruthy();
  });

  it('does not show disclaimer when moduleSnapshot.disclaimer is absent', () => {
    const attempt = makeMockAttempt({
      moduleSnapshot: { title: 'GAD-7', content: '' }
    });
    render(<QuestionnairePresenter attempt={attempt} detail={makeMockDetail()} mode="view" />);

    expect(screen.queryByText('Test disclaimer')).toBeNull();
  });

  // ── Duration ──

  it('shows duration text when durationSecs provided', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="view" />);

    expect(screen.getByText('Duration 2m 5s')).toBeTruthy();
  });

  it('does not show duration when durationSecs is absent', () => {
    const attempt = makeMockAttempt({ durationSecs: undefined });
    render(<QuestionnairePresenter attempt={attempt} detail={makeMockDetail()} mode="view" />);

    expect(screen.queryByText(/Duration/)).toBeNull();
  });

  // ── User note ──

  it('shows userNote card when userNote exists', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="view" />);

    expect(screen.getByText('Note')).toBeTruthy();
    expect(screen.getByText('Test note')).toBeTruthy();
  });

  it('does not show note card when userNote is absent', () => {
    const attempt = makeMockAttempt({ userNote: undefined });
    render(<QuestionnairePresenter attempt={attempt} detail={makeMockDetail()} mode="view" />);

    expect(screen.queryByText('Note')).toBeNull();
  });

  // ── Band chip ──

  it('shows band chip with score in view mode', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="view" />);

    expect(screen.getByText(/Moderate/)).toBeTruthy();
    expect(screen.getByText(/Score: 15/)).toBeTruthy();
  });

  it('does not show band chip in edit mode', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="edit" />);

    expect(screen.queryByText(/Score: 15/)).toBeNull();
  });

  // ── Footer buttons (edit mode) ──

  it('shows "Exit" button when not all questions answered', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="edit" />);

    expect(screen.getByText('Exit')).toBeTruthy();
  });

  it('shows "Submit" button when all questions answered', () => {
    const detail = makeMockDetail({
      answeredCount: 2,
      totalQuestions: 2,
      percentComplete: 100
    });
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={detail} mode="edit" />);

    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('does not show footer button in view mode', () => {
    render(<QuestionnairePresenter attempt={makeMockAttempt()} detail={makeMockDetail()} mode="view" />);

    expect(screen.queryByText('Submit')).toBeNull();
    expect(screen.queryByText('Exit')).toBeNull();
  });
});
