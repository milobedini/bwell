import type { ScoreTrendItem } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

import ProgressSection from './ProgressSection';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() }))
}));

jest.mock('./Sparkline', () => {
  const { View } = require('react-native');
  return () => <View testID="sparkline" />;
});

const makeTrend = (overrides: Partial<ScoreTrendItem> = {}): ScoreTrendItem => ({
  moduleTitle: 'PHQ-9',
  moduleId: 'm1',
  latestScore: 12,
  previousScore: 15,
  sparkline: [18, 15, 12],
  ...overrides
});

describe('ProgressSection', () => {
  it('returns null when trends is empty', () => {
    const { toJSON } = render(<ProgressSection trends={[]} />);

    expect(toJSON()).toBeNull();
  });

  it('renders "Your Progress" header', () => {
    render(<ProgressSection trends={[makeTrend()]} />);

    expect(screen.getByText('Your Progress')).toBeTruthy();
  });

  it('renders a ScoreCard for each trend', () => {
    const trends = [
      makeTrend({ moduleId: 'm1', moduleTitle: 'PHQ-9' }),
      makeTrend({ moduleId: 'm2', moduleTitle: 'GAD-7' })
    ];
    render(<ProgressSection trends={trends} />);

    expect(screen.getByText('PHQ-9')).toBeTruthy();
    expect(screen.getByText('GAD-7')).toBeTruthy();
  });

  it('shows "done" when no previous score', () => {
    render(<ProgressSection trends={[makeTrend({ previousScore: null })]} />);

    expect(screen.getByText(/done/)).toBeTruthy();
  });

  it('shows delta arrow when previous score exists', () => {
    render(<ProgressSection trends={[makeTrend({ latestScore: 12, previousScore: 15 })]} />);

    // Score decreased (12 - 15 = -3), so down arrow
    expect(screen.getByText(/▼ 3/)).toBeTruthy();
  });

  it('shows up arrow when score increased', () => {
    render(<ProgressSection trends={[makeTrend({ latestScore: 18, previousScore: 15 })]} />);

    expect(screen.getByText(/▲ 3/)).toBeTruthy();
  });
});
