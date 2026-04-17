import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('react-native-paper', () => {
  const { View, Text, Pressable } = require('react-native');
  const Button = (props: { children: string; onPress?: () => void }) => (
    <Pressable testID="sort-button" onPress={props.onPress}>
      <Text>{props.children}</Text>
    </Pressable>
  );
  const MenuItem = (props: { title: string; onPress?: () => void }) => (
    <Pressable testID={`menu-${props.title}`} onPress={props.onPress}>
      <Text>{props.title}</Text>
    </Pressable>
  );
  MenuItem.displayName = 'MenuItem';
  const Menu = (props: { visible: boolean; children: ReactNode; anchor: ReactNode }) => (
    <View testID="menu">
      {props.anchor}
      {props.visible && props.children}
    </View>
  );
  Menu.Item = MenuItem;
  return { Menu, Button };
});

const SortButton = require('./SortButton').default;

describe('SortButton', () => {
  it('shows the current sort label', () => {
    render(<SortButton value="name:asc" onChange={jest.fn()} />);
    expect(screen.getByText('Name A-Z')).toBeTruthy();
  });

  it('shows label for each sort option', () => {
    const options = [
      { value: 'name:asc', label: 'Name A-Z' },
      { value: 'name:desc', label: 'Name Z-A' },
      { value: 'createdAt:desc', label: 'Newest First' },
      { value: 'createdAt:asc', label: 'Oldest First' },
      { value: 'lastLogin:desc', label: 'Last Login' }
    ] as const;

    options.forEach(({ value, label }) => {
      const { unmount } = render(<SortButton value={value} onChange={jest.fn()} />);
      expect(screen.getByText(label)).toBeTruthy();
      unmount();
    });
  });

  it('opens menu and calls onChange when an option is pressed', () => {
    const onChange = jest.fn();
    render(<SortButton value="name:asc" onChange={onChange} />);

    // Open menu
    fireEvent.press(screen.getByTestId('sort-button'));

    // Select a different option
    fireEvent.press(screen.getByTestId('menu-Newest First'));

    expect(onChange).toHaveBeenCalledWith('createdAt:desc');
  });

  it('closes menu after selecting an option', () => {
    const onChange = jest.fn();
    render(<SortButton value="name:asc" onChange={onChange} />);

    fireEvent.press(screen.getByTestId('sort-button'));
    expect(screen.getByText('Newest First')).toBeTruthy();

    fireEvent.press(screen.getByTestId('menu-Newest First'));

    // Menu items should no longer be visible (menu closed)
    expect(screen.queryByTestId('menu-Newest First')).toBeNull();
  });
});
