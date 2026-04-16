import type { ReviewItem } from '@milobedini/shared-types';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: mockPush }
}));

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => <Text>{name}</Text> };
});

jest.mock('@/utils/moduleIcons', () => ({
  getModuleDisplayTitle: (title: string) => title
}));

const NeedsAttentionSection = require('./NeedsAttentionSection').default;

const makeItem = (overrides: Partial<ReviewItem> = {}): ReviewItem =>
  ({
    assignmentId: 'assign-1',
    moduleId: 'mod-1',
    moduleTitle: 'PHQ-9',
    moduleType: 'questionnaire',
    patientName: 'Jane Doe',
    attemptCount: 1,
    attentionPriority: 'high',
    attentionReason: 'severe_score',
    latestAttempt: {
      attemptId: 'att-1',
      totalScore: 22,
      scoreBandLabel: 'Severe',
      iteration: 1
    },
    ...overrides
  }) as ReviewItem;

describe('NeedsAttentionSection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when items list is empty', () => {
    const { toJSON } = render(<NeedsAttentionSection items={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders section header with item count', () => {
    render(<NeedsAttentionSection items={[makeItem()]} />);

    expect(screen.getByText('Needs Attention (1)')).toBeTruthy();
  });

  it('renders patient name and module title', () => {
    render(<NeedsAttentionSection items={[makeItem()]} />);

    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText(/PHQ-9/)).toBeTruthy();
  });

  it('renders score when available', () => {
    render(<NeedsAttentionSection items={[makeItem()]} />);

    expect(screen.getByText(/22/)).toBeTruthy();
  });

  it('renders reason label for severe_score', () => {
    render(<NeedsAttentionSection items={[makeItem({ attentionReason: 'severe_score' })]} />);

    expect(screen.getByText('Severe score')).toBeTruthy();
  });

  it('renders reason label for overdue', () => {
    render(<NeedsAttentionSection items={[makeItem({ attentionReason: 'overdue' })]} />);

    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  it('renders reason label for score_regression', () => {
    render(<NeedsAttentionSection items={[makeItem({ attentionReason: 'score_regression' })]} />);

    expect(screen.getByText('Score worsening')).toBeTruthy();
  });

  it('renders reason label for first_submission', () => {
    render(<NeedsAttentionSection items={[makeItem({ attentionReason: 'first_submission' })]} />);

    expect(screen.getByText('First submission')).toBeTruthy();
  });

  it('navigates to review detail on press', () => {
    render(<NeedsAttentionSection items={[makeItem()]} />);

    fireEvent.press(screen.getByText('Jane Doe'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/review/[id]',
      params: { id: 'att-1', headerTitle: 'Jane Doe' }
    });
  });

  it('renders multiple items', () => {
    const items = [
      makeItem({ assignmentId: 'a1', patientName: 'Alice' }),
      makeItem({ assignmentId: 'a2', patientName: 'Bob' })
    ];
    render(<NeedsAttentionSection items={items} />);

    expect(screen.getByText('Needs Attention (2)')).toBeTruthy();
    expect(screen.getByText('Alice')).toBeTruthy();
    expect(screen.getByText('Bob')).toBeTruthy();
  });
});
