import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/Colors';

import ThemedButton from './ThemedButton';
import { ThemedText } from './ThemedText';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught:', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: Colors.sway.dark,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
            gap: 16
          }}
        >
          <ThemedText type="title">Something went wrong</ThemedText>
          <ThemedText>The app encountered an unexpected error. Please try again.</ThemedText>
          <ThemedButton title="Try Again" onPress={this.handleReset} />
        </View>
      );
    }

    return this.props.children;
  }
}
