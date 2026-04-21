import type { CareTier, OutcomeResult } from '@milobedini/shared-types';
import { render } from '@testing-library/react-native';

import CareTierBreakdown from './CareTierBreakdown';

const populated = (rate: number, n: number): OutcomeResult => ({
  rate,
  n,
  suppressed: false,
  reason: null
});

const suppressed = (reason: 'below_k' | 'below_min_n', n: number): OutcomeResult => ({
  rate: null,
  n,
  suppressed: true,
  reason
});

const row = (
  careTier: CareTier,
  recovery: OutcomeResult,
  reliableImprovement: OutcomeResult,
  reliableRecovery: OutcomeResult
) => ({ careTier, recovery, reliableImprovement, reliableRecovery });

describe('CareTierBreakdown', () => {
  it('renders one row per care tier with all three rate columns', () => {
    const { getByText, getAllByText } = render(
      <CareTierBreakdown
        rows={[
          row('self_help', populated(0.31, 18), populated(0.44, 22), populated(0.24, 18)),
          row('cbt_guided', populated(0.54, 21), populated(0.71, 26), populated(0.46, 21)),
          row('pwp_guided', populated(0.4, 12), populated(0.33, 15), populated(0.27, 12))
        ]}
      />
    );

    expect(getByText('Self-help')).toBeTruthy();
    expect(getByText('CBT')).toBeTruthy();
    expect(getByText('PWP')).toBeTruthy();

    expect(getByText('31%')).toBeTruthy();
    expect(getByText('44%')).toBeTruthy();
    expect(getByText('54%')).toBeTruthy();
    expect(getByText('71%')).toBeTruthy();

    expect(getAllByText(/n=/).length).toBe(9);
  });

  it('shows "< N patients" label for below_k suppressed cells', () => {
    const { getAllByText } = render(
      <CareTierBreakdown
        rows={[row('pwp_guided', suppressed('below_k', 3), suppressed('below_k', 3), suppressed('below_k', 3))]}
      />
    );

    expect(getAllByText(/< \d+ patients/).length).toBe(3);
  });

  it('shows "insufficient" label for below_min_n suppressed cells', () => {
    const { getAllByText } = render(
      <CareTierBreakdown
        rows={[
          row('cbt_guided', suppressed('below_min_n', 12), suppressed('below_min_n', 12), suppressed('below_min_n', 12))
        ]}
      />
    );

    expect(getAllByText('insufficient').length).toBe(3);
  });

  it('renders the table header row', () => {
    const { getByText } = render(
      <CareTierBreakdown rows={[row('self_help', populated(0.5, 40), populated(0.6, 40), populated(0.4, 40))]} />
    );
    expect(getByText('Tier')).toBeTruthy();
    expect(getByText('Rec.')).toBeTruthy();
    expect(getByText('Rel. imp.')).toBeTruthy();
    expect(getByText('Rel. rec.')).toBeTruthy();
  });
});
