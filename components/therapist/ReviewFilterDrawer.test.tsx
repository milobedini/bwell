import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { ReviewFilterValues } from './ReviewFilterDrawer';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 0, left: 0, right: 0 })
}));

jest.mock('@/utils/chipStyles', () => ({
  filterChipStyle: () => ({}),
  filterChipTextStyle: () => ({})
}));

jest.mock('react-native-paper', () => {
  const { View, Text, Pressable } = require('react-native');
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
    )
  };
});

jest.mock('../ui/SearchPickerDialog', () => {
  return {
    __esModule: true,
    default: () => null
  };
});

jest.mock('../ui/SelectField', () => {
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: (props: { label: string; value?: string; placeholder?: string }) => (
      <View testID={`select-${props.label}`}>
        <Text>{props.value || props.placeholder}</Text>
      </View>
    )
  };
});

const ReviewFilterDrawer = require('./ReviewFilterDrawer').default;

const defaultProps = {
  visible: true,
  onDismiss: jest.fn(),
  values: {} as ReviewFilterValues,
  onApply: jest.fn(),
  onReset: jest.fn()
};

describe('ReviewFilterDrawer', () => {
  it('renders "Filters" title', () => {
    render(<ReviewFilterDrawer {...defaultProps} />);
    expect(screen.getByText('Filters')).toBeTruthy();
  });

  it('shows severity chips', () => {
    render(<ReviewFilterDrawer {...defaultProps} />);
    expect(screen.getByText(/Any/)).toBeTruthy();
    expect(screen.getByText(/Severe/)).toBeTruthy();
    expect(screen.getByText(/Moderate/)).toBeTruthy();
    expect(screen.getByText(/Mild/)).toBeTruthy();
  });

  it('shows patient section when patientChoices provided', () => {
    render(
      <ReviewFilterDrawer
        {...defaultProps}
        patientChoices={[{ id: 'p1', name: 'Jane Doe', email: 'jane@example.com' }]}
      />
    );
    expect(screen.getByText('Patient')).toBeTruthy();
    expect(screen.getByTestId('select-Patient')).toBeTruthy();
  });

  it('does not show patient section when no patientChoices', () => {
    render(<ReviewFilterDrawer {...defaultProps} />);
    expect(screen.queryByTestId('select-Patient')).toBeNull();
  });

  it('shows module chips when moduleChoices provided', () => {
    render(
      <ReviewFilterDrawer
        {...defaultProps}
        moduleChoices={[
          { id: 'm1', title: 'PHQ-9' },
          { id: 'm2', title: 'GAD-7' }
        ]}
      />
    );
    expect(screen.getByText('Module')).toBeTruthy();
    expect(screen.getByText(/PHQ-9/)).toBeTruthy();
    expect(screen.getByText(/GAD-7/)).toBeTruthy();
  });

  it('does not show module section when no moduleChoices', () => {
    render(<ReviewFilterDrawer {...defaultProps} />);
    expect(screen.queryByText('Module')).toBeNull();
  });

  it('calls onApply and onDismiss when Apply pressed', () => {
    const onApply = jest.fn();
    const onDismiss = jest.fn();
    render(<ReviewFilterDrawer {...defaultProps} onApply={onApply} onDismiss={onDismiss} />);
    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onReset and clears local state when Reset pressed', () => {
    const onReset = jest.fn();
    const onApply = jest.fn();
    render(
      <ReviewFilterDrawer {...defaultProps} values={{ severity: 'severe' }} onReset={onReset} onApply={onApply} />
    );
    fireEvent.press(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalledTimes(1);

    // Apply after reset to confirm values were cleared
    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith({});
  });

  it('toggles severity chip on press', () => {
    const onApply = jest.fn();
    render(<ReviewFilterDrawer {...defaultProps} onApply={onApply} />);
    fireEvent.press(screen.getByTestId('chip-Severe'));
    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ severity: 'severe' }));
  });
});
