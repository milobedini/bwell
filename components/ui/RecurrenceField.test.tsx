import type { ReactNode } from 'react';
import { PaperProvider } from 'react-native-paper';
import RecurrenceField, { AssignmentRecurrence, formatRecurrence } from '@/components/ui/RecurrenceField';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-constants', () => ({ statusBarHeight: 44 }));
jest.mock('@/components/ui/SelectField', () => {
  const { Pressable, Text } = require('react-native');
  return (props: { value?: string; placeholder?: string; onPress?: () => void }) => (
    <Pressable testID="select-field" onPress={props.onPress}>
      <Text>{props.value || props.placeholder}</Text>
    </Pressable>
  );
});

const wrapper = ({ children }: { children: ReactNode }) => <PaperProvider>{children}</PaperProvider>;

describe('formatRecurrence', () => {
  it('returns "No recurrence" for undefined', () => {
    expect(formatRecurrence(undefined)).toBe('No recurrence');
  });

  it('returns "No recurrence" for freq "none"', () => {
    expect(formatRecurrence({ freq: 'none' })).toBe('No recurrence');
  });

  it('returns "Every week" for weekly interval 1', () => {
    expect(formatRecurrence({ freq: 'weekly', interval: 1 })).toBe('Every week');
  });

  it('returns "Every 3 weeks" for weekly interval 3', () => {
    expect(formatRecurrence({ freq: 'weekly', interval: 3 })).toBe('Every 3 weeks');
  });

  it('returns "Every month" for monthly interval 1', () => {
    expect(formatRecurrence({ freq: 'monthly', interval: 1 })).toBe('Every month');
  });

  it('returns "Every 2 months" for monthly interval 2', () => {
    expect(formatRecurrence({ freq: 'monthly', interval: 2 })).toBe('Every 2 months');
  });

  it('defaults interval to 1 when omitted for weekly', () => {
    expect(formatRecurrence({ freq: 'weekly' })).toBe('Every week');
  });

  it('defaults interval to 1 when omitted for monthly', () => {
    expect(formatRecurrence({ freq: 'monthly' })).toBe('Every month');
  });
});

describe('RecurrenceField', () => {
  const onChange = jest.fn();

  beforeEach(() => {
    onChange.mockClear();
  });

  it('renders with default placeholder when no value provided', () => {
    render(<RecurrenceField onChange={onChange} />, { wrapper });

    expect(screen.getByText('Pick recurrence (optional)')).toBeTruthy();
  });

  it('shows formatted recurrence when a value is provided', () => {
    const value: AssignmentRecurrence = { freq: 'weekly', interval: 2 };
    render(<RecurrenceField value={value} onChange={onChange} />, { wrapper });

    expect(screen.getByText('Every 2 weeks')).toBeTruthy();
  });

  it('shows placeholder when value is freq "none"', () => {
    const value: AssignmentRecurrence = { freq: 'none' };
    render(<RecurrenceField value={value} onChange={onChange} />, { wrapper });

    expect(screen.getByText('Pick recurrence (optional)')).toBeTruthy();
  });
});
