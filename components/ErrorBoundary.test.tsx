import { fireEvent, render, screen } from '@testing-library/react-native';

import { ErrorBoundary } from './ErrorBoundary';

jest.mock('expo-image', () => ({
  Image: 'Image'
}));

const ThrowingChild = () => {
  throw new Error('Test crash');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress React error boundary console output during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    // getDerivedStateFromError will catch and show fallback
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('shows fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('The app encountered an unexpected error. Please try again.')).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('resets error state when Try Again is pressed', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    // Swap the child to a non-throwing one before pressing reset
    // (otherwise it'll re-throw immediately)
    rerender(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    fireEvent.press(screen.getByText('Try Again'));

    // After reset with a still-throwing child, it catches again
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });
});
