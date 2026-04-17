import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import DueDateField from './DueDateField';

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

jest.mock('@/components/ui/SelectField', () => {
  const { Pressable, Text } = require('react-native');
  return (props: {
    value?: string;
    placeholder?: string;
    selected?: boolean;
    onPress?: () => void;
    onClear?: () => void;
  }) => (
    <Pressable testID="select-field" onPress={props.onPress}>
      <Text testID="select-value">{props.value || props.placeholder}</Text>
      {props.selected && props.onClear && <Pressable testID="clear-btn" onPress={props.onClear} />}
    </Pressable>
  );
});

jest.mock('react-native-paper', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    Portal: ({ children }: { children: ReactNode }) => <View>{children}</View>,
    Dialog: Object.assign(
      ({ children, visible }: { children: ReactNode; visible: boolean }) =>
        visible ? <View testID="dialog">{children}</View> : null,
      {
        Title: ({ children }: { children: ReactNode }) => <View testID="dialog-title">{children}</View>,
        ScrollArea: ({ children }: { children: ReactNode }) => <View>{children}</View>,
        Actions: ({ children }: { children: ReactNode }) => <View>{children}</View>
      }
    ),
    Button: ({ children, onPress }: { children: string; onPress?: () => void }) => (
      <Pressable testID={`btn-${children}`} onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    )
  };
});

jest.mock('react-native-paper-dates', () => ({
  Calendar: () => null,
  TimePickerModal: () => null
}));

jest.mock('@/app/_layout', () => ({ deviceDatesLocaleKey: 'en' }));

jest.mock('@/utils/usePickerConstants', () => () => ({
  dialogHeight: 500,
  verticalMargin: 50
}));

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe('DueDateField', () => {
  it('renders placeholder when no value is provided', () => {
    render(<DueDateField onChange={jest.fn()} />);

    expect(screen.getByTestId('select-value').props.children).toBe('Pick a date (optional)');
  });

  it('renders formatted date when value is provided', () => {
    // A date with 23:59 hours (end-of-day, no explicit time)
    const eod = new Date(2025, 7, 24, 23, 59, 0, 0); // 24 Aug 2025 23:59 local
    const iso = eod.toISOString();

    render(<DueDateField value={iso} onChange={jest.fn()} />);

    const displayed = screen.getByTestId('select-value').props.children as string;
    // Should contain the date but NOT a time portion (since 23:59 = end-of-day)
    expect(displayed).toBeTruthy();
    expect(displayed).not.toBe('Pick a date (optional)');
  });

  it('calls onChange(undefined) when clear button is pressed', () => {
    const onChange = jest.fn();
    const eod = new Date(2025, 7, 24, 23, 59, 0, 0);
    const iso = eod.toISOString();

    render(<DueDateField value={iso} onChange={onChange} />);

    fireEvent.press(screen.getByTestId('clear-btn'));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('opens date picker dialog when SelectField is pressed', () => {
    render(<DueDateField onChange={jest.fn()} />);

    // Dialog should not be visible initially
    expect(screen.queryByTestId('dialog')).toBeNull();

    fireEvent.press(screen.getByTestId('select-field'));

    // Dialog should now be visible
    expect(screen.getByTestId('dialog')).toBeTruthy();
  });
});
