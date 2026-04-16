import type { AttemptDetailResponseItem } from '@milobedini/shared-types';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('react-native-keyboard-controller', () => {
  const { ScrollView } = require('react-native');
  return { KeyboardAwareScrollView: ScrollView };
});

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => <Text>{name}</Text> };
});

const mockState = {
  canEdit: false,
  isReRating: false,
  goals: [
    { _uid: 'g1', goalText: 'Exercise more', rating: 3 },
    { _uid: 'g2', goalText: 'Sleep better', rating: 5 }
  ],
  reflection: 'Feeling better',
  previousRatings: {},
  isDirty: false,
  isSaving: false,
  isSubmitting: false,
  canAddGoal: true,
  canSubmit: true,
  save: jest.fn(),
  addGoal: jest.fn(),
  removeGoal: jest.fn(),
  updateGoalText: jest.fn(),
  updateGoalRating: jest.fn(),
  updateReflection: jest.fn(),
  handleSubmit: jest.fn()
};

const mockUseGeneralGoalsState = jest.fn((_params?: unknown) => mockState);
jest.mock('./useGeneralGoalsState', () => ({
  useGeneralGoalsState: (params: unknown) => mockUseGeneralGoalsState(params)
}));

jest.mock('./GoalCard', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ goalText, index }: { goalText: string; index: number }) => (
      <Text>
        Goal {index}: {goalText}
      </Text>
    )
  };
});

jest.mock('./ReflectionSection', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ reflection }: { reflection: string }) => <Text>Reflection: {reflection}</Text>
  };
});

const GeneralGoalsPresenter = require('./GeneralGoalsPresenter').default;

const makeAttempt = (overrides: Partial<AttemptDetailResponseItem> = {}): AttemptDetailResponseItem =>
  ({
    _id: 'att-1',
    moduleType: 'general_goals',
    status: 'submitted',
    createdAt: '2026-04-01',
    ...overrides
  }) as AttemptDetailResponseItem;

describe('GeneralGoalsPresenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGeneralGoalsState.mockReturnValue({ ...mockState, canEdit: false });
  });

  // ── View mode ──

  it('renders goal cards in view mode', () => {
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="view" />);

    expect(screen.getByText('Goal 0: Exercise more')).toBeTruthy();
    expect(screen.getByText('Goal 1: Sleep better')).toBeTruthy();
  });

  it('renders reflection in view mode', () => {
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="view" />);

    expect(screen.getByText('Reflection: Feeling better')).toBeTruthy();
  });

  it('renders title with patient name when provided', () => {
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="view" patientName="Alice" />);

    expect(screen.getByText("Alice's Goals")).toBeTruthy();
  });

  it('renders generic title without patient name', () => {
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="view" />);

    expect(screen.getByText('Goals')).toBeTruthy();
  });

  it('shows in-progress indicator for unsubmitted attempts in view mode', () => {
    const attempt = makeAttempt({ status: 'started' });
    render(<GeneralGoalsPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('This entry is still in progress.')).toBeTruthy();
  });

  it('shows re-rating badge when isReRating', () => {
    mockUseGeneralGoalsState.mockReturnValue({ ...mockState, canEdit: false, isReRating: true });
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="view" />);

    expect(screen.getByText('Re-rating')).toBeTruthy();
  });

  it('shows user note when present', () => {
    const attempt = makeAttempt({ userNote: 'My personal note' });
    render(<GeneralGoalsPresenter attempt={attempt} mode="view" />);

    expect(screen.getByText('My personal note')).toBeTruthy();
  });

  // ── Edit mode ──

  it('renders edit mode header', () => {
    mockUseGeneralGoalsState.mockReturnValue({ ...mockState, canEdit: true });
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByText('Set Your Goals')).toBeTruthy();
    expect(screen.getByText('Add up to 3 goals you would like to work towards.')).toBeTruthy();
  });

  it('renders re-rating header in edit mode', () => {
    mockUseGeneralGoalsState.mockReturnValue({ ...mockState, canEdit: true, isReRating: true });
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByText('Re-rate Your Goals')).toBeTruthy();
  });

  it('renders empty state when no goals in edit mode', () => {
    mockUseGeneralGoalsState.mockReturnValue({ ...mockState, canEdit: true, goals: [] });
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByText('No goals yet')).toBeTruthy();
  });

  it('renders add goal button with count', () => {
    mockUseGeneralGoalsState.mockReturnValue({ ...mockState, canEdit: true });
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByText('Add Goal (2/3)')).toBeTruthy();
  });

  it('calls addGoal on add button press', () => {
    const addGoal = jest.fn();
    mockUseGeneralGoalsState.mockReturnValue({ ...mockState, canEdit: true, addGoal });
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="edit" />);

    fireEvent.press(screen.getByText('Add Goal (2/3)'));
    expect(addGoal).toHaveBeenCalled();
  });

  it('renders Submit button in edit mode', () => {
    mockUseGeneralGoalsState.mockReturnValue({ ...mockState, canEdit: true });
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('shows save indicator when dirty', () => {
    mockUseGeneralGoalsState.mockReturnValue({ ...mockState, canEdit: true, isDirty: true });
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByLabelText('Save changes')).toBeTruthy();
  });

  it('shows saving label when isSaving', () => {
    mockUseGeneralGoalsState.mockReturnValue({ ...mockState, canEdit: true, isDirty: true, isSaving: true });
    render(<GeneralGoalsPresenter attempt={makeAttempt()} mode="edit" />);

    expect(screen.getByLabelText('Saving')).toBeTruthy();
  });
});
