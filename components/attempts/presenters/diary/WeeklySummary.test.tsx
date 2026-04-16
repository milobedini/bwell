import type { DiaryTotals } from '@milobedini/shared-types';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => <Text>{name}</Text> };
});

const WeeklySummary = require('./WeeklySummary').default;

const makeTotals = (overrides: Partial<DiaryTotals> = {}): DiaryTotals => ({
  count: 5,
  avgMood: 6.5,
  avgAchievement: 7.2,
  avgCloseness: 5.0,
  avgEnjoyment: 8.1,
  ...overrides
});

describe('WeeklySummary', () => {
  it('returns null when no metrics have values', () => {
    const totals = makeTotals({
      avgMood: undefined as never,
      avgAchievement: undefined as never,
      avgCloseness: undefined as never,
      avgEnjoyment: undefined as never
    });
    const { toJSON } = render(<WeeklySummary totals={totals} />);

    expect(toJSON()).toBeNull();
  });

  it('renders collapsed by default', () => {
    render(<WeeklySummary totals={makeTotals()} />);

    expect(screen.getByText('Weekly Summary')).toBeTruthy();
    // Metric values should not be visible when collapsed
    expect(screen.queryByText('6.5')).toBeNull();
  });

  it('renders expanded when defaultOpen is true', () => {
    render(<WeeklySummary totals={makeTotals()} defaultOpen />);

    expect(screen.getByText('6.5')).toBeTruthy();
    expect(screen.getByText('7.2')).toBeTruthy();
    expect(screen.getByText('5.0')).toBeTruthy();
    expect(screen.getByText('8.1')).toBeTruthy();
  });

  it('shows metric labels when expanded', () => {
    render(<WeeklySummary totals={makeTotals()} defaultOpen />);

    expect(screen.getByText('Mood')).toBeTruthy();
    expect(screen.getByText('Achieve')).toBeTruthy();
    expect(screen.getByText('Close')).toBeTruthy();
    expect(screen.getByText('Enjoy')).toBeTruthy();
  });

  it('toggles open/closed on press', () => {
    render(<WeeklySummary totals={makeTotals()} />);

    // Initially collapsed
    expect(screen.queryByText('6.5')).toBeNull();

    // Expand
    fireEvent.press(screen.getByText('Weekly Summary'));
    expect(screen.getByText('6.5')).toBeTruthy();

    // Collapse
    fireEvent.press(screen.getByText('Weekly Summary'));
    expect(screen.queryByText('6.5')).toBeNull();
  });

  it('only shows metrics that have values', () => {
    const totals = makeTotals({ avgCloseness: undefined as never, avgEnjoyment: undefined as never });
    render(<WeeklySummary totals={totals} defaultOpen />);

    expect(screen.getByText('Mood')).toBeTruthy();
    expect(screen.getByText('Achieve')).toBeTruthy();
    expect(screen.queryByText('Close')).toBeNull();
    expect(screen.queryByText('Enjoy')).toBeNull();
  });

  it('has correct accessibility attributes', () => {
    render(<WeeklySummary totals={makeTotals()} />);

    const button = screen.getByLabelText(/Weekly Summary/);
    expect(button).toBeTruthy();
  });
});
