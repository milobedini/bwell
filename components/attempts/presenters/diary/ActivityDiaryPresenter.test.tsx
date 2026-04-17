import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('./useDiaryState', () => ({ useDiaryState: jest.fn() }));
jest.mock('./useDiaryNavigation', () => ({ useDiaryNavigation: jest.fn() }));
jest.mock('./DayRingBar', () => {
  const { View } = require('react-native');
  return (_props: Record<string, unknown>) => <View testID="day-ring-bar" />;
});
jest.mock('./DiaryHeader', () => {
  const { View } = require('react-native');
  return (_props: Record<string, unknown>) => <View testID="diary-header" />;
});
jest.mock('./DiaryFooter', () => {
  const { View } = require('react-native');
  return (_props: Record<string, unknown>) => <View testID="diary-footer" />;
});
jest.mock('./WeeklySummary', () => {
  const { View } = require('react-native');
  return (_props: Record<string, unknown>) => <View testID="weekly-summary" />;
});
jest.mock('./SlotAccordionRow', () => {
  const { Pressable, Text } = require('react-native');
  return (props: Record<string, unknown>) => (
    <Pressable testID={`slot-row-${props.label}`} onPress={props.onPress as () => void}>
      <Text>{String(props.label)}</Text>
    </Pressable>
  );
});
jest.mock('./SlotAccordionPanel', () => {
  const { View } = require('react-native');
  return (_props: Record<string, unknown>) => <View testID="slot-panel" />;
});
jest.mock('./AnimatedAccordionSlot', () => {
  const { View } = require('react-native');
  return ({ children, isExpanded }: { children: ReactNode; isExpanded: boolean }) =>
    isExpanded ? <View testID="expanded-slot">{children}</View> : <View testID="collapsed-slot">{children}</View>;
});
jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => <Text>{name}</Text> };
});
jest.mock('@/utils/activityHelpers', () => ({
  isSlotFilled: jest.fn(() => false),
  isSlotComplete: jest.fn(() => false)
}));

const { useDiaryState } = require('./useDiaryState');
const { useDiaryNavigation } = require('./useDiaryNavigation');
const ActivityDiaryPresenter = require('./ActivityDiaryPresenter').default;

const mockSlot = {
  label: 'Morning',
  activity: '',
  mood: undefined,
  achievement: undefined,
  closeness: undefined,
  enjoyment: undefined
};

const makeDiaryState = (overrides: Record<string, unknown> = {}) => ({
  days: ['2026-01-01', '2026-01-02'],
  activeDayISO: '2026-01-01',
  setActiveDayISO: jest.fn(),
  slotFillCounts: { '2026-01-01': 3, '2026-01-02': 0 },
  dayRows: Array.from({ length: 9 }, (_, i) => ({
    key: `slot-${i}`,
    value: { ...mockSlot, label: `Slot ${i}` }
  })),
  hasDirtyChanges: false,
  isSaving: false,
  saved: false,
  saveDirty: jest.fn(),
  updateSlot: jest.fn(),
  canEdit: true,
  diary: { totals: {} },
  disclaimerOpen: false,
  setDisclaimerOpen: jest.fn(),
  moduleSnapshot: null,
  updatedAt: null,
  reflectionPrompt: 'How did you feel?',
  userNoteText: '',
  setUserNoteText: jest.fn(),
  setNoteDirty: jest.fn(),
  userNote: '',
  allAnswered: false,
  handleSaveDraft: jest.fn(),
  handleSubmit: jest.fn(),
  router: { back: jest.fn() },
  ...overrides
});

const mockNav = (overrides: Record<string, unknown> = {}) => ({
  expandedSlotIdx: null,
  expandSlot: jest.fn(),
  collapseSlot: jest.fn(),
  ...overrides
});

const mockAttempt = {
  _id: 'attempt-1',
  diary: { totals: {} }
} as unknown as Record<string, unknown>;

describe('ActivityDiaryPresenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDiaryState.mockReturnValue(makeDiaryState());
    useDiaryNavigation.mockReturnValue(mockNav());
  });

  it('renders DayRingBar', () => {
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    expect(screen.getByTestId('day-ring-bar')).toBeTruthy();
  });

  it('renders 9 slot rows when none are expanded', () => {
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    for (let i = 0; i < 9; i++) {
      expect(screen.getByTestId(`slot-row-Slot ${i}`)).toBeTruthy();
    }
  });

  it('renders DiaryHeader', () => {
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    expect(screen.getByTestId('diary-header')).toBeTruthy();
  });

  it('renders DiaryFooter', () => {
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    expect(screen.getByTestId('diary-footer')).toBeTruthy();
  });

  it('renders WeeklySummary', () => {
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    expect(screen.getByTestId('weekly-summary')).toBeTruthy();
  });

  it('shows floating save button when hasDirtyChanges is true', () => {
    useDiaryState.mockReturnValue(makeDiaryState({ hasDirtyChanges: true }));
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    expect(screen.getByLabelText('Save changes')).toBeTruthy();
  });

  it('shows saving indicator when isSaving', () => {
    useDiaryState.mockReturnValue(makeDiaryState({ isSaving: true }));
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    expect(screen.getByLabelText('Saving')).toBeTruthy();
  });

  it('shows saved indicator when saved and no dirty changes', () => {
    useDiaryState.mockReturnValue(makeDiaryState({ saved: true, hasDirtyChanges: false }));
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    expect(screen.getByLabelText('Saved')).toBeTruthy();
  });

  it('does not show floating button when no dirty changes, not saving, and not saved', () => {
    useDiaryState.mockReturnValue(makeDiaryState({ hasDirtyChanges: false, isSaving: false, saved: false }));
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    expect(screen.queryByLabelText('Save changes')).toBeNull();
    expect(screen.queryByLabelText('Saving')).toBeNull();
    expect(screen.queryByLabelText('Saved')).toBeNull();
  });

  it('renders expanded slot panel when a slot is expanded', () => {
    useDiaryNavigation.mockReturnValue(mockNav({ expandedSlotIdx: 0 }));
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    expect(screen.getByTestId('expanded-slot')).toBeTruthy();
    expect(screen.getAllByTestId('slot-panel').length).toBe(9);
  });

  it('hides the SlotAccordionRow for the expanded slot', () => {
    useDiaryNavigation.mockReturnValue(mockNav({ expandedSlotIdx: 0 }));
    render(<ActivityDiaryPresenter attempt={mockAttempt} mode="edit" />);

    // Slot 0 row should be hidden, but slots 1-8 should still show
    expect(screen.queryByTestId('slot-row-Slot 0')).toBeNull();
    expect(screen.getByTestId('slot-row-Slot 1')).toBeTruthy();
  });
});
