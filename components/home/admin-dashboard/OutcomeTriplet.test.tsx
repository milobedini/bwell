import type { OutcomeResult } from '@milobedini/shared-types';
import { render } from '@testing-library/react-native';

import OutcomeTriplet from './OutcomeTriplet';

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

describe('OutcomeTriplet', () => {
  it('renders three rates with rounded percentages', () => {
    const { getByText } = render(
      <OutcomeTriplet
        recovery={populated(0.384, 45)}
        reliableImprovement={populated(0.52, 58)}
        reliableRecovery={populated(0.31, 45)}
        cutoffLabel="PHQ-9 ≥ 10"
        reliableChangeDeltaLabel="Δ ≥ 6 PHQ-9 points"
      />
    );
    expect(getByText('38%')).toBeTruthy();
    expect(getByText('52%')).toBeTruthy();
    expect(getByText('31%')).toBeTruthy();
  });

  it('renders "< 5 patients" for below_k suppression on every row', () => {
    const { getAllByText } = render(
      <OutcomeTriplet
        recovery={suppressed('below_k', 3)}
        reliableImprovement={suppressed('below_k', 3)}
        reliableRecovery={suppressed('below_k', 3)}
        cutoffLabel="PHQ-9 ≥ 10"
        reliableChangeDeltaLabel="Δ ≥ 6"
      />
    );
    expect(getAllByText(/< \d+ patients/).length).toBe(3);
  });

  it('renders "insufficient data" for below_min_n suppression on every row', () => {
    const { getAllByText } = render(
      <OutcomeTriplet
        recovery={suppressed('below_min_n', 12)}
        reliableImprovement={suppressed('below_min_n', 12)}
        reliableRecovery={suppressed('below_min_n', 12)}
        cutoffLabel="PHQ-9 ≥ 10"
        reliableChangeDeltaLabel="Δ ≥ 6"
      />
    );
    expect(getAllByText('insufficient data').length).toBe(3);
  });

  it('renders "No Δ defined" copy when reliableChangeDeltaLabel is omitted (e.g. PDSS)', () => {
    const { getByText } = render(
      <OutcomeTriplet
        recovery={populated(0.4, 22)}
        reliableImprovement={populated(0.3, 22)}
        reliableRecovery={populated(0.2, 22)}
        cutoffLabel="PDSS ≥ 8"
      />
    );
    expect(getByText('No Δ defined for this instrument')).toBeTruthy();
  });
});
