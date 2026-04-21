import { mockQueryResult } from '@/test-utils/mockQueryResult';
import type { AdminProgrammeDetailResponse, OutcomeResult } from '@milobedini/shared-types';
import { render } from '@testing-library/react-native';

import ProgrammeDetailScreen from './ProgrammeDetailScreen';

jest.mock('@/hooks/useAdminProgrammeDetail', () => ({
  useAdminProgrammeDetail: jest.fn()
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
    SafeAreaView: (props: { children: unknown }) => <View>{props.children as never}</View>,
    SafeAreaProvider: (props: { children: unknown }) => <>{props.children as never}</>
  };
});
jest.mock('@/components/LoadingScreen', () => {
  const { View } = require('react-native');
  return { LoadingIndicator: () => <View testID="loading-indicator" /> };
});

const { useAdminProgrammeDetail } = require('@/hooks/useAdminProgrammeDetail') as {
  useAdminProgrammeDetail: jest.Mock;
};

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

const buildResponse = (overrides: Partial<AdminProgrammeDetailResponse> = {}): AdminProgrammeDetailResponse => ({
  asOf: '2026-04-21T10:00:00.000Z',
  rollupAsOf: '2026-04-21T02:00:00.000Z',
  privacyMode: 'production',
  programme: {
    _id: 'prog-1',
    title: 'Depression',
    description: 'Depression programme description.'
  },
  enrolment: {
    total: 30,
    byCareTier: [
      { careTier: 'self_help', count: 10 },
      { careTier: 'cbt_guided', count: 15 },
      { careTier: 'pwp_guided', count: 5 }
    ]
  },
  outcomesByInstrument: [
    {
      instrument: 'phq9',
      cutoff: 10,
      reliableChangeDelta: 6,
      window: 'last_90d',
      overall: {
        recovery: populated(0.46, 24),
        reliableImprovement: populated(0.5, 24),
        reliableRecovery: populated(0.3, 24)
      },
      byCareTier: [
        {
          careTier: 'self_help',
          recovery: populated(0.31, 18),
          reliableImprovement: populated(0.44, 22),
          reliableRecovery: populated(0.24, 18)
        },
        {
          careTier: 'cbt_guided',
          recovery: populated(0.54, 21),
          reliableImprovement: populated(0.71, 26),
          reliableRecovery: populated(0.46, 21)
        },
        {
          careTier: 'pwp_guided',
          recovery: suppressed('below_k', 3),
          reliableImprovement: suppressed('below_k', 3),
          reliableRecovery: suppressed('below_k', 3)
        }
      ]
    }
  ],
  work: {
    completedAttemptsLast7d: 42,
    stalledAttempts7d: 3,
    byType: [
      { moduleType: 'questionnaire', count: 30 },
      { moduleType: 'activity_diary', count: 12 }
    ]
  },
  ...overrides
});

