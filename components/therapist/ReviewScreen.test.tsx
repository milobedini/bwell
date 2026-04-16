import { mockQueryResult } from '@/test-utils/mockQueryResult';
import type { ReviewItem } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

// ── Mocks ──

jest.mock('expo-router', () => ({
  router: { push: jest.fn() }
}));

jest.mock('@react-native-vector-icons/material-design-icons', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ name }: { name: string }) => <Text>{name}</Text> };
});

jest.mock('react-native-paper', () => {
  const { Text, Pressable } = require('react-native');
  return {
    Chip: ({ children, onPress }: { children: string; onPress?: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
    IconButton: ({ onPress }: { onPress?: () => void }) => (
      <Pressable onPress={onPress}>
        <Text>filter-icon</Text>
      </Pressable>
    )
  };
});

jest.mock('@/utils/moduleIcons', () => ({
  getModuleDisplayTitle: (title: string) => title,
  getModuleIcon: () => 'clipboard-text'
}));

jest.mock('@/utils/dates', () => ({
  timeAgo: (d: string) => ({ relative: `2d ago`, formatted: d }),
  groupByDate: (items: unknown[]) => (items.length > 0 ? [{ title: 'Today', data: items }] : [])
}));

jest.mock('@/utils/severity', () => ({
  getSeverityColors: () => ({ border: '#FF0000', text: '#FF0000', pillBg: '#330000' })
}));

jest.mock('@/utils/chipStyles', () => ({
  filterChipStyle: () => ({}),
  filterChipTextStyle: () => ({})
}));

const mockUseTherapistReview = jest.fn();
const mockUseTherapistReviewModules = jest.fn();
jest.mock('@/hooks/usePractice', () => ({
  useTherapistReview: (...args: unknown[]) => mockUseTherapistReview(...args),
  useTherapistReviewModules: () => mockUseTherapistReviewModules()
}));

const mockUseClients = jest.fn();
jest.mock('@/hooks/useUsers', () => ({
  useClients: () => mockUseClients()
}));

jest.mock('./NeedsAttentionSection', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: ({ items }: { items: unknown[] }) => <Text>Attention: {items.length}</Text> };
});

jest.mock('./ReviewFilterDrawer', () => {
  const { Text } = require('react-native');
  const mock = ({ visible }: { visible: boolean }) => (visible ? <Text>FilterDrawer</Text> : null);
  mock.DEFAULT_REVIEW_FILTERS = {};
  return { __esModule: true, default: mock, DEFAULT_REVIEW_FILTERS: {} };
});

const ReviewScreen = require('./ReviewScreen').default;

const makeReviewItem = (overrides: Partial<ReviewItem> = {}): ReviewItem =>
  ({
    assignmentId: 'assign-1',
    moduleId: 'mod-1',
    moduleTitle: 'PHQ-9',
    moduleType: 'questionnaire',
    patientName: 'Jane Doe',
    attemptCount: 1,
    latestAttempt: {
      attemptId: 'att-1',
      completedAt: '2026-04-10',
      totalScore: 12,
      scoreBandLabel: 'Moderate',
      iteration: 1
    },
    ...overrides
  }) as ReviewItem;

const setupHooks = (overrides: Record<string, unknown> = {}) => {
  mockUseClients.mockReturnValue(mockQueryResult({ data: [], isSuccess: true, isPending: false }));
  mockUseTherapistReviewModules.mockReturnValue(mockQueryResult({ data: [], isSuccess: true, isPending: false }));
  mockUseTherapistReview.mockReturnValue({
    data: { submissions: [], needsAttention: [], total: 0 },
    isLoading: false,
    isError: false,
    isRefetching: false,
    refetch: jest.fn(),
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    isFetchingNextPage: false,
    isFetching: false,
    ...overrides
  });
};

describe('ReviewScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders loading indicator when isLoading', () => {
    setupHooks({ isLoading: true });
    render(<ReviewScreen />);

    // Should not render main content
    expect(screen.queryByText('submissions')).toBeNull();
  });

  it('renders error component when isError with no data', () => {
    setupHooks({ isError: true, data: { submissions: [], needsAttention: [], total: 0 } });
    render(<ReviewScreen />);

    expect(screen.getByText(/went wrong|error/i)).toBeTruthy();
  });

  it('renders empty state when no submissions and not fetching', () => {
    setupHooks();
    render(<ReviewScreen />);

    expect(screen.getByText('No submissions yet')).toBeTruthy();
    expect(screen.getByText('Completed work from your patients will appear here')).toBeTruthy();
  });

  it('renders submission count', () => {
    setupHooks({
      data: {
        submissions: [makeReviewItem()],
        needsAttention: [],
        total: 1
      }
    });
    render(<ReviewScreen />);

    expect(screen.getByText('1 submission')).toBeTruthy();
  });

  it('renders plural submission count', () => {
    setupHooks({
      data: {
        submissions: [makeReviewItem(), makeReviewItem({ assignmentId: 'a2' })],
        needsAttention: [],
        total: 2
      }
    });
    render(<ReviewScreen />);

    expect(screen.getByText('2 submissions')).toBeTruthy();
  });

  it('renders needs attention section when items exist', () => {
    setupHooks({
      data: {
        submissions: [makeReviewItem()],
        needsAttention: [makeReviewItem({ assignmentId: 'att-attn' })],
        total: 1
      }
    });
    render(<ReviewScreen />);

    expect(screen.getByText('Attention: 1')).toBeTruthy();
  });

  it('renders sort chips', () => {
    setupHooks({
      data: { submissions: [makeReviewItem()], needsAttention: [], total: 1 }
    });
    render(<ReviewScreen />);

    expect(screen.getByText('Newest')).toBeTruthy();
    expect(screen.getByText('Oldest')).toBeTruthy();
    expect(screen.getByText('Severity')).toBeTruthy();
  });

  it('renders review list item with patient name and title', () => {
    setupHooks({
      data: { submissions: [makeReviewItem()], needsAttention: [], total: 1 }
    });
    render(<ReviewScreen />);

    expect(screen.getByText('PHQ-9')).toBeTruthy();
    expect(screen.getByText('Jane Doe')).toBeTruthy();
  });

  it('renders score pill for items with totalScore', () => {
    setupHooks({
      data: { submissions: [makeReviewItem()], needsAttention: [], total: 1 }
    });
    render(<ReviewScreen />);

    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('Moderate')).toBeTruthy();
  });
});
