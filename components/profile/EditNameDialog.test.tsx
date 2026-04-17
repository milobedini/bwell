import type { ReactNode } from 'react';
import EditNameDialog from '@/components/profile/EditNameDialog';
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
  useUpdateName: jest.fn()
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: jest.fn()
}));

jest.mock('@/components/ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children }: { children: ReactNode }) => <Text>{children}</Text>
  };
});

const { useUpdateName } = require('@/hooks/useAuth');
const { useAuthStore } = require('@/stores/authStore');

// ── Helpers ──

const mockMutate = jest.fn();

const setup = (visible = true, userName = 'Alice Smith') => {
  useUpdateName.mockReturnValue({ mutate: mockMutate, isPending: false });
  useAuthStore.mockImplementation((selector: (s: { user: { _id: string; name: string } }) => unknown) =>
    selector({ user: { _id: 'user-1', name: userName } })
  );
  const onDismiss = jest.fn();
  render(<EditNameDialog visible={visible} onDismiss={onDismiss} />);
  return { onDismiss };
};

// ── Tests ──

describe('EditNameDialog', () => {
  it('renders "Edit Name" title when visible', () => {
    setup();
    expect(screen.getByText('Edit Name')).toBeTruthy();
  });

  it('pre-fills with current user name', () => {
    setup(true, 'Bob Jones');
    expect(screen.getByTestId('Name').props.value).toBe('Bob Jones');
  });

  it('shows error when name is too short', () => {
    setup();
    fireEvent.changeText(screen.getByTestId('Name'), 'A');
    fireEvent.press(screen.getByTestId('btn-Save'));
    expect(screen.getByText('Name must be at least 2 characters')).toBeTruthy();
  });

  it('calls mutate with trimmed name on valid save', () => {
    setup(true, 'Alice');
    fireEvent.changeText(screen.getByTestId('Name'), '  Charlie  ');
    fireEvent.press(screen.getByTestId('btn-Save'));
    expect(mockMutate).toHaveBeenCalledWith(
      { newName: 'Charlie', userId: 'user-1' },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});
