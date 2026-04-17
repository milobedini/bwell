import { fireEvent, render, screen } from '@testing-library/react-native';

const SettingsRow = require('./SettingsRow').default;

describe('SettingsRow', () => {
  it('renders icon and label', () => {
    render(<SettingsRow icon="account-edit-outline" label="Edit Name" />);

    expect(screen.getByText('Edit Name')).toBeTruthy();
    expect(screen.getByText('account-edit-outline')).toBeTruthy();
  });

  it('renders trailing text', () => {
    render(<SettingsRow icon="email-outline" label="Email" trailing="test@example.com" />);

    expect(screen.getByText('test@example.com')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<SettingsRow icon="lock-outline" label="Change Password" onPress={onPress} testID="pw-row" />);

    fireEvent.press(screen.getByTestId('pw-row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders chevron when onPress is provided', () => {
    const onPress = jest.fn();
    render(<SettingsRow icon="lock-outline" label="Change Password" onPress={onPress} />);

    expect(screen.getByText('chevron-right')).toBeTruthy();
  });

  it('hides chevron when showChevron is false', () => {
    const onPress = jest.fn();
    render(<SettingsRow icon="lock-outline" label="Test" onPress={onPress} showChevron={false} />);

    expect(screen.queryByText('chevron-right')).toBeNull();
  });

  it('renders with destructive styling', () => {
    render(<SettingsRow icon="logout" label="Log Out" destructive onPress={jest.fn()} />);

    expect(screen.getByText('Log Out')).toBeTruthy();
  });
});
