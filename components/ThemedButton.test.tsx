import { Colors } from '@/constants/Colors';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ThemedButton, { PrimaryButton, SecondaryButton } from './ThemedButton';

jest.mock('expo-image', () => ({
  Image: 'Image'
}));

describe('ThemedButton', () => {
  it('renders title text', () => {
    render(<ThemedButton title="Save" />);
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('renders children when no title is provided', () => {
    render(<ThemedButton>Click me</ThemedButton>);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('fires onPress handler', () => {
    const onPress = jest.fn();
    render(<ThemedButton title="Go" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress when disabled', () => {
    const onPress = jest.fn();
    render(<ThemedButton title="Go" onPress={onPress} disabled />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('sets accessibility state for disabled', () => {
    render(<ThemedButton title="Go" disabled />);
    const button = screen.getByRole('button');
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it('applies outline variant text color', () => {
    render(<ThemedButton title="Outline" variant="outline" />);
    const text = screen.getByText('Outline');
    expect(text.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ color: Colors.sway.bright })]));
  });

  it('does not apply outline color for default variant', () => {
    render(<ThemedButton title="Default" />);
    const text = screen.getByText('Default');
    // style prop should not contain the teal override
    const flatStyles = [text.props.style].flat(Infinity).filter(Boolean);
    const hasColorOverride = flatStyles.some(
      (s: Record<string, unknown>) => typeof s === 'object' && s.color === Colors.sway.bright
    );
    expect(hasColorOverride).toBe(false);
  });
});

describe('PrimaryButton', () => {
  it('renders title and fires onPress', () => {
    const onPress = jest.fn();
    render(<PrimaryButton title="Start" onPress={onPress} />);
    expect(screen.getByText('Start')).toBeTruthy();
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('SecondaryButton', () => {
  it('renders title text', () => {
    render(<SecondaryButton title="Settings" />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('renders children when no title is provided', () => {
    render(<SecondaryButton>Profile</SecondaryButton>);
    expect(screen.getByText('Profile')).toBeTruthy();
  });
});
