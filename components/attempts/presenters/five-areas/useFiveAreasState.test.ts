import { mockCreatePresenterRefs, mockHaptics, mockSonner, mockToastOptions } from '@/test-utils/presenterMocks';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AREA_KEYS, useFiveAreasState } from './useFiveAreasState';

// --- Mocks ---
const mocks = mockCreatePresenterRefs();

jest.mock('expo-router', () => ({
  useRouter: () => mocks.router,
  useLocalSearchParams: () => ({})
}));
jest.mock('@/hooks/useAttempts', () => ({
  useSaveModuleAttempt: () => ({
    mutate: mocks.saveMutate,
    mutateSilently: mocks.saveSilently,
    isPending: false,
    isSuccess: false
  }),
  useSubmitAttempt: () => ({
    mutate: mocks.submitMutate,
    isPending: false
  })
}));
jest.mock('expo-haptics', () => mockHaptics);
jest.mock('sonner-native', () => mockSonner);
jest.mock('@/components/toast/toastOptions', () => mockToastOptions);

// --- Helpers ---

const makeAttempt = (overrides: Partial<AttemptDetailResponseItem> = {}): AttemptDetailResponseItem =>
  ({
    _id: 'attempt-1',
    moduleId: 'mod-1',
    userId: 'user-1',
    status: 'in_progress',
    moduleSnapshot: { _id: 'mod-1', title: 'Five Areas', type: 'five_areas', description: '' },
    fiveAreas: undefined,
    ...overrides
  }) as AttemptDetailResponseItem;

describe('useFiveAreasState', () => {
  beforeEach(() => jest.clearAllMocks());

  it('initialises at step 0 with no fields', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    expect(result.current.currentStep).toBe(0);
    expect(result.current.currentKey).toBe('situation');
    expect(result.current.showReview).toBe(false);
    expect(result.current.modalOpen).toBe(false);
    expect(result.current.canEdit).toBe(true);
  });

  it('canEdit is false when attempt is submitted', () => {
    const attempt = makeAttempt({ status: 'submitted' });
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    expect(result.current.canEdit).toBe(false);
  });

  it('canEdit is false in view mode', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'view' }));

    expect(result.current.canEdit).toBe(false);
  });

  it('updateField sets field value and marks key dirty', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    act(() => {
      result.current.updateField('situation', 'At work, stressed');
    });

    expect(result.current.fields.situation).toBe('At work, stressed');
  });

  it('goForward saves dirty fields then advances step', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    act(() => {
      result.current.updateField('situation', 'Something happened');
    });

    act(() => {
      result.current.goForward();
    });

    expect(mocks.saveSilently).toHaveBeenCalledTimes(1);
    const payload = mocks.saveSilently.mock.calls[0][0];
    expect(payload.fiveAreas).toEqual({ situation: 'Something happened' });

    // Simulate onSuccess callback to advance step
    const onSuccess = mocks.saveSilently.mock.calls[0][1].onSuccess;
    act(() => {
      onSuccess();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.currentKey).toBe('thoughts');
  });

  it('goForward with no dirty fields advances immediately', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    act(() => {
      result.current.goForward();
    });

    expect(mocks.saveSilently).not.toHaveBeenCalled();
    expect(result.current.currentStep).toBe(1);
  });

  it('goForward on last step shows review', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    // Advance to the last step
    for (let i = 0; i < AREA_KEYS.length - 1; i++) {
      act(() => {
        result.current.goForward();
      });
    }

    expect(result.current.currentStep).toBe(AREA_KEYS.length - 1);

    act(() => {
      result.current.goForward();
    });

    expect(result.current.showReview).toBe(true);
  });

  it('goBack decrements step', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    // Go forward first
    act(() => {
      result.current.goForward();
    });
    expect(result.current.currentStep).toBe(1);

    act(() => {
      result.current.goBack();
    });
    expect(result.current.currentStep).toBe(0);
  });

  it('goBack at step 0 closes modal', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    // Open modal first
    act(() => {
      result.current.openModal(0);
    });
    expect(result.current.modalOpen).toBe(true);

    act(() => {
      result.current.goBack();
    });
    expect(result.current.modalOpen).toBe(false);
  });

  it('openModal sets step and opens modal', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    act(() => {
      result.current.openModal(0);
    });

    expect(result.current.modalOpen).toBe(true);
    expect(result.current.currentStep).toBe(0);
  });

  it('openModal rejects out-of-range steps', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    act(() => {
      result.current.openModal(-1);
    });
    expect(result.current.modalOpen).toBe(false);

    act(() => {
      result.current.openModal(100);
    });
    expect(result.current.modalOpen).toBe(false);
  });

  it('openModal rejects steps beyond highestStep', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    // At step 0 with highestStep 0, trying to open step 3 should be rejected
    act(() => {
      result.current.openModal(3);
    });
    expect(result.current.modalOpen).toBe(false);
  });

  it('closeModal saves dirty and closes', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    act(() => {
      result.current.openModal(0);
    });
    expect(result.current.modalOpen).toBe(true);

    act(() => {
      result.current.closeModal();
    });
    expect(result.current.modalOpen).toBe(false);
  });

  it('resumes at first empty area when server data exists', async () => {
    const attempt = makeAttempt({
      fiveAreas: {
        situation: 'At home',
        thoughts: 'Feeling worried',
        emotions: '',
        physical: '',
        behaviours: '',
        reflection: ''
      }
    });

    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    await waitFor(() => {
      expect(result.current.fields.situation).toBe('At home');
    });

    // Should resume at 'emotions' (index 2) — the first empty field
    expect(result.current.currentStep).toBe(2);
  });

  it('completedSteps includes steps with content or past highestStep', () => {
    const attempt = makeAttempt({
      fiveAreas: {
        situation: 'Something',
        thoughts: '',
        emotions: '',
        physical: '',
        behaviours: '',
        reflection: ''
      }
    });

    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    // 'situation' has content so should be completed
    expect(result.current.completedSteps.has('situation')).toBe(true);
  });

  it('handleSubmit calls saveDirty then submitAttempt', () => {
    const attempt = makeAttempt();
    const { result } = renderHook(() => useFiveAreasState({ attempt, mode: 'edit' }));

    act(() => {
      result.current.handleSubmit();
    });

    // No dirty fields, so submitAttempt should be called directly
    expect(mocks.submitMutate).toHaveBeenCalledTimes(1);
    expect(mocks.submitMutate).toHaveBeenCalledWith({}, expect.objectContaining({ onSuccess: expect.any(Function) }));
  });
});
