import { useMyPractice } from '@/hooks/usePractice';
import { useScoreTrends } from '@/hooks/useScoreTrends';
import { createQueryClientWrapper } from '@/test-utils/createQueryClientWrapper';
import { mockQueryResult } from '@/test-utils/mockQueryResult';
import type { PracticeItem, PracticeResponse, ScoreTrendsResponse } from '@milobedini/shared-types';
import { renderHook } from '@testing-library/react-native';

import { usePatientDashboard } from './usePatientDashboard';

jest.mock('sonner-native', () => ({ toast: { loading: jest.fn(), success: jest.fn(), error: jest.fn() } }));
jest.mock('@/hooks/usePractice');
jest.mock('@/hooks/useScoreTrends');

const mockUseMyPractice = jest.mocked(useMyPractice);
const mockUseScoreTrends = jest.mocked(useScoreTrends);

const makePracticeItem = (overrides: Partial<PracticeItem> = {}): PracticeItem =>
  ({
    assignmentId: 'a1',
    moduleId: 'm1',
    moduleTitle: 'Test Module',
    moduleType: 'questionnaire',
    dueAt: null,
    latestAttempt: null,
    ...overrides
  }) as PracticeItem;

const pendingPractice = () => mockQueryResult<PracticeResponse>();

const loadedPractice = (data: PracticeResponse) =>
  mockQueryResult<PracticeResponse>({
    isPending: false,
    isSuccess: true,
    isLoading: false,
    isFetching: false,
    isFetched: true,
    status: 'success',
    fetchStatus: 'idle',
    data
  });

const pendingTrends = () => mockQueryResult<ScoreTrendsResponse>();

const loadedTrends = (data: ScoreTrendsResponse) =>
  mockQueryResult<ScoreTrendsResponse>({
    isPending: false,
    isSuccess: true,
    isLoading: false,
    isFetching: false,
    isFetched: true,
    status: 'success',
    fetchStatus: 'idle',
    data
  });

const emptyPractice: PracticeResponse = {
  success: true,
  today: [],
  thisWeek: [],
  upcoming: [],
  recentlyCompleted: []
} as PracticeResponse;
const emptyTrends: ScoreTrendsResponse = { success: true, trends: [] } as ScoreTrendsResponse;

describe('usePatientDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null data while pending', () => {
    mockUseMyPractice.mockReturnValue(pendingPractice());
    mockUseScoreTrends.mockReturnValue(pendingTrends());

    const { result } = renderHook(() => usePatientDashboard(), { wrapper: createQueryClientWrapper() });

    expect(result.current.data).toBeNull();
    expect(result.current.isPending).toBe(true);
  });

  it('returns hasData false when no assignments or trends', () => {
    mockUseMyPractice.mockReturnValue(loadedPractice(emptyPractice));
    mockUseScoreTrends.mockReturnValue(loadedTrends(emptyTrends));

    const { result } = renderHook(() => usePatientDashboard(), { wrapper: createQueryClientWrapper() });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.hasData).toBe(false);
    expect(result.current.data!.focusAssignment).toBeNull();
  });

  it('picks overdue assignment as focus (oldest first)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-06T12:00:00Z'));

    const overdue1 = makePracticeItem({ assignmentId: 'a1', dueAt: '2026-04-03T12:00:00Z' });
    const overdue2 = makePracticeItem({ assignmentId: 'a2', dueAt: '2026-04-04T12:00:00Z' });

    mockUseMyPractice.mockReturnValue(loadedPractice({ ...emptyPractice, today: [overdue2, overdue1] }));
    mockUseScoreTrends.mockReturnValue(loadedTrends(emptyTrends));

    const { result } = renderHook(() => usePatientDashboard(), { wrapper: createQueryClientWrapper() });

    expect(result.current.data!.focusAssignment?.assignmentId).toBe('a1');
  });

  it('picks nearest upcoming when no overdue', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-06T12:00:00Z'));

    const upcoming1 = makePracticeItem({ assignmentId: 'a1', dueAt: '2026-04-10T12:00:00Z' });
    const upcoming2 = makePracticeItem({ assignmentId: 'a2', dueAt: '2026-04-08T12:00:00Z' });

    mockUseMyPractice.mockReturnValue(loadedPractice({ ...emptyPractice, thisWeek: [upcoming1, upcoming2] }));
    mockUseScoreTrends.mockReturnValue(loadedTrends(emptyTrends));

    const { result } = renderHook(() => usePatientDashboard(), { wrapper: createQueryClientWrapper() });

    expect(result.current.data!.focusAssignment?.assignmentId).toBe('a2');
  });

  it('limits upcoming assignments to 3, excluding focus card', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-06T12:00:00Z'));

    const items = Array.from({ length: 5 }, (_, i) =>
      makePracticeItem({ assignmentId: `a${i}`, dueAt: `2026-04-${String(7 + i).padStart(2, '0')}T12:00:00Z` })
    );

    mockUseMyPractice.mockReturnValue(loadedPractice({ ...emptyPractice, thisWeek: items }));
    mockUseScoreTrends.mockReturnValue(loadedTrends(emptyTrends));

    const { result } = renderHook(() => usePatientDashboard(), { wrapper: createQueryClientWrapper() });

    expect(result.current.data!.focusAssignment?.assignmentId).toBe('a0');
    expect(result.current.data!.upcomingAssignments).toHaveLength(3);
    expect(result.current.data!.upcomingAssignments.map((a) => a.assignmentId)).toEqual(['a1', 'a2', 'a3']);
  });

  it('calculates on-time streak correctly', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-06T12:00:00Z'));

    const completed = [
      makePracticeItem({
        assignmentId: 'c1',
        dueAt: '2026-04-05T23:59:00Z',
        latestAttempt: { completedAt: '2026-04-05T10:00:00Z' } as PracticeItem['latestAttempt']
      }),
      makePracticeItem({
        assignmentId: 'c2',
        dueAt: '2026-04-04T23:59:00Z',
        latestAttempt: { completedAt: '2026-04-04T10:00:00Z' } as PracticeItem['latestAttempt']
      }),
      makePracticeItem({
        assignmentId: 'c3',
        dueAt: '2026-04-03T23:59:00Z',
        latestAttempt: { completedAt: '2026-04-04T10:00:00Z' } as PracticeItem['latestAttempt'] // late
      })
    ];

    mockUseMyPractice.mockReturnValue(loadedPractice({ ...emptyPractice, recentlyCompleted: completed }));
    mockUseScoreTrends.mockReturnValue(loadedTrends(emptyTrends));

    const { result } = renderHook(() => usePatientDashboard(), { wrapper: createQueryClientWrapper() });

    expect(result.current.data!.onTimeStreak.current).toBe(2);
    expect(result.current.data!.onTimeStreak.history).toHaveLength(3);
  });

  it('reports isError when either query errors', () => {
    mockUseMyPractice.mockReturnValue(
      mockQueryResult<PracticeResponse>({
        isPending: false,
        isError: true,
        isLoading: false,
        status: 'error',
        fetchStatus: 'idle'
      })
    );
    mockUseScoreTrends.mockReturnValue(loadedTrends(emptyTrends));

    const { result } = renderHook(() => usePatientDashboard(), { wrapper: createQueryClientWrapper() });
    expect(result.current.isError).toBe(true);
  });
});
