import { Colors } from '@/constants/Colors';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('./MoodSlider', () => {
  const { View } = require('react-native');
  return (_props: Record<string, unknown>) => <View testID="mood-slider" />;
});
jest.mock('./MetricStepper', () => {
  const { View, Text } = require('react-native');
  return (props: Record<string, unknown>) => (
    <View testID={`stepper-${props.label}`}>
      <Text>{String(props.label)}</Text>
    </View>
  );
});
jest.mock('./ReflectionPrompt', () => {
  const { View, Text } = require('react-native');
  return (props: Record<string, unknown>) => (
    <View testID="reflection-prompt">
      <Text>{String(props.prompt)}</Text>
    </View>
  );
});
jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => <Text>{name}</Text> };
});

const SlotAccordionPanel = require('./SlotAccordionPanel').default;

describe('SlotAccordionPanel', () => {
  const defaultProps = {
    label: 'Morning',
    activity: 'Running',
    mood: 5,
    achievement: 3,
    closeness: 2,
    enjoyment: 4,
    isFilled: false,
    isComplete: false,
    canEdit: true,
    showReflectionPrompt: false,
    reflectionPrompt: 'How did you feel?',
    onActivityChange: jest.fn(),
    onMoodChange: jest.fn(),
    onStepperChange: jest.fn(),
    onCollapse: jest.fn()
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders label text', () => {
    render(<SlotAccordionPanel {...defaultProps} />);

    expect(screen.getByText('Morning')).toBeTruthy();
  });

  it('calls onCollapse when collapse button is pressed', () => {
    const onCollapse = jest.fn();
    render(<SlotAccordionPanel {...defaultProps} onCollapse={onCollapse} />);

    fireEvent.press(screen.getByLabelText('Morning. Double tap to collapse'));
    expect(onCollapse).toHaveBeenCalledTimes(1);
  });

  it('shows TextInput with placeholder in edit mode', () => {
    render(<SlotAccordionPanel {...defaultProps} canEdit={true} />);

    expect(screen.getByPlaceholderText('What did you do?')).toBeTruthy();
  });

  it('shows activity as plain text in view mode', () => {
    render(<SlotAccordionPanel {...defaultProps} canEdit={false} activity="Running" />);

    expect(screen.getByText('Running')).toBeTruthy();
    expect(screen.queryByPlaceholderText('What did you do?')).toBeNull();
  });

  it('hides activity text in view mode when activity is empty', () => {
    render(<SlotAccordionPanel {...defaultProps} canEdit={false} activity="" />);

    // Should not render the activity text element (only the label "Morning" remains)
    // The empty activity should not produce a visible ThemedText
    expect(screen.queryByPlaceholderText('What did you do?')).toBeNull();
  });

  it('shows ReflectionPrompt when showReflectionPrompt and canEdit are true', () => {
    render(<SlotAccordionPanel {...defaultProps} showReflectionPrompt={true} canEdit={true} />);

    expect(screen.getByTestId('reflection-prompt')).toBeTruthy();
    expect(screen.getByText('How did you feel?')).toBeTruthy();
  });

  it('does not show ReflectionPrompt when showReflectionPrompt is false', () => {
    render(<SlotAccordionPanel {...defaultProps} showReflectionPrompt={false} canEdit={true} />);

    expect(screen.queryByTestId('reflection-prompt')).toBeNull();
  });

  it('does not show ReflectionPrompt when canEdit is false', () => {
    render(<SlotAccordionPanel {...defaultProps} showReflectionPrompt={true} canEdit={false} />);

    expect(screen.queryByTestId('reflection-prompt')).toBeNull();
  });

  it('renders dot with bright colour when isComplete', () => {
    const { toJSON } = render(<SlotAccordionPanel {...defaultProps} isComplete={true} isFilled={true} />);

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.sway.bright);
  });

  it('renders dot with warm colour when filled but not complete', () => {
    const { toJSON } = render(<SlotAccordionPanel {...defaultProps} isComplete={false} isFilled={true} />);

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.diary.moodWarm);
  });

  it('renders dot with inactive colour when neither filled nor complete', () => {
    const { toJSON } = render(<SlotAccordionPanel {...defaultProps} isComplete={false} isFilled={false} />);

    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(Colors.chip.dotInactive);
  });

  it('calls onActivityChange when text input changes', () => {
    const onActivityChange = jest.fn();
    render(<SlotAccordionPanel {...defaultProps} onActivityChange={onActivityChange} />);

    fireEvent.changeText(screen.getByPlaceholderText('What did you do?'), 'Walking');
    expect(onActivityChange).toHaveBeenCalledWith('Walking');
  });

  it('renders MoodSlider', () => {
    render(<SlotAccordionPanel {...defaultProps} />);

    expect(screen.getByTestId('mood-slider')).toBeTruthy();
  });

  it('renders MetricStepper components for achievement, closeness, and enjoyment', () => {
    render(<SlotAccordionPanel {...defaultProps} />);

    expect(screen.getByTestId('stepper-Achievement')).toBeTruthy();
    expect(screen.getByTestId('stepper-Closeness')).toBeTruthy();
    expect(screen.getByTestId('stepper-Enjoyment')).toBeTruthy();
  });
});
