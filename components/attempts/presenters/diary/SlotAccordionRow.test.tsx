import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => <Text>{name}</Text> };
});

const SlotAccordionRow = require('./SlotAccordionRow').default;

describe('SlotAccordionRow', () => {
  const defaultProps = {
    label: 'Morning',
    activityPreview: 'Running',
    isFilled: true,
    onPress: jest.fn()
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders label text', () => {
    render(<SlotAccordionRow {...defaultProps} />);

    expect(screen.getByText('Morning')).toBeTruthy();
  });

  it('renders activity preview when present', () => {
    render(<SlotAccordionRow {...defaultProps} />);

    expect(screen.getByText('Running')).toBeTruthy();
  });

  it('hides activity preview when empty string', () => {
    render(<SlotAccordionRow {...defaultProps} activityPreview="" />);

    expect(screen.queryByText('Running')).toBeNull();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<SlotAccordionRow {...defaultProps} onPress={onPress} />);

    fireEvent.press(screen.getByText('Morning'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility label for filled slot', () => {
    render(<SlotAccordionRow {...defaultProps} isFilled={true} />);

    expect(screen.getByLabelText('Morning, filled. Double tap to expand')).toBeTruthy();
  });

  it('has correct accessibility label for empty slot', () => {
    render(<SlotAccordionRow {...defaultProps} isFilled={false} />);

    expect(screen.getByLabelText('Morning, empty. Double tap to expand')).toBeTruthy();
  });

  it('renders chevron icon', () => {
    render(<SlotAccordionRow {...defaultProps} />);

    expect(screen.getByText('chevron-right')).toBeTruthy();
  });
});
