import { fireEvent, render, screen } from '@testing-library/react-native';

import SelectField from './SelectField';

describe('SelectField', () => {
  it('renders value text when provided', () => {
    render(<SelectField label="Therapist" value="Dr Smith" />);
    expect(screen.getByText('Dr Smith')).toBeTruthy();
  });

  it('renders placeholder when no value', () => {
    render(<SelectField label="Therapist" placeholder="Pick one" />);
    expect(screen.getByText('Pick one')).toBeTruthy();
  });

  it('renders default placeholder when no value and no placeholder', () => {
    render(<SelectField label="Therapist" />);
    expect(screen.getByText('Select…')).toBeTruthy();
  });

  it('renders label as description', () => {
    render(<SelectField label="Therapist" value="Dr Smith" />);
    expect(screen.getByText('Therapist')).toBeTruthy();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    render(<SelectField label="Therapist" value="Dr Smith" onPress={onPress} />);
    fireEvent.press(screen.getByText('Dr Smith'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows clear button when selected and onClear provided', () => {
    const onClear = jest.fn();
    render(<SelectField label="Therapist" value="Dr Smith" selected onClear={onClear} />);
    const clearButton = screen.getByLabelText('Clear Therapist');
    expect(clearButton).toBeTruthy();
    fireEvent.press(clearButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not show clear button when not selected', () => {
    render(<SelectField label="Therapist" value="Dr Smith" onClear={jest.fn()} />);
    expect(screen.queryByLabelText('Clear Therapist')).toBeNull();
  });

  it('has correct accessibility state for disabled', () => {
    render(<SelectField label="Therapist" disabled />);
    const item = screen.getByRole('button');
    expect(item.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('has correct accessibility state for selected', () => {
    render(<SelectField label="Therapist" selected />);
    const item = screen.getByRole('button');
    expect(item.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
  });
});
