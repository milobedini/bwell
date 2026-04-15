import type { AttemptDetailResponseItem } from '@milobedini/shared-types';
import { act, renderHook } from '@testing-library/react-native';

import { useGeneralGoalsState } from './useGeneralGoalsState';

const mockSaveSilently = jest.fn();
const mockSubmitMutate = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ assignmentId: 'assignment-from-params' })
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Error: 'error' }
}));

jest.mock('sonner-native', () => ({
  toast: { error: jest.fn() }
}));

jest.mock('@/components/toast/toastOptions', () => ({
  TOAST_DURATIONS: { error: 3000 },
  TOAST_STYLES: { error: {} }
}));

jest.mock('@/hooks/useAttempts', () => ({
  useSaveModuleAttempt: () => ({
    mutateSilently: mockSaveSilently,
    isPending: false
  }),
  useSubmitAttempt: () => ({
    mutate: mockSubmitMutate,
    isPending: false
  })
}));

const makeAttempt = (overrides: Partial<AttemptDetailResponseItem> = {}): AttemptDetailResponseItem =>
  ({
    _id: 'attempt-1',
    moduleId: 'mod-1',
    userId: 'user-1',
    status: 'in_progress',
    generalGoals: undefined,
    ...overrides
  }) as AttemptDetailResponseItem;

