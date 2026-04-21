import { mockQueryResult } from '@/test-utils/mockQueryResult';
import type { AdminOverviewResponse, OutcomeResult } from '@milobedini/shared-types';
import { render } from '@testing-library/react-native';

import LeadProgrammeCard from './LeadProgrammeCard';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/hooks/useAdminOutcomes', () => ({ useAdminOutcomes: jest.fn() }));

const { useAdminOutcomes } = require('@/hooks/useAdminOutcomes') as {
  useAdminOutcomes: jest.Mock;
};

type Programme = AdminOverviewResponse['programmes'][number];

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

const buildProgramme = (recovery: OutcomeResult): Programme => ({
  programmeId: 'p1',
  title: 'Depression',
  enrolledUsers: 30,
  outcomes: {
    window: 'last_90d',
    instrument: 'phq9',
    recovery,
    reliableImprovement: populated(0.5, recovery.n),
    reliableRecovery: populated(0.3, recovery.n)
  }
});

beforeEach(() => {
  useAdminOutcomes.mockReturnValue(mockQueryResult({ data: undefined }));
});

describe('LeadProgrammeCard', () => {
  it('renders the giant recovery hero when data is populated', () => {
    const { getByText, queryByText } = render(<LeadProgrammeCard programme={buildProgramme(populated(0.46, 24))} />);
    expect(getByText('46')).toBeTruthy();
    expect(getByText('%')).toBeTruthy();
    expect(getByText(/n = 24 paired assessments/)).toBeTruthy();
    expect(queryByText(/Awaiting data/)).toBeNull();
  });

  it('drops the hero and shows below-k awaiting-data copy when suppressed (below_k)', () => {
    const { getByText, queryByText } = render(
      <LeadProgrammeCard programme={buildProgramme(suppressed('below_k', 3))} />
    );
    expect(getByText('Awaiting data · needs 5+ paired assessments')).toBeTruthy();
    expect(getByText('Currently 3 paired · last 90 days')).toBeTruthy();
    // Giant hero must not render — no italic dash, no "%" glyph next to it
    expect(queryByText('—')).toBeNull();
  });

  it('drops the hero and shows below-min-n awaiting-data copy when suppressed (below_min_n)', () => {
    const { getByText, queryByText } = render(
      <LeadProgrammeCard programme={buildProgramme(suppressed('below_min_n', 12))} />
    );
    expect(getByText('Awaiting data · needs 20+ paired assessments')).toBeTruthy();
    expect(getByText('Currently 12 paired · last 90 days')).toBeTruthy();
    expect(queryByText('—')).toBeNull();
  });

  it('always renders the triplet below the hero regardless of suppression', () => {
    const { getAllByText } = render(<LeadProgrammeCard programme={buildProgramme(suppressed('below_k', 3))} />);
    // Recovery + Reliable improvement + Reliable recovery labels come from OutcomeTriplet
    expect(getAllByText('Recovery').length).toBeGreaterThan(0);
    expect(getAllByText('Reliable improvement').length).toBeGreaterThan(0);
    expect(getAllByText('Reliable recovery').length).toBeGreaterThan(0);
  });
});
