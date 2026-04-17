import type { ReactNode } from 'react';
import type { AttemptDetailResponseItem } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

jest.mock('sonner-native', () => ({ toast: { error: jest.fn(), success: jest.fn(), loading: jest.fn() } }));
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(), notificationAsync: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }), useLocalSearchParams: () => ({}) }));
jest.mock('@/hooks/useAttempts', () => ({
  useSaveModuleAttempt: () => ({ mutateSilently: jest.fn(), isPending: false }),
  useSubmitAttempt: () => ({ mutate: jest.fn(), isPending: false })
}));
jest.mock('@/components/toast/toastOptions', () => ({ TOAST_DURATIONS: { error: 3000 }, TOAST_STYLES: { error: {} } }));

jest.mock('moti', () => {
  const { View } = require('react-native');
  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
    MotiView: ({ children, ...props }: { children: ReactNode }) => <View {...props}>{children}</View>
  };
});

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => <Text>{name}</Text> };
});

const mockState = {
  fields: {
    situation: 'At work',
    thoughts: 'Negative thoughts',
    emotions: 'Anxious',
    physical: 'Tense',
    behaviours: 'Withdrew',
    reflection: 'Need to break cycle'
  },
  currentStep: 0,
  completedSteps: new Set(['situation', 'thoughts', 'emotions', 'physical', 'behaviours', 'reflection']),
  canEdit: false,
  showReview: false,
  modalOpen: false,
  currentKey: 'situation' as const,
  openModal: jest.fn(),
  closeModal: jest.fn(),
  goForward: jest.fn(),
  goBack: jest.fn(),
  updateField: jest.fn(),
  goToReview: jest.fn(),
  handleSubmit: jest.fn(),
  isSaving: false,
  isSubmitting: false,
  highestStep: 5
};

const mockUseFiveAreasState = jest.fn((_params?: unknown) => mockState);
jest.mock('./useFiveAreasState', () => ({
  AREA_KEYS: ['situation', 'thoughts', 'emotions', 'physical', 'behaviours', 'reflection'],
  AREA_LABELS: {
    situation: 'Situation',
    thoughts: 'Thoughts',
    emotions: 'Emotions',
    physical: 'Physical Sensations',
    behaviours: 'Behaviours',
    reflection: 'Reflection'
  },
  useFiveAreasState: (params: unknown) => mockUseFiveAreasState(params)
}));

jest.mock('./FiveAreasDiagram', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>FiveAreasDiagram</Text> };
});

jest.mock('./AreaInputModal', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: () => <Text>AreaInputModal</Text> };
});

jest.mock('./AreaReviewCard', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ areaKey, value }: { areaKey: string; value: string }) => (
      <Text>
        {areaKey}: {value}
      </Text>
    )
  };
});

const FiveAreasPresenter = require('./FiveAreasPresenter').default;

const makeAttempt = (overrides: Partial<AttemptDetailResponseItem> = {}): AttemptDetailResponseItem =>
  ({
    _id: 'att-1',
    moduleType: 'five_areas',
    status: 'submitted',
    createdAt: '2026-04-01',
    ...overrides
  }) as AttemptDetailResponseItem;

describe('FiveAreasPresenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFiveAreasState.mockReturnValue({ ...mockState, canEdit: false });
  });

  // ── View mode ──

  it('renders review cards for all 6 areas in view mode', () => {
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="view" />);

    expect(screen.getByText('situation: At work')).toBeTruthy();
    expect(screen.getByText('thoughts: Negative thoughts')).toBeTruthy();
    expect(screen.getByText('emotions: Anxious')).toBeTruthy();
    expect(screen.getByText('physical: Tense')).toBeTruthy();
    expect(screen.getByText('behaviours: Withdrew')).toBeTruthy();
    expect(screen.getByText('reflection: Need to break cycle')).toBeTruthy();
  });

  it('shows in-progress banner when attempt status is not submitted in view mode', () => {
    const attempt = makeAttempt({ status: 'started' });
    render(<FiveAreasPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('This entry is still in progress.')).toBeTruthy();
  });

  it('does not show in-progress banner when attempt is submitted', () => {
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="view" />);

    expect(screen.queryByText('This entry is still in progress.')).toBeNull();
  });

  it('renders the diagram in view mode', () => {
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="view" />);

    expect(screen.getByText('FiveAreasDiagram')).toBeTruthy();
  });

  it('shows userNote when present', () => {
    const attempt = makeAttempt({ userNote: 'Felt much better today' });
    render(<FiveAreasPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('Felt much better today')).toBeTruthy();
  });

  it('shows "Personal Note" header when no patientName', () => {
    const attempt = makeAttempt({ userNote: 'My note' });
    render(<FiveAreasPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('Personal Note')).toBeTruthy();
  });

  it('shows patientName in note header when provided', () => {
    const attempt = makeAttempt({ userNote: 'A note' });
    render(<FiveAreasPresenter attempt={attempt} mode="view" patientName="Alice" />);

    expect(screen.getByText("Alice's Note")).toBeTruthy();
  });

  it('does not show note section when userNote is absent', () => {
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="view" />);

    expect(screen.queryByText('Personal Note')).toBeNull();
  });

  // ── Edit mode ──

  it('shows diagram and edit prompt in edit mode', () => {
    mockUseFiveAreasState.mockReturnValue({ ...mockState, canEdit: true, modalOpen: false });
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByText('FiveAreasDiagram')).toBeTruthy();
    expect(screen.getByText('Tap any area to edit')).toBeTruthy();
  });

  it('shows "Review & Submit" button when all areas completed', () => {
    mockUseFiveAreasState.mockReturnValue({
      ...mockState,
      canEdit: true,
      modalOpen: false,
      completedSteps: new Set(['situation', 'thoughts', 'emotions', 'physical', 'behaviours', 'reflection'])
    });
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByText('Review & Submit')).toBeTruthy();
  });

  it('does not show "Review & Submit" when not all areas completed', () => {
    mockUseFiveAreasState.mockReturnValue({
      ...mockState,
      canEdit: true,
      modalOpen: false,
      completedSteps: new Set(['situation', 'thoughts'])
    });
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.queryByText('Review & Submit')).toBeNull();
  });

  it('renders AreaInputModal when modal is open in edit mode', () => {
    mockUseFiveAreasState.mockReturnValue({
      ...mockState,
      canEdit: true,
      modalOpen: true
    });
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByText('AreaInputModal')).toBeTruthy();
  });

  it('does not show AreaInputModal when modal is closed', () => {
    mockUseFiveAreasState.mockReturnValue({
      ...mockState,
      canEdit: true,
      modalOpen: false
    });
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.queryByText('AreaInputModal')).toBeNull();
  });

  // ── Review mode (canEdit + showReview) ──

  it('shows review cards and Submit button in review mode', () => {
    mockUseFiveAreasState.mockReturnValue({
      ...mockState,
      canEdit: true,
      showReview: true
    });
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByText('situation: At work')).toBeTruthy();
    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('shows "Submitting..." when isSubmitting', () => {
    mockUseFiveAreasState.mockReturnValue({
      ...mockState,
      canEdit: true,
      showReview: true,
      isSubmitting: true
    });
    render(<FiveAreasPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByText('Submitting...')).toBeTruthy();
  });
});
