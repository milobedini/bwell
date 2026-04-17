import type { ReactNode } from 'react';
import JourneyScreen from '@/components/journey/JourneyScreen';
import { mockQueryResult } from '@/test-utils/mockQueryResult';
import { render, screen } from '@testing-library/react-native';

// ── Mocks ──

jest.mock('@/hooks/usePractice', () => ({
  useMyPracticeHistory: jest.fn()
}));

jest.mock('@/hooks/useScoreTrends', () => ({
  useScoreTrends: jest.fn()
}));

jest.mock('../practice/PracticeItem', () => {
  const { View, Text } = require('react-native');
  return (props: { item: { moduleTitle: string } }) => (
    <View testID="practice-item">
      <Text>{props.item.moduleTitle}</Text>
    </View>
  );
});

jest.mock('../ui/BarSparkline', () => {
  const { View } = require('react-native');
  return () => <View testID="sparkline" />;
});

jest.mock('../ui/EmptyState', () => {
  const { View, Text } = require('react-native');
  return (props: { title: string }) => (
    <View testID="empty-state">
      <Text>{props.title}</Text>
    </View>
  );
});

jest.mock('../LoadingScreen', () => ({
  LoadingIndicator: () => {
    const { View } = require('react-native');
    return <View testID="loading" />;
  }
}));

jest.mock('../ContentContainer', () => {
  const { View } = require('react-native');
  return ({ children }: { children: ReactNode }) => <View>{children}</View>;
});

jest.mock('../ThemedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children }: { children: ReactNode }) => <Text>{children}</Text>
  };
});

jest.mock('@/constants/Colors', () => ({
  Colors: {
    sway: { bright: '#18cdba', darkGrey: '#a6adbb' },
    primary: { success: '#76AB70', error: '#FF6D5E' },
    chip: { darkCard: '#262E42' }
  }
}));

const { useMyPracticeHistory } = require('@/hooks/usePractice');
const { useScoreTrends } = require('@/hooks/useScoreTrends');

// ── Helpers ──

const basePracticeHistory = {
  items: [],
  pages: [],
  nextCursor: null
};

const setup = ({
  isLoading = false,
  isFetching = false,
  items = [] as { assignmentId: string; moduleTitle: string }[],
  trends = [] as {
    moduleId: string;
    moduleTitle: string;
    latestScore: number;
    previousScore: number | null;
    sparkline: number[];
  }[]
} = {}) => {
  useMyPracticeHistory.mockReturnValue({
    data: { ...basePracticeHistory, items },
    isLoading,
    isFetching,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: jest.fn()
  });
  useScoreTrends.mockReturnValue(mockQueryResult({ data: { trends } }));
  render(<JourneyScreen />);
};

// ── Tests ──

describe('JourneyScreen', () => {
  it('shows loading indicator when isLoading is true', () => {
    setup({ isLoading: true });
    expect(screen.getByTestId('loading')).toBeTruthy();
  });

  it('shows empty state when no items and not fetching', () => {
    setup({ isLoading: false, isFetching: false, items: [] });
    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('No history yet')).toBeTruthy();
  });

  it('shows "Your Journey" header', () => {
    setup({ items: [{ assignmentId: 'a1', moduleTitle: 'PHQ-9' }] });
    expect(screen.getByText('Your Journey')).toBeTruthy();
  });

  it('shows "Score Trends" section when trends exist', () => {
    setup({
      items: [{ assignmentId: 'a1', moduleTitle: 'Activity Diary' }],
      trends: [{ moduleId: 'm1', moduleTitle: 'PHQ-9', latestScore: 5, previousScore: 8, sparkline: [8, 5] }]
    });
    expect(screen.getByText('Score Trends')).toBeTruthy();
    expect(screen.getByText('PHQ-9')).toBeTruthy();
  });

  it('renders practice items', () => {
    setup({
      items: [
        { assignmentId: 'a1', moduleTitle: 'Activity Diary' },
        { assignmentId: 'a2', moduleTitle: 'Thought Record' }
      ]
    });
    expect(screen.getAllByTestId('practice-item')).toHaveLength(2);
    expect(screen.getByText('Activity Diary')).toBeTruthy();
    expect(screen.getByText('Thought Record')).toBeTruthy();
  });
});