describe('ProgrammeDetailScreen', () => {
  it('renders loading indicator when the query is pending', () => {
    useAdminProgrammeDetail.mockReturnValue(mockQueryResult({ isPending: true }));
    const { getByTestId } = render(<ProgrammeDetailScreen programmeId="prog-1" />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders error state when the query errors', () => {
    useAdminProgrammeDetail.mockReturnValue(mockQueryResult({ isPending: false, isError: true, data: undefined }));
    const { getByText } = render(<ProgrammeDetailScreen programmeId="prog-1" />);
    expect(getByText(/something went wrong/i)).toBeTruthy();
  });

  it('renders the programme title, description and freshness chips', () => {
    useAdminProgrammeDetail.mockReturnValue(mockQueryResult({ isPending: false, data: buildResponse() }));
    const { getByText } = render(<ProgrammeDetailScreen programmeId="prog-1" />);
    expect(getByText('Depression')).toBeTruthy();
    expect(getByText('Depression programme description.')).toBeTruthy();
    expect(getByText(/Live ·/)).toBeTruthy();
    expect(getByText(/Rollup ·/)).toBeTruthy();
  });

  it('renders enrolment total and per-tier counts', () => {
    useAdminProgrammeDetail.mockReturnValue(mockQueryResult({ isPending: false, data: buildResponse() }));
    const { getByText, getAllByText } = render(<ProgrammeDetailScreen programmeId="prog-1" />);
    expect(getByText('Enrolment')).toBeTruthy();
    // 30 appears twice (enrolment total + questionnaire count). Assert both render.
    expect(getAllByText('30').length).toBe(2);
    expect(getByText('15')).toBeTruthy(); // cbt enrolment
    expect(getAllByText('Self-help').length).toBeGreaterThan(0);
    expect(getAllByText('CBT').length).toBeGreaterThan(0);
    expect(getAllByText('PWP').length).toBeGreaterThan(0);
  });

  it('renders the overall IAPT triplet and tier breakdown table', () => {
    useAdminProgrammeDetail.mockReturnValue(mockQueryResult({ isPending: false, data: buildResponse() }));
    const { getByText, getAllByText } = render(<ProgrammeDetailScreen programmeId="prog-1" />);
    expect(getByText('PHQ-9 outcomes')).toBeTruthy();
    expect(getByText('PHQ-9 · cutoff 10 · Δ ≥ 6 · last 90 days')).toBeTruthy();
    // Overall recovery 46% renders in the triplet; 46% also appears once as cbt reliableRecovery.
    expect(getAllByText('46%').length).toBe(2);
    // Table cells unique to the tier breakdown
    expect(getByText('31%')).toBeTruthy();
    expect(getByText('54%')).toBeTruthy();
    expect(getByText('71%')).toBeTruthy();
    // Suppressed pwp row
    expect(getAllByText(/< \d+ patients/).length).toBe(3);
  });

  it('shows the suppression note when at least one tier cell is suppressed', () => {
    useAdminProgrammeDetail.mockReturnValue(mockQueryResult({ isPending: false, data: buildResponse() }));
    const { getByText } = render(<ProgrammeDetailScreen programmeId="prog-1" />);
    expect(getByText(/k-anonymity/)).toBeTruthy();
  });

  it('renders the work section with completed, stalled and by-type rows', () => {
    useAdminProgrammeDetail.mockReturnValue(mockQueryResult({ isPending: false, data: buildResponse() }));
    const { getByText } = render(<ProgrammeDetailScreen programmeId="prog-1" />);
    expect(getByText('Work · last 7 days')).toBeTruthy();
    expect(getByText('42')).toBeTruthy(); // completed
    expect(getByText('3')).toBeTruthy(); // stalled
    expect(getByText('Questionnaire')).toBeTruthy();
    expect(getByText('Activity diary')).toBeTruthy();
    expect(getByText('12')).toBeTruthy(); // activity_diary count
  });

  it('renders a non-IAPT fallback block when outcomesByInstrument is empty', () => {
    useAdminProgrammeDetail.mockReturnValue(
      mockQueryResult({
        isPending: false,
        data: buildResponse({
          outcomesByInstrument: [],
          programme: { _id: 'p2', title: 'Resilience & Coping', description: '' }
        })
      })
    );
    const { getByText, queryByText } = render(<ProgrammeDetailScreen programmeId="p2" />);
    expect(getByText(/No clinical instrument attached/)).toBeTruthy();
    expect(queryByText('PHQ-9 outcomes')).toBeNull();
  });

  it('omits the suppression note when no tier cell is suppressed', () => {
    const data = buildResponse();
    const phq9 = data.outcomesByInstrument[0];
    phq9.byCareTier = phq9.byCareTier.map((row) => ({
      ...row,
      recovery: populated(0.4, 22),
      reliableImprovement: populated(0.5, 22),
      reliableRecovery: populated(0.3, 22)
    }));

    useAdminProgrammeDetail.mockReturnValue(mockQueryResult({ isPending: false, data }));
    const { queryByText } = render(<ProgrammeDetailScreen programmeId="prog-1" />);
    expect(queryByText(/k-anonymity/)).toBeNull();
  });
});
