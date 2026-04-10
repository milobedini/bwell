import { type ReactNode } from 'react';
import { render } from '@testing-library/react-native';

import MoodSlider from './MoodSlider';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return {
    ...Reanimated,
    useAnimatedStyle: (fn: () => object) => fn()
  };
});

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureDetector: ({ children }: { children: ReactNode }) => children,
    Gesture: {
      Pan: () => ({
        onStart: () => ({
          onUpdate: () => ({ onEnd: () => ({}) }),
          onEnd: () => ({})
        }),
        onUpdate: () => ({ onEnd: () => ({}) }),
        onEnd: () => ({})
      })
    },
    GestureHandlerRootView: View
  };
});

describe('MoodSlider', () => {
  it('renders with null value', () => {
    const { getByLabelText } = render(<MoodSlider value={undefined} onChange={jest.fn()} disabled={false} />);
    expect(getByLabelText('Mood slider, not set')).toBeTruthy();
  });

  it('renders with a value', () => {
    const { getByLabelText, getByText } = render(<MoodSlider value={65} onChange={jest.fn()} disabled={false} />);
    expect(getByLabelText('Mood slider, value 65')).toBeTruthy();
    expect(getByText('65')).toBeTruthy();
  });

  it('renders Low and High labels', () => {
    const { getByText } = render(<MoodSlider value={50} onChange={jest.fn()} disabled={false} />);
    expect(getByText('Low')).toBeTruthy();
    expect(getByText('High')).toBeTruthy();
  });

  it('renders read-only bar when disabled', () => {
    const { getByLabelText } = render(<MoodSlider value={72} onChange={jest.fn()} disabled={true} />);
    expect(getByLabelText('Mood: 72')).toBeTruthy();
  });

  it('renders "Mood: not set" label when disabled with no value', () => {
    const { getByLabelText } = render(<MoodSlider value={undefined} onChange={jest.fn()} disabled={true} />);
    expect(getByLabelText('Mood: not set')).toBeTruthy();
  });

  it('displays dash when value is undefined', () => {
    const { getByText } = render(<MoodSlider value={undefined} onChange={jest.fn()} disabled={false} />);
    expect(getByText('—')).toBeTruthy();
  });
});
