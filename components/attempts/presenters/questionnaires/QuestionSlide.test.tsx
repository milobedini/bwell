import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('react-native-paper', () => {
  const { Text, Pressable } = require('react-native');
  return {
    Card: Object.assign(({ children }: { children: ReactNode }) => <>{children}</>, {
      Content: ({ children }: { children: ReactNode }) => <>{children}</>
    }),
    Chip: ({
      children,
      onPress,
      disabled,
      testID
    }: {
      children: ReactNode;
      onPress?: () => void;
      disabled?: boolean;
      testID?: string;
    }) => (
      <Pressable onPress={onPress} disabled={disabled} testID={testID} accessibilityRole="button">
        <Text>{children}</Text>
      </Pressable>
    )
  };
});

const QuestionSlide = require('./QuestionSlide').default;

// ── Test data ──

const makeQuestion = (overrides = {}) => ({
  questionId: 'q1',
  questionText: 'How often have you felt down?',
  choices: [
    { text: 'Not at all', score: 0 },
    { text: 'Several days', score: 1 },
    { text: 'More than half', score: 2 }
  ],
  chosenIndex: 1,
  chosenScore: 1,
  chosenText: 'Several days',
  ...overrides
});

const defaultColors = {
  card: '#1a1a1a',
  accent: '#18cdba',
  muted: '#a6adbb',
  textOnDark: 'white'
};

describe('QuestionSlide', () => {
  it('renders the question text', () => {
    render(<QuestionSlide mode="view" question={makeQuestion()} colors={defaultColors} />);

    expect(screen.getByText('How often have you felt down?')).toBeTruthy();
  });

  it('renders all choice chips', () => {
    render(<QuestionSlide mode="view" question={makeQuestion()} colors={defaultColors} />);

    expect(screen.getByText('Not at all')).toBeTruthy();
    expect(screen.getByText('Several days')).toBeTruthy();
    expect(screen.getByText('More than half')).toBeTruthy();
  });

  it('calls onPick with correct args when a chip is pressed in edit mode', () => {
    const onPick = jest.fn();
    const question = makeQuestion();
    render(<QuestionSlide mode="edit" question={question} onPick={onPick} colors={defaultColors} />);

    fireEvent.press(screen.getByText('More than half'));

    expect(onPick).toHaveBeenCalledWith(question, { score: 2, index: 2, text: 'More than half' });
  });

  it('does not call onPick in view mode', () => {
    const onPick = jest.fn();
    render(<QuestionSlide mode="view" question={makeQuestion()} onPick={onPick} colors={defaultColors} />);

    fireEvent.press(screen.getByText('Not at all'));

    expect(onPick).not.toHaveBeenCalled();
  });

  it('renders with no chosenIndex (unanswered question)', () => {
    const question = makeQuestion({ chosenIndex: null, chosenScore: null, chosenText: null });
    render(<QuestionSlide mode="edit" question={question} colors={defaultColors} />);

    expect(screen.getByText('Not at all')).toBeTruthy();
    expect(screen.getByText('Several days')).toBeTruthy();
    expect(screen.getByText('More than half')).toBeTruthy();
  });
});
