import { fireEvent, render, screen } from '@testing-library/react-native';

import RatingTrack from './RatingTrack';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' }
}));

const { impactAsync } = require('expo-haptics');

describe('RatingTrack', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders 11 rating buttons (0-10)', () => {
    render(<RatingTrack selected={null} />);

    for (let i = 0; i <= 10; i++) {
      expect(screen.getByLabelText(`Rate ${i} out of 10`)).toBeTruthy();
    }
  });

  it('renders label when provided', () => {
    render(<RatingTrack selected={null} label="How close are you?" />);
    expect(screen.getByText('How close are you?')).toBeTruthy();
  });

  it('does not render label when not provided', () => {
    render(<RatingTrack selected={null} />);
    expect(screen.queryByText('How close are you?')).toBeNull();
  });

  it('marks the selected button with accessibility state', () => {
    render(<RatingTrack selected={5} />);

    const selected = screen.getByLabelText('Rate 5 out of 10');
    expect(selected.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));

    const unselected = screen.getByLabelText('Rate 3 out of 10');
    expect(unselected.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
  });

  it('calls onSelect with the rating value and triggers haptic', () => {
    const onSelect = jest.fn();
    render(<RatingTrack selected={null} onSelect={onSelect} />);

    fireEvent.press(screen.getByLabelText('Rate 7 out of 10'));

    expect(onSelect).toHaveBeenCalledWith(7);
    expect(impactAsync).toHaveBeenCalledTimes(1);
  });

  it('does not call onSelect when disabled', () => {
    const onSelect = jest.fn();
    render(<RatingTrack selected={null} onSelect={onSelect} disabled />);

    fireEvent.press(screen.getByLabelText('Rate 7 out of 10'));

    expect(onSelect).not.toHaveBeenCalled();
    expect(impactAsync).not.toHaveBeenCalled();
  });

  it('does not call haptic when no onSelect provided', () => {
    render(<RatingTrack selected={null} />);

    fireEvent.press(screen.getByLabelText('Rate 3 out of 10'));

    expect(impactAsync).not.toHaveBeenCalled();
  });
});
