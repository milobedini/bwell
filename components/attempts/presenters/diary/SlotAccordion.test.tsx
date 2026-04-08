import { fireEvent, render } from '@testing-library/react-native';

import SlotAccordionPanel from './SlotAccordionPanel';
import SlotAccordionRow from './SlotAccordionRow';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' }
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: unknown }) => children,
  Gesture: {
    Pan: () => ({
      onStart: () => ({ onUpdate: () => ({ onEnd: () => ({}) }) }),
      onUpdate: () => ({ onEnd: () => ({}) }),
      onEnd: () => ({})
    })
  }
}));

describe('SlotAccordionRow', () => {
  it('renders time label', () => {
    const { getByText } = render(
      <SlotAccordionRow label="06:00–08:00" activityPreview="" isFilled={false} onPress={jest.fn()} />
    );
    expect(getByText('06:00–08:00')).toBeTruthy();
  });

  it('shows activity preview when filled', () => {
    const { getByText } = render(
      <SlotAccordionRow label="06:00–08:00" activityPreview="Morning walk" isFilled={true} onPress={jest.fn()} />
    );
    expect(getByText('Morning walk')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <SlotAccordionRow label="06:00–08:00" activityPreview="" isFilled={false} onPress={onPress} />
    );
    fireEvent.press(getByLabelText('06:00–08:00, empty. Double tap to expand'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('SlotAccordionPanel', () => {
  const defaultProps = {
    label: '06:00–08:00',
    activity: '',
    mood: undefined as number | undefined,
    achievement: undefined as number | undefined,
    closeness: undefined as number | undefined,
    enjoyment: undefined as number | undefined,
    isFilled: false,
    isComplete: false,
    canEdit: true,
    showReflectionPrompt: false,
    reflectionPrompt: 'Test prompt',
    onActivityChange: jest.fn(),
    onMoodChange: jest.fn(),
    onStepperChange: jest.fn(),
    onCollapse: jest.fn()
  };

  it('renders activity text input in edit mode', () => {
    const { getByPlaceholderText } = render(<SlotAccordionPanel {...defaultProps} />);
    expect(getByPlaceholderText('What did you do?')).toBeTruthy();
  });

  it('renders mood slider', () => {
    const { getByLabelText } = render(<SlotAccordionPanel {...defaultProps} />);
    expect(getByLabelText('Mood slider, not set')).toBeTruthy();
  });

  it('renders 3 metric steppers', () => {
    const { getByText } = render(<SlotAccordionPanel {...defaultProps} />);
    expect(getByText('Achievement')).toBeTruthy();
    expect(getByText('Closeness')).toBeTruthy();
    expect(getByText('Enjoyment')).toBeTruthy();
  });

  it('shows reflection prompt when showReflectionPrompt is true', () => {
    const { getByText } = render(<SlotAccordionPanel {...defaultProps} showReflectionPrompt={true} />);
    expect(getByText('Test prompt')).toBeTruthy();
  });

  it('hides reflection prompt when showReflectionPrompt is false', () => {
    const { queryByText } = render(<SlotAccordionPanel {...defaultProps} showReflectionPrompt={false} />);
    expect(queryByText('Test prompt')).toBeNull();
  });
});
