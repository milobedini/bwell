import type { ReactNode } from 'react';
import PracticeScreen from '@/components/practice/PracticeScreen';
import { render, screen } from '@testing-library/react-native';

// ── Mocks ──

jest.mock('@/hooks/usePractice', () => ({
  useMyPractice: jest.fn()
}));

jest.mock('./PracticeItem', () => {
  const { View, Text } = require('react-native');
  return (props: { item: { moduleTitle: string } }) => (
    <View testID="practice-item">
      <Text>{props.item.moduleTitle}</Text>
    </View>
  );
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
    sway: { bright: '#18cdba', darkGrey: '#a6adbb' }
  }
}));

const { useMyPractice } = require('@/hooks/usePractice');

// ── Helpers ──

const makePracticeItem = (id: string, title: string) => ({
  assignmentId: id,
  moduleTitle: title,
  moduleId: `mod-${id}`,
  moduleType: 'questionnaire',
  status: 'not_started'
});

const setup = ({
  isPending = false,
  isFetching = false,
  data = null as {
    today: ReturnType<typeof makePracticeItem>[];
    thisWeek: ReturnType<typeof makePracticeItem>[];
    upcoming: ReturnType<typeof makePracticeItem>[];
    recentlyCompleted: ReturnType<typeof makePracticeItem>[];
  } | null
} = {}) => {
  useMyPractice.mockReturnValue({ data, isPending, isFetching, refetch: jest.fn() });
  render(<PracticeScreen />);
};

// ── Tests ──

describe('PracticeScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading when isPending', () => {
    setup({ isPending: true });
    expect(screen.getByTestId('loading')).toBeTruthy();
  });

  it('shows "All caught up" empty state when no data and not fetching', () => {
    setup({
      isPending: false,
      isFetching: false,
      data: { today: [], thisWeek: [], upcoming: [], recentlyCompleted: [] }
    });
    expect(screen.getByTestId('empty-state')).toBeTruthy();
    expect(screen.getByText('All caught up')).toBeTruthy();
  });

  it('renders section headers', () => {
    setup({
      data: {
        today: [makePracticeItem('1', 'PHQ-9')],
        thisWeek: [makePracticeItem('2', 'GAD-7')],
        upcoming: [],
        recentlyCompleted: []
      }
    });
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('This Week')).toBeTruthy();
  });

  it('renders PracticeItem for each item', () => {
    setup({
      data: {
        today: [makePracticeItem('1', 'PHQ-9'), makePracticeItem('2', 'GAD-7')],
        thisWeek: [],
        upcoming: [],
        recentlyCompleted: []
      }
    });
    expect(screen.getAllByTestId('practice-item')).toHaveLength(2);
    expect(screen.getByText('PHQ-9')).toBeTruthy();
    expect(screen.getByText('GAD-7')).toBeTruthy();
  });
});
