import { fireEvent, render, screen } from '@testing-library/react-native';

import GoalCard from './GoalCard';

const baseProps = {
  index: 0,
  goalText: 'Be calmer',
  rating: 7,
  isReRating: false,
  canEdit: false,
  previousRatings: [],
  onGoalTextChange: jest.fn(),
  onRatingChange: jest.fn(),
  onRemove: jest.fn()
};

describe('GoalCard', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── View mode ──

  it('renders goal text in view mode', () => {
    render(<GoalCard {...baseProps} />);
    expect(screen.getByText('Be calmer')).toBeTruthy();
    expect(screen.getByText('Goal 1')).toBeTruthy();
  });

  it('renders dash when goalText is empty in view mode', () => {
    render(<GoalCard {...baseProps} goalText="" />);
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('shows rating value in view mode (non-reRating)', () => {
    render(<GoalCard {...baseProps} />);
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('Rating')).toBeTruthy();
  });

  it('does not show remove button in view mode', () => {
    render(<GoalCard {...baseProps} />);
    expect(screen.queryByText('Remove')).toBeNull();
  });

  // ── Edit mode ──

  it('renders text input in edit mode', () => {
    render(<GoalCard {...baseProps} canEdit />);
    expect(screen.getByPlaceholderText('What would you like to achieve?')).toBeTruthy();
  });

  it('shows remove button in edit mode (non-reRating)', () => {
    render(<GoalCard {...baseProps} canEdit />);
    expect(screen.getByText('Remove')).toBeTruthy();
  });

  it('fires onRemove when remove is pressed', () => {
    render(<GoalCard {...baseProps} canEdit />);
    fireEvent.press(screen.getByText('Remove'));
    expect(baseProps.onRemove).toHaveBeenCalledTimes(1);
  });

  it('hides remove button during re-rating', () => {
    render(<GoalCard {...baseProps} canEdit isReRating />);
    expect(screen.queryByText('Remove')).toBeNull();
  });

  it('shows text input placeholder in edit mode', () => {
    render(<GoalCard {...baseProps} canEdit goalText="" />);
    expect(screen.getByPlaceholderText('What would you like to achieve?')).toBeTruthy();
  });

  // ── Re-rating view mode ──

  it('renders rating history in view mode when re-rating', () => {
    render(
      <GoalCard
        {...baseProps}
        isReRating
        previousRatings={[{ date: '2026-01-01', ratings: [5] }]}
        currentDate="2026-02-01"
      />
    );
    expect(screen.getByText('Rating history')).toBeTruthy();
  });

  // ── Re-rating edit mode ──

  it('shows previous ratings timeline in edit re-rating mode', () => {
    render(<GoalCard {...baseProps} canEdit isReRating previousRatings={[{ date: '2026-01-01', ratings: [5] }]} />);
    expect(screen.getByText('Previous ratings')).toBeTruthy();
    expect(screen.getByText('New rating')).toBeTruthy();
  });

  it('shows goal text as read-only during re-rating edit', () => {
    render(<GoalCard {...baseProps} canEdit isReRating />);
    // Should NOT have the text input placeholder
    expect(screen.queryByPlaceholderText('What would you like to achieve?')).toBeNull();
    // Should show the text in a read-only view
    expect(screen.getByText('Be calmer')).toBeTruthy();
  });

  // ── Goal numbering ──

  it('displays correct goal number for index 2', () => {
    render(<GoalCard {...baseProps} index={2} />);
    expect(screen.getByText('Goal 3')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });
});
