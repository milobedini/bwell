import type { AttemptDetailResponseItem, DiaryDetail } from '@milobedini/shared-types';
import { act, renderHook } from '@testing-library/react-native';

import { useDiaryState } from './useDiaryState';

// --- Mocks ---
// TODO: expo-router, useAttempts, and expo-haptics mocks are duplicated across
// useDiaryState.test.ts and useFiveAreasState.test.ts. Extract shared mock
// factories to test-utils/ once more attempt-presenter tests are added.

const mockRouter = { back: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({})
}));

const mockSaveMutate = jest.fn();
const mockSaveSilently = jest.fn();
const mockSubmitMutate = jest.fn();

jest.mock('@/hooks/useAttempts', () => ({
  useSaveModuleAttempt: () => ({
    mutate: mockSaveMutate,
    mutateSilently: mockSaveSilently,
    isPending: false,
    isSuccess: false
  }),
  useSubmitAttempt: () => ({
    mutate: mockSubmitMutate,
    isPending: false
  })
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success', Error: 'error' }
}));

jest.mock('sonner-native', () => ({
  toast: { loading: jest.fn(), success: jest.fn(), error: jest.fn() }
}));

// --- Helpers ---

const EMPTY_DAYS: DiaryDetail['days'] = [];

const makeDiary = (days: DiaryDetail['days'] = EMPTY_DAYS): DiaryDetail => ({
  days,
  totals: { count: 0, avgMood: null, avgAchievement: null, avgCloseness: null, avgEnjoyment: null }
});

const makeAttempt = (
  overrides: Partial<AttemptDetailResponseItem> = {}
): AttemptDetailResponseItem & { diary: DiaryDetail } =>
  ({
    _id: 'attempt-1',
    moduleId: 'mod-1',
    userId: 'user-1',
    status: 'in_progress',
    moduleSnapshot: { _id: 'mod-1', title: 'Activity Diary', type: 'diary', description: '' },
    weekStart: '2025-01-06T00:00:00.000Z',
    startedAt: '2025-01-06T10:00:00.000Z',
    updatedAt: '2025-01-06T10:00:00.000Z',
    diary: makeDiary(),
    ...overrides
  }) as AttemptDetailResponseItem & { diary: DiaryDetail };

describe('useDiaryState', () => {
  beforeEach(() => jest.clearAllMocks());

  it('initialises with correct default state', () => {
    // Create attempt ONCE — stable reference across re-renders
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'edit' }));

    expect(result.current.canEdit).toBe(true);
    expect(result.current.hasDirtyChanges).toBe(false);
    expect(result.current.allAnswered).toBe(false);
    expect(result.current.days).toHaveLength(7);
  });

  it('generates 7 days starting from Monday', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'edit' }));

    const dayNames = result.current.days.map((d: Date) => d.toLocaleDateString('en-US', { weekday: 'short' }));
    expect(dayNames[0]).toBe('Mon');
    expect(dayNames[6]).toBe('Sun');
  });

  it('tracks dirty state when a slot is updated', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'edit' }));

    expect(result.current.hasDirtyChanges).toBe(false);

    const firstSlotKey = result.current.dayRows[0]?.key;
    expect(firstSlotKey).toBeDefined();

    act(() => {
      result.current.updateSlot(firstSlotKey, { activity: 'Went for a walk' });
    });

    expect(result.current.hasDirtyChanges).toBe(true);
  });

  it('saveDirty calls mutateSilently with dirty entries', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'edit' }));

    const firstSlotKey = result.current.dayRows[0]?.key;

    act(() => {
      result.current.updateSlot(firstSlotKey, { activity: 'Read a book' });
    });

    act(() => {
      result.current.saveDirty();
    });

    expect(mockSaveSilently).toHaveBeenCalledTimes(1);
    const payload = mockSaveSilently.mock.calls[0][0];
    expect(payload.merge).toBe(true);
    expect(payload.diaryEntries).toHaveLength(1);
    expect(payload.diaryEntries[0].activity).toBe('Read a book');
  });

  it('saveDirty is a no-op when there are no dirty changes', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'edit' }));

    act(() => {
      result.current.saveDirty();
    });

    expect(mockSaveSilently).not.toHaveBeenCalled();
  });

  it('handleSubmitOrExit navigates back when not editable and no dirty changes', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'view' }));

    act(() => {
      result.current.handleSubmitOrExit();
    });

    expect(mockRouter.back).toHaveBeenCalled();
    expect(mockSaveMutate).not.toHaveBeenCalled();
  });

  it('handleSubmitOrExit saves dirty changes before navigating back in view mode', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'view' }));

    const firstSlotKey = result.current.dayRows[0]?.key;

    act(() => {
      result.current.updateSlot(firstSlotKey, { activity: 'Something' });
    });

    act(() => {
      result.current.handleSubmitOrExit();
    });

    expect(mockSaveMutate).toHaveBeenCalledTimes(1);
  });

  it('switching active day updates dayRows', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'edit' }));

    const initialDay = result.current.activeDayISO;
    const secondDay = result.current.days[1];
    const secondDayISO = secondDay.toISOString().slice(0, 10);

    act(() => {
      result.current.setActiveDayISO(secondDayISO);
    });

    expect(result.current.activeDayISO).not.toBe(initialDay);
    expect(result.current.activeDayISO).toBe(secondDayISO);
  });

  it('includes userNote in save payload when note is dirty', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'edit' }));

    act(() => {
      result.current.setUserNoteText('My reflection');
      result.current.setNoteDirty(true);
    });

    act(() => {
      result.current.saveDirty();
    });

    expect(mockSaveSilently).toHaveBeenCalledTimes(1);
    const payload = mockSaveSilently.mock.calls[0][0];
    expect(payload.userNote).toBe('My reflection');
  });

  it('computes slotFillCounts for each day', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'edit' }));

    const firstDayISO = result.current.activeDayISO;
    expect(result.current.slotFillCounts[firstDayISO]).toBe(0);

    const firstSlotKey = result.current.dayRows[0]?.key;
    act(() => {
      result.current.updateSlot(firstSlotKey, { activity: 'Walk' });
    });

    expect(result.current.slotFillCounts[firstDayISO]).toBe(1);
  });

  it('canEdit is false in view mode', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useDiaryState({ attempt, mode: 'view' }));

    expect(result.current.canEdit).toBe(false);
  });
});
