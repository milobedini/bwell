import type { ReactNode } from 'react';
import ChangePasswordDialog from '@/components/profile/ChangePasswordDialog';
import { fireEvent, render, screen } from '@testing-library/react-native';

// ── Mocks ──

jest.mock('react-native-paper', () => {
  const { View, Text, TextInput: RNTextInput, Pressable } = require('react-native');
  const Portal = ({ children }: { children: ReactNode }) => <>{children}</>;
  const Dialog = Object.assign(
    (props: { visible: boolean; children: ReactNode }) =>
      props.visible ? <View testID="dialog">{props.children}</View> : null,
    {
      Title: ({ children }: { children: ReactNode }) => <View>{children}</View>,
      Content: ({ children }: { children: ReactNode }) => <View>{children}</View>,
      Actions: ({ children }: { children: ReactNode }) => <View>{children}</View>
    }
  );
  const Button = (props: { children: string; onPress?: () => void; disabled?: boolean }) => (
    <Pressable testID={`btn-${props.children}`} onPress={props.onPress}>
      <Text>{props.children}</Text>
    </Pressable>
  );
  const TextInput = Object.assign(
    (props: { label: string; value: string; onChangeText?: (t: string) => void }) => (
      <RNTextInput testID={props.label} value={props.value} onChangeText={props.onChangeText} />
    ),
    { Icon: () => null }
  );
  return { Portal, Dialog, Button, TextInput };
});

jest.mock('@/hooks/useAuth', () => ({
  useChangePassword: jest.fn()
}));

jest.mock('@/components/ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children }: { children: ReactNode }) => <Text>{children}</Text>
  };
});

const { useChangePassword } = require('@/hooks/useAuth');

// ── Helpers ──

const mockMutate = jest.fn();

const setup = (visible = true) => {
  useChangePassword.mockReturnValue({ mutate: mockMutate, isPending: false });
  const onDismiss = jest.fn();
  render(<ChangePasswordDialog visible={visible} onDismiss={onDismiss} />);
  return { onDismiss };
};

// ── Tests ──

describe('ChangePasswordDialog', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders "Change Password" title when visible', () => {
    setup();
    expect(screen.getByText('Change Password')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    setup(false);
    expect(screen.queryByTestId('dialog')).toBeNull();
  });

  it('shows error when saving with empty current password', () => {
    setup();
    fireEvent.changeText(screen.getByTestId('New password'), 'LongEnough1');
    fireEvent.changeText(screen.getByTestId('Confirm new password'), 'LongEnough1');
    fireEvent.press(screen.getByTestId('btn-Save'));
    expect(screen.getByText('Current password is required')).toBeTruthy();
  });

  it('shows error when new password is too short', () => {
    setup();
    fireEvent.changeText(screen.getByTestId('Current password'), 'oldpass');
    fireEvent.changeText(screen.getByTestId('New password'), 'short');
    fireEvent.changeText(screen.getByTestId('Confirm new password'), 'short');
    fireEvent.press(screen.getByTestId('btn-Save'));
    expect(screen.getByText('New password must be at least 8 characters')).toBeTruthy();
  });

  it('shows error when passwords do not match', () => {
    setup();
    fireEvent.changeText(screen.getByTestId('Current password'), 'oldpass');
    fireEvent.changeText(screen.getByTestId('New password'), 'LongEnough1');
    fireEvent.changeText(screen.getByTestId('Confirm new password'), 'Different1');
    fireEvent.press(screen.getByTestId('btn-Save'));
    expect(screen.getByText('Passwords do not match')).toBeTruthy();
  });

  it('calls mutate on valid submission', () => {
    setup();
    fireEvent.changeText(screen.getByTestId('Current password'), 'oldpass');
    fireEvent.changeText(screen.getByTestId('New password'), 'NewPass123');
    fireEvent.changeText(screen.getByTestId('Confirm new password'), 'NewPass123');
    fireEvent.press(screen.getByTestId('btn-Save'));
    expect(mockMutate).toHaveBeenCalledWith(
      { currentPassword: 'oldpass', newPassword: 'NewPass123' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});
