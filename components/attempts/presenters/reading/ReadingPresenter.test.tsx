import type { AttemptDetailResponseItem } from '@milobedini/shared-types';
import { render, screen } from '@testing-library/react-native';

import ReadingPresenter from './ReadingPresenter';

// ── Mocks ──

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ back: jest.fn() }))
}));

jest.mock('@/hooks/useAttempts', () => ({
  useSubmitAttempt: jest.fn(() => ({ mutate: jest.fn(), isPending: false }))
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const Animated = { ScrollView: View, createAnimatedComponent: (c: unknown) => c };
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: () => ({ value: 0 }),
    useAnimatedScrollHandler: () => jest.fn()
  };
});

jest.mock('react-native-markdown-display', () => {
  const { Text } = require('react-native');
  return (props: { children: string }) => <Text testID="markdown">{props.children}</Text>;
});

jest.mock('react-native-fit-image', () => 'FitImage');

jest.mock('./ReadingProgressBar', () => {
  const { View } = require('react-native');
  return () => <View testID="progress-bar" />;
});

jest.mock('@/components/toast/toastOptions', () => ({ renderErrorToast: jest.fn() }));

// ── Helpers ──

const makeAttempt = (overrides: Record<string, unknown> = {}) =>
  ({
    _id: 'att-1',
    moduleSnapshot: { title: 'Reading', disclaimer: '', content: '# Hello World' },
    readerNote: '',
    status: 'active',
    ...overrides
  }) as unknown as AttemptDetailResponseItem;

// ── Tests ──

describe('ReadingPresenter', () => {
  it('shows "No content available." when content is empty', () => {
    render(
      <ReadingPresenter
        attempt={makeAttempt({ moduleSnapshot: { title: 'Reading', disclaimer: '', content: '' } })}
        mode="edit"
      />
    );
    expect(screen.getByText('No content available.')).toBeTruthy();
  });

  it('renders markdown content', () => {
    render(<ReadingPresenter attempt={makeAttempt()} mode="edit" />);
    expect(screen.getByTestId('markdown')).toBeTruthy();
    expect(screen.getByText('# Hello World')).toBeTruthy();
  });

  // ── Edit mode ──

  it('shows progress bar in edit mode', () => {
    render(<ReadingPresenter attempt={makeAttempt()} mode="edit" />);
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });

  it('shows "Personal Note" label and text input in edit mode', () => {
    render(<ReadingPresenter attempt={makeAttempt()} mode="edit" />);
    expect(screen.getByText('Personal Note')).toBeTruthy();
    expect(screen.getByPlaceholderText('Add a personal note or reflection...')).toBeTruthy();
  });

  it('shows "Mark as Complete" button in edit mode', () => {
    render(<ReadingPresenter attempt={makeAttempt()} mode="edit" />);
    expect(screen.getByText('Mark as Complete')).toBeTruthy();
  });

  // ── View mode ──

  it('does NOT show progress bar in view mode', () => {
    render(<ReadingPresenter attempt={makeAttempt()} mode="view" />);
    expect(screen.queryByTestId('progress-bar')).toBeNull();
  });

  it('does NOT show note input or submit button in view mode', () => {
    render(<ReadingPresenter attempt={makeAttempt()} mode="view" />);
    expect(screen.queryByPlaceholderText('Add a personal note or reflection...')).toBeNull();
    expect(screen.queryByText('Mark as Complete')).toBeNull();
  });

  it('shows reader note with "Personal Note" header in view mode', () => {
    render(<ReadingPresenter attempt={makeAttempt({ readerNote: 'My reflection' })} mode="view" />);
    expect(screen.getByText('Personal Note')).toBeTruthy();
    expect(screen.getByText('My reflection')).toBeTruthy();
  });

  it('shows "{name}\'s Note" header when patientName is provided in view mode', () => {
    render(<ReadingPresenter attempt={makeAttempt({ readerNote: 'Some note' })} mode="view" patientName="Alice" />);
    expect(screen.getByText("Alice's Note")).toBeTruthy();
  });

  it('does NOT show reader note section when readerNote is empty in view mode', () => {
    render(<ReadingPresenter attempt={makeAttempt({ readerNote: '' })} mode="view" />);
    expect(screen.queryByText('Personal Note')).toBeNull();
  });

  // ── Disclaimer ──

  it('shows disclaimer when moduleSnapshot.disclaimer exists', () => {
    render(
      <ReadingPresenter
        attempt={makeAttempt({
          moduleSnapshot: { title: 'Reading', disclaimer: 'For informational purposes only.', content: '# Hi' }
        })}
        mode="view"
      />
    );
    expect(screen.getByText('For informational purposes only.')).toBeTruthy();
  });

  it('does NOT show disclaimer when moduleSnapshot.disclaimer is empty', () => {
    render(<ReadingPresenter attempt={makeAttempt()} mode="view" />);
    expect(screen.queryByText('For informational purposes only.')).toBeNull();
  });
});
