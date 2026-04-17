import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';

import ErrorComponent, { ErrorTypes } from './ErrorComponent';

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  return {
    Redirect: (props: { href: string }) => <View testID="redirect" {...props} />
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: ReactNode }) => <View {...props}>{children}</View>
  };
});

jest.mock('lottie-react-native', () => 'LottieView');

describe('ErrorComponent', () => {
  it('renders Redirect when redirectLogin is true', () => {
    render(<ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} redirectLogin />);
    expect(screen.getByTestId('redirect')).toBeTruthy();
  });

  it('renders "No content available" for NO_CONTENT', () => {
    render(<ErrorComponent errorType={ErrorTypes.NO_CONTENT} />);
    expect(screen.getByText('No content available')).toBeTruthy();
  });

  it('renders "Resource not found" for NOT_FOUND', () => {
    render(<ErrorComponent errorType={ErrorTypes.NOT_FOUND} />);
    expect(screen.getByText('Resource not found')).toBeTruthy();
  });

  it('renders "Unauthorized access" for UNAUTHORIZED', () => {
    render(<ErrorComponent errorType={ErrorTypes.UNAUTHORIZED} />);
    expect(screen.getByText('Unauthorized access')).toBeTruthy();
  });

  it('renders "Validation error occurred" for VALIDATION_ERROR', () => {
    render(<ErrorComponent errorType={ErrorTypes.VALIDATION_ERROR} />);
    expect(screen.getByText('Validation error occurred')).toBeTruthy();
  });

  it('renders "Something went wrong" for GENERAL_ERROR', () => {
    render(<ErrorComponent errorType={ErrorTypes.GENERAL_ERROR} />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('renders "Unknown error occurred" for an unknown error type', () => {
    render(<ErrorComponent errorType={'SomeRandomError' as ErrorTypes} />);
    expect(screen.getByText('Unknown error occurred')).toBeTruthy();
  });
});
