import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { countActiveFilters, DEFAULT_USER_FILTERS, type UserFilters } from './UserFilterDrawer';

jest.mock('expo-constants', () => ({ statusBarHeight: 44 }));

jest.mock('react-native-paper', () => {
  const { View, Text, Pressable, TextInput: RNTextInput } = require('react-native');
  return {
    Portal: ({ children }: { children: ReactNode }) => <View>{children}</View>,
    Surface: ({ children }: { children: ReactNode }) => <View>{children}</View>,
    Chip: ({ children, onPress, selected }: { children: string; onPress?: () => void; selected?: boolean }) => (
      <Pressable onPress={onPress} testID={`chip-${children}`}>
        <Text>
          {selected ? '[x] ' : ''}
          {children}
        </Text>
      </Pressable>
    ),
    Divider: () => <View />,
    IconButton: ({ onPress }: { onPress?: () => void }) => (
      <Pressable onPress={onPress} testID="close-btn">
        <Text>close</Text>
      </Pressable>
    ),
    Button: ({ onPress, children }: { onPress?: () => void; children: string }) => (
      <Pressable onPress={onPress} testID={`btn-${children}`}>
        <Text>{children}</Text>
      </Pressable>
    ),
    TextInput: ({
      label,
      value,
      onChangeText
    }: {
      label: string;
      value: string;
      onChangeText: (t: string) => void;
    }) => (
      <View>
        <Text>{label}</Text>
        <RNTextInput testID={`input-${label}`} value={value} onChangeText={onChangeText} />
      </View>
    )
  };
});

const UserFilterDrawer = require('./UserFilterDrawer').default;

describe('countActiveFilters', () => {
  it('returns 0 for empty filters', () => {
    expect(countActiveFilters({})).toBe(0);
  });

  it('returns 1 when one role is selected', () => {
    expect(countActiveFilters({ roles: ['patient'] })).toBe(1);
  });

  it('counts multiple active filters correctly', () => {
    const filters: UserFilters = {
      roles: ['patient', 'admin'],
      isVerified: true,
      createdFrom: '2026-01-01'
    };
    expect(countActiveFilters(filters)).toBe(3);
  });

  it('counts all possible filters', () => {
    const filters: UserFilters = {
      roles: ['patient'],
      isVerified: true,
      isVerifiedTherapist: false,
      hasTherapist: true,
      createdFrom: '2026-01-01',
      createdTo: '2026-12-31',
      lastLoginFrom: '2026-01-01',
      lastLoginTo: '2026-12-31'
    };
    expect(countActiveFilters(filters)).toBe(8);
  });
});

describe('DEFAULT_USER_FILTERS', () => {
  it('is an empty object', () => {
    expect(DEFAULT_USER_FILTERS).toEqual({});
  });
});

describe('UserFilterDrawer', () => {
  const defaultProps = {
    visible: true,
    onDismiss: jest.fn(),
    values: DEFAULT_USER_FILTERS,
    onApply: jest.fn()
  };

  it('renders "Filters" title', () => {
    render(<UserFilterDrawer {...defaultProps} />);
    expect(screen.getByText('Filters')).toBeTruthy();
  });

  it('shows role chips', () => {
    render(<UserFilterDrawer {...defaultProps} />);
    expect(screen.getByTestId('chip-Patient')).toBeTruthy();
    expect(screen.getByTestId('chip-Therapist')).toBeTruthy();
    expect(screen.getByTestId('chip-Admin')).toBeTruthy();
  });

  it('shows boolean sections', () => {
    render(<UserFilterDrawer {...defaultProps} />);
    expect(screen.getByText('Email Verified')).toBeTruthy();
    expect(screen.getByText('Therapist Verified')).toBeTruthy();
    expect(screen.getByText('Has Therapist')).toBeTruthy();
  });

  it('shows date range inputs', () => {
    render(<UserFilterDrawer {...defaultProps} />);
    expect(screen.getByText('Created Date')).toBeTruthy();
    expect(screen.getByText('Last Login')).toBeTruthy();
  });

  it('calls onApply and onDismiss when Apply pressed', () => {
    const onApply = jest.fn();
    const onDismiss = jest.fn();
    render(<UserFilterDrawer {...defaultProps} onApply={onApply} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('resets local state when Reset All pressed', () => {
    const onApply = jest.fn();
    render(<UserFilterDrawer {...defaultProps} values={{ roles: ['patient'] }} onApply={onApply} />);
    // Press Reset All then Apply to verify the reset values
    fireEvent.press(screen.getByText('Reset All'));
    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith(DEFAULT_USER_FILTERS);
  });

  it('toggles a role chip on press', () => {
    const onApply = jest.fn();
    render(<UserFilterDrawer {...defaultProps} onApply={onApply} />);
    fireEvent.press(screen.getByTestId('chip-Patient'));
    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ roles: ['patient'] }));
  });
});
