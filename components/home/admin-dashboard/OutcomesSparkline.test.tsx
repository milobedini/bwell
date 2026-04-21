import type { AdminOutcomesResponse, OutcomeResult } from '@milobedini/shared-types';
import { render } from '@testing-library/react-native';

import OutcomesSparkline from './OutcomesSparkline';

const outcome = (overrides: Partial<OutcomeResult> = {}): OutcomeResult => ({
  rate: 0.5,
  n: 30,
  suppressed: false,
  reason: null,
  ...overrides
});

const suppressed = (): OutcomeResult => ({ rate: null, n: 0, suppressed: true, reason: 'below_k' });

const bucket = (startsAt: string, recovery: OutcomeResult): AdminOutcomesResponse['series'][number] => ({
  bucket: { startsAt, endsAt: startsAt },
  recovery,
  reliableImprovement: suppressed(),
  reliableRecovery: suppressed()
});

describe('OutcomesSparkline', () => {
  it('renders a delta chip with the pp change between first and last resolved bucket', () => {
    const series = [
      bucket('2025-05-01T00:00:00.000Z', outcome({ rate: 0.3 })),
      bucket('2025-11-01T00:00:00.000Z', outcome({ rate: 0.5 })),
      bucket('2026-04-01T00:00:00.000Z', outcome({ rate: 0.56 }))
    ];
    const { getByText } = render(<OutcomesSparkline series={series} instrumentLabel="PHQ-9" />);
    expect(getByText('PHQ-9 recovery · 3 months')).toBeTruthy();
    expect(getByText('26pp vs start')).toBeTruthy();
    expect(getByText('trending-up')).toBeTruthy();
  });

  it('shows a down delta when rates decline', () => {
    const series = [
      bucket('2025-11-01T00:00:00.000Z', outcome({ rate: 0.6 })),
      bucket('2026-04-01T00:00:00.000Z', outcome({ rate: 0.4 }))
    ];
    const { getByText } = render(<OutcomesSparkline series={series} instrumentLabel="PHQ-9" />);
    expect(getByText('20pp vs start')).toBeTruthy();
    expect(getByText('trending-down')).toBeTruthy();
  });

  it('says "Not enough data" when fewer than two resolved buckets exist', () => {
    const series = [
      bucket('2025-05-01T00:00:00.000Z', suppressed()),
      bucket('2025-11-01T00:00:00.000Z', suppressed()),
      bucket('2026-04-01T00:00:00.000Z', outcome({ rate: 0.5 }))
    ];
    const { getByText } = render(<OutcomesSparkline series={series} instrumentLabel="PHQ-9" />);
    expect(getByText('Not enough data')).toBeTruthy();
  });

  it('renders first, middle, and last month/year axis labels', () => {
    const series = [
      bucket('2025-05-01T00:00:00.000Z', outcome({ rate: 0.3 })),
      bucket('2025-11-01T00:00:00.000Z', outcome({ rate: 0.5 })),
      bucket('2026-04-01T00:00:00.000Z', outcome({ rate: 0.56 }))
    ];
    const { getByText } = render(<OutcomesSparkline series={series} instrumentLabel="PHQ-9" />);
    expect(getByText(`May '25`)).toBeTruthy();
    expect(getByText(`Nov '25`)).toBeTruthy();
    expect(getByText(`Apr '26`)).toBeTruthy();
  });

  it('returns null for an empty series', () => {
    const { toJSON } = render(<OutcomesSparkline series={[]} instrumentLabel="PHQ-9" />);
    expect(toJSON()).toBeNull();
  });

  it('caps to the most recent 12 buckets when the BE returns 13', () => {
    const months = [
      '2025-03-01',
      '2025-04-01',
      '2025-05-01',
      '2025-06-01',
      '2025-07-01',
      '2025-08-01',
      '2025-09-01',
      '2025-10-01',
      '2025-11-01',
      '2025-12-01',
      '2026-01-01',
      '2026-02-01',
      '2026-03-01',
      '2026-04-01'
    ];
    const series = months.map((m) => bucket(`${m}T00:00:00.000Z`, outcome({ rate: 0.4 })));
    const { getByText, queryByText } = render(<OutcomesSparkline series={series} instrumentLabel="PHQ-9" />);
    expect(getByText('PHQ-9 recovery · 12 months')).toBeTruthy();
    // Oldest two buckets should be dropped from the axis labels.
    expect(queryByText(`Mar '25`)).toBeNull();
    expect(queryByText(`Apr '25`)).toBeNull();
    expect(getByText(`May '25`)).toBeTruthy();
    expect(getByText(`Apr '26`)).toBeTruthy();
  });
});