describe('useGeneralGoalsState', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Initialisation ──

  it('initialises with empty goals and reflection when no data', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'edit' }));

    expect(result.current.goals).toEqual([]);
    expect(result.current.reflection).toBe('');
    expect(result.current.isReRating).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('initialises from existing attempt data', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: 'Be calmer', rating: 5 }],
        reflection: 'Some thoughts',
        isReRating: false,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));

    expect(result.current.goals).toEqual([expect.objectContaining({ goalText: 'Be calmer', rating: 5 })]);
    expect(result.current.reflection).toBe('Some thoughts');
  });

  // ── canEdit ──

  it('canEdit is true in edit mode with in_progress status', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'edit' }));
    expect(result.current.canEdit).toBe(true);
  });

  it('canEdit is false in view mode', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'view' }));
    expect(result.current.canEdit).toBe(false);
  });

  it('canEdit is false when attempt is submitted', () => {
    const { result } = renderHook(() =>
      useGeneralGoalsState({ attempt: makeAttempt({ status: 'submitted' }), mode: 'edit' })
    );
    expect(result.current.canEdit).toBe(false);
  });

  // ── canAddGoal ──

  it('canAddGoal is true when editing, not re-rating, and fewer than 3 goals', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'edit' }));
    expect(result.current.canAddGoal).toBe(true);
  });

  it('canAddGoal is false when re-rating', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: 'Goal', rating: 5 }],
        reflection: '',
        isReRating: true,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));
    expect(result.current.canAddGoal).toBe(false);
  });

  it('canAddGoal is false when already at 3 goals', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [
          { goalText: 'A', rating: 1 },
          { goalText: 'B', rating: 2 },
          { goalText: 'C', rating: 3 }
        ],
        reflection: '',
        isReRating: false,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));
    expect(result.current.canAddGoal).toBe(false);
  });

  // ── addGoal ──

  it('addGoal appends an empty goal and marks dirty', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'edit' }));

    act(() => result.current.addGoal());

    expect(result.current.goals).toEqual([expect.objectContaining({ goalText: '', rating: null })]);
    expect(result.current.goals[0]).toHaveProperty('_uid');
    expect(result.current.isDirty).toBe(true);
  });

  it('addGoal does nothing when canAddGoal is false', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'view' }));

    act(() => result.current.addGoal());

    expect(result.current.goals).toEqual([]);
  });

  // ── updateGoalText ──

  it('updateGoalText updates the text at the given index', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: '', rating: null }],
        reflection: '',
        isReRating: false,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));

    act(() => result.current.updateGoalText(0, 'Feel better'));

    expect(result.current.goals[0].goalText).toBe('Feel better');
    expect(result.current.isDirty).toBe(true);
  });

  it('updateGoalText is blocked when re-rating', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: 'Original', rating: 5 }],
        reflection: '',
        isReRating: true,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));

    act(() => result.current.updateGoalText(0, 'Changed'));

    expect(result.current.goals[0].goalText).toBe('Original');
  });

  // ── updateGoalRating ──

  it('updateGoalRating updates the rating at the given index', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: 'Goal', rating: null }],
        reflection: '',
        isReRating: false,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));

    act(() => result.current.updateGoalRating(0, 7));

    expect(result.current.goals[0].rating).toBe(7);
    expect(result.current.isDirty).toBe(true);
  });

  // ── removeGoal ──

  it('removeGoal removes the goal at the given index', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [
          { goalText: 'A', rating: 1 },
          { goalText: 'B', rating: 2 }
        ],
        reflection: '',
        isReRating: false,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));

    act(() => result.current.removeGoal(0));

    expect(result.current.goals).toEqual([expect.objectContaining({ goalText: 'B', rating: 2 })]);
    expect(result.current.isDirty).toBe(true);
  });

  it('removeGoal is blocked when re-rating', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: 'A', rating: 5 }],
        reflection: '',
        isReRating: true,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));

    act(() => result.current.removeGoal(0));

    expect(result.current.goals).toHaveLength(1);
  });

  // ── updateReflection ──

  it('updateReflection updates reflection text and marks dirty', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'edit' }));

    act(() => result.current.updateReflection('New reflection'));

    expect(result.current.reflection).toBe('New reflection');
    expect(result.current.isDirty).toBe(true);
  });

  // ── canSubmit ──

  it('canSubmit is false when no goals', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'edit' }));
    expect(result.current.canSubmit).toBe(false);
  });

  it('canSubmit is false when goal has no text', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: '', rating: 5 }],
        reflection: 'Reflection',
        isReRating: false,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));
    expect(result.current.canSubmit).toBe(false);
  });

  it('canSubmit is false when goal has no rating', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: 'Goal', rating: null }],
        reflection: 'Reflection',
        isReRating: false,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));
    expect(result.current.canSubmit).toBe(false);
  });

  it('canSubmit is false when reflection is empty', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: 'Goal', rating: 5 }],
        reflection: '',
        isReRating: false,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));
    expect(result.current.canSubmit).toBe(false);
  });

  it('canSubmit is true when all conditions met', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: 'Goal', rating: 5 }],
        reflection: 'My reflection',
        isReRating: false,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));
    expect(result.current.canSubmit).toBe(true);
  });

  // ── save ──

  it('save calls saveAttemptSilently when dirty and canEdit', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'edit' }));

    act(() => result.current.addGoal());
    act(() => result.current.save());

    expect(mockSaveSilently).toHaveBeenCalledTimes(1);
    expect(mockSaveSilently.mock.calls[0][0]).toEqual({
      generalGoals: expect.objectContaining({ goals: [{ goalText: '', rating: null }] })
    });
    expect(mockSaveSilently.mock.calls[0][1]).toEqual(expect.objectContaining({ onError: expect.any(Function) }));
  });

  it('save does nothing when not dirty', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'edit' }));

    act(() => result.current.save());

    expect(mockSaveSilently).not.toHaveBeenCalled();
  });

  it('save clears isDirty on success', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'edit' }));

    act(() => result.current.addGoal());
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.save());

    const onSuccess = mockSaveSilently.mock.calls[0][1].onSuccess;
    act(() => onSuccess());

    expect(result.current.isDirty).toBe(false);
  });

  // ── handleSubmit ──

  it('handleSubmit saves then submits with assignmentId from route params', () => {
    const attempt = makeAttempt({
      generalGoals: {
        goals: [{ goalText: 'Goal', rating: 5 }],
        reflection: 'Reflection',
        isReRating: false,
        previousRatings: []
      }
    });
    const { result } = renderHook(() => useGeneralGoalsState({ attempt, mode: 'edit' }));

    act(() => result.current.handleSubmit());

    expect(mockSaveSilently).toHaveBeenCalledTimes(1);

    // Trigger save onSuccess to fire submitAttempt
    const onSuccess = mockSaveSilently.mock.calls[0][1].onSuccess;
    act(() => onSuccess());

    expect(mockSubmitMutate).toHaveBeenCalledWith(
      { assignmentId: 'assignment-from-params' },
      expect.objectContaining({ onError: expect.any(Function) })
    );
  });

  it('handleSubmit does nothing when canSubmit is false', () => {
    const { result } = renderHook(() => useGeneralGoalsState({ attempt: makeAttempt(), mode: 'edit' }));

    act(() => result.current.handleSubmit());

    expect(mockSaveSilently).not.toHaveBeenCalled();
    expect(mockSubmitMutate).not.toHaveBeenCalled();
  });
});
