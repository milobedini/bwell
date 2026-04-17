import type { ReactNode } from 'react';
import { type AttemptFilterDrawerValues, DEFAULT_FILTERS } from '@/constants/Filters';
import { fireEvent, render, screen } from '@testing-library/react-native';

import type { AttemptFilterDrawerProps } from './AttemptFilterDrawer';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

jest.mock('expo-constants', () => ({ statusBarHeight: 44 }));
jest.mock('@/components/ui/SearchPickerDialog', () => () => null);
jest.mock('@/components/ui/SelectField', () => {
  const { View, Text } = require('react-native');
  return (props: { label?: string; value?: string; placeholder?: string }) => (
    <View testID={`select-${props.label}`}>
      <Text>{props.value || props.placeholder}</Text>
    </View>
  );
});

// Lightweight react-native-paper mocks so we don't need PaperProvider
jest.mock('react-native-paper', () => {
  const { View, Text, TextInput: RNTextInput, Pressable } = require('react-native');
  return {
    Portal: ({ children }: { children: ReactNode }) => <>{children}</>,
    Surface: ({ children, ...rest }: { children: ReactNode; style?: object }) => <View {...rest}>{children}</View>,
    Chip: ({ children, onPress, selected }: { children: ReactNode; onPress?: () => void; selected?: boolean }) => (
      <Pressable onPress={onPress} testID={`chip-${children}`} accessibilityState={{ selected }}>
        <Text>{children}</Text>
      </Pressable>
    ),
    Divider: () => <View />,
    IconButton: ({ onPress, icon }: { onPress?: () => void; icon?: string }) => (
      <Pressable onPress={onPress} testID={`icon-button-${icon}`} />
    ),
    Button: ({ children, onPress }: { children: ReactNode; onPress?: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
    TextInput: ({
      value,
      onChangeText,
      placeholder,
      ...rest
    }: {
      value?: string;
      onChangeText?: (t: string) => void;
      placeholder?: string;
      label?: ReactNode;
      mode?: string;
      keyboardType?: string;
    }) => (
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        testID="paper-text-input"
        {...rest}
      />
    )
  };
});

const { AttemptFilterDrawer } = require('./AttemptFilterDrawer');

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const defaultValues: AttemptFilterDrawerValues = {
  status: ['submitted'],
  limit: 20,
  moduleId: undefined,
  patientId: undefined,
  severity: undefined
};

const makeProps = (overrides: Partial<AttemptFilterDrawerProps> = {}): AttemptFilterDrawerProps => ({
  visible: true,
  onDismiss: jest.fn(),
  values: defaultValues,
  onChange: jest.fn(),
  onApply: jest.fn(),
  onReset: jest.fn(),
  ...overrides
});

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('AttemptFilterDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the title', () => {
    render(<AttemptFilterDrawer {...makeProps({ title: 'My Filters' })} />);
    expect(screen.getByText('My Filters')).toBeTruthy();
  });

  it('renders default title when none provided', () => {
    render(<AttemptFilterDrawer {...makeProps()} />);
    expect(screen.getByText('Filters')).toBeTruthy();
  });

  it('renders all status chips', () => {
    render(<AttemptFilterDrawer {...makeProps()} />);

    expect(screen.getByText('submitted')).toBeTruthy();
    expect(screen.getByText('active')).toBeTruthy();
    expect(screen.getByText('started')).toBeTruthy();
    expect(screen.getByText('abandoned')).toBeTruthy();
    expect(screen.getByText('all')).toBeTruthy();
  });

  it('calls onChange, onApply, and onDismiss when Apply is pressed', () => {
    const props = makeProps();
    render(<AttemptFilterDrawer {...props} />);

    fireEvent.press(screen.getByText('Apply'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onApply).toHaveBeenCalledTimes(1);
    expect(props.onDismiss).toHaveBeenCalledTimes(1);

    // The applied values should include the current filter state
    const appliedValues = (props.onChange as jest.Mock).mock.calls[0][0] as AttemptFilterDrawerValues;
    expect(appliedValues.status).toEqual(['submitted']);
    expect(appliedValues.limit).toBe(20);
  });

  it('resets to DEFAULT_FILTERS and calls onChange + onReset when Reset is pressed', () => {
    const props = makeProps({
      values: { status: ['active', 'abandoned'], limit: 50, moduleId: 'mod-1' }
    });
    render(<AttemptFilterDrawer {...props} />);

    fireEvent.press(screen.getByText('Reset'));

    expect(props.onChange).toHaveBeenCalledWith(DEFAULT_FILTERS);
    expect(props.onReset).toHaveBeenCalledTimes(1);
  });

  it('shows severity section when showSeverity is true', () => {
    render(<AttemptFilterDrawer {...makeProps({ showSeverity: true })} />);

    expect(screen.getByText('Severity')).toBeTruthy();
    expect(screen.getByText('Severe')).toBeTruthy();
    expect(screen.getByText('Moderate')).toBeTruthy();
    expect(screen.getByText('Mild')).toBeTruthy();
  });

  it('hides severity section when showSeverity is false', () => {
    render(<AttemptFilterDrawer {...makeProps({ showSeverity: false })} />);
    expect(screen.queryByText('Severity')).toBeNull();
  });

  it('shows module chips when moduleChoices are provided', () => {
    const moduleChoices = [
      { id: 'mod-1', title: 'PHQ-9' },
      { id: 'mod-2', title: 'GAD-7' }
    ];
    render(<AttemptFilterDrawer {...makeProps({ moduleChoices })} />);

    expect(screen.getByText('Module')).toBeTruthy();
    expect(screen.getByText('Any')).toBeTruthy();
    expect(screen.getByText('PHQ-9')).toBeTruthy();
    expect(screen.getByText('GAD-7')).toBeTruthy();
  });

  it('renders limit input when showLimit is true (default)', () => {
    render(<AttemptFilterDrawer {...makeProps()} />);

    expect(screen.getByText('Limit')).toBeTruthy();
    expect(screen.getByText('Default 20 · Max 100')).toBeTruthy();
  });

  it('hides limit section when showLimit is false', () => {
    render(<AttemptFilterDrawer {...makeProps({ showLimit: false })} />);
    expect(screen.queryByText('Limit')).toBeNull();
  });
});
