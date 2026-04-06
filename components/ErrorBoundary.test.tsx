import { Text } from 'react-native';
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
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <Text>Safe content</Text>
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe content')).toBeTruthy();
    expect(screen.queryByText('Something went wrong')).toBeNull();
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

    rerender(
      <ErrorBoundary>
        <Text>Recovered</Text>
      </ErrorBoundary>
    );

    fireEvent.press(screen.getByText('Try Again'));

    expect(screen.getByText('Recovered')).toBeTruthy();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });
});
