import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import SearchPickerDialog from './SearchPickerDialog';

jest.mock('@/components/LoadingScreen', () => {
  const { View } = require('react-native');
  return { LoadingIndicator: () => <View testID="loading" /> };
});
jest.mock('@/components/ui/EmptyState', () => {
  const { View, Text } = require('react-native');
  return (props: { title: string }) => (
    <View testID="empty-state">
      <Text>{props.title}</Text>
    </View>
  );
});
jest.mock('@/utils/usePickerConstants', () => () => ({ dialogHeight: 500, verticalMargin: 50 }));
jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialCommunityIcons');
jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcons');
jest.mock('lottie-react-native', () => 'LottieView');

jest.mock('react-native-paper', () => {
  const { View, TextInput, Text, Pressable } = require('react-native');
  const MockPortal = ({ children }: { children: ReactNode }) => <>{children}</>;
  const MockDialog = ({ children, visible }: { children: ReactNode; visible: boolean }) =>
    visible ? <View>{children}</View> : null;
  MockDialog.Title = ({ children }: { children: ReactNode }) => <View>{children}</View>;
  MockDialog.Content = ({ children }: { children: ReactNode }) => <View>{children}</View>;
  MockDialog.ScrollArea = ({ children }: { children: ReactNode }) => <View>{children}</View>;
  MockDialog.Actions = ({ children }: { children: ReactNode }) => <View>{children}</View>;
  const MockTextInput = (props: { placeholder?: string; value?: string; onChangeText?: (text: string) => void }) => (
    <TextInput placeholder={props.placeholder} value={props.value} onChangeText={props.onChangeText} />
  );
  const MockDivider = () => <View />;
  const MockListItem = (props: { title: string; description?: string; onPress?: () => void }) => (
    <Pressable onPress={props.onPress}>
      <Text>{props.title}</Text>
      {props.description ? <Text>{props.description}</Text> : null}
    </Pressable>
  );
  const MockListIcon = () => <View />;
  const MockIconButton = (props: { onPress?: () => void; 'aria-label'?: string }) => (
    <Pressable onPress={props.onPress} accessibilityLabel={props['aria-label']}>
      <Text>icon-button</Text>
    </Pressable>
  );
  return {
    Portal: MockPortal,
    Dialog: MockDialog,
    TextInput: MockTextInput,
    Divider: MockDivider,
    List: { Item: MockListItem, Icon: MockListIcon },
    IconButton: MockIconButton
  };
});

type Item = { _id: string; title: string; subtitle?: string };

const items: Item[] = [
  { _id: '1', title: 'Alpha', subtitle: 'First item' },
  { _id: '2', title: 'Beta', subtitle: 'Second item' },
  { _id: '3', title: 'Gamma' }
];

const defaultProps = {
  visible: true,
  onDismiss: jest.fn(),
  onSelect: jest.fn(),
  items
};

describe('SearchPickerDialog', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading when isPending', () => {
    render(<SearchPickerDialog {...defaultProps} isPending />);
    expect(screen.getByTestId('loading')).toBeTruthy();
  });

  it('shows error when isError', () => {
    render(<SearchPickerDialog {...defaultProps} isError />);
    expect(screen.getByText(/Failed to load/)).toBeTruthy();
  });

  it('renders all items', () => {
    render(<SearchPickerDialog {...defaultProps} />);
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.getByText('Gamma')).toBeTruthy();
  });

  it('filters items by search query on title', () => {
    render(<SearchPickerDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search select…');
    fireEvent.changeText(input, 'alp');
    expect(screen.getByText('Alpha')).toBeTruthy();
    expect(screen.queryByText('Beta')).toBeNull();
    expect(screen.queryByText('Gamma')).toBeNull();
  });

  it('filters items by search query on subtitle', () => {
    render(<SearchPickerDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search select…');
    fireEvent.changeText(input, 'second');
    expect(screen.getByText('Beta')).toBeTruthy();
    expect(screen.queryByText('Alpha')).toBeNull();
    expect(screen.queryByText('Gamma')).toBeNull();
  });

  it('shows empty state when no results match', () => {
    render(<SearchPickerDialog {...defaultProps} />);
    const input = screen.getByPlaceholderText('Search select…');
    fireEvent.changeText(input, 'zzz');
    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('No results')).toBeTruthy();
  });

  it('pressing an item calls onSelect with the item and calls onDismiss', () => {
    render(<SearchPickerDialog {...defaultProps} />);
    fireEvent.press(screen.getByText('Beta'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(items[1]);
    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('renders custom title', () => {
    render(<SearchPickerDialog {...defaultProps} title="Pick a module" />);
    expect(screen.getByText('Pick a module')).toBeTruthy();
  });
});
