import { fireEvent, render } from '@testing-library/react-native';

import MetricStepper from './MetricStepper';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light' }
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return {
    ...Reanimated,
    useAnimatedStyle: (fn: () => object) => fn(),
    useReducedMotion: () => false
  };
});

describe('MetricStepper', () => {
  it('renders null value as dash', () => {
    const { getByText } = render(
      <MetricStepper label="Achievement" value={undefined} color="#a78bfa" onChange={jest.fn()} disabled={false} />
    );
    expect(getByText('—')).toBeTruthy();
  });

  it('renders numeric value', () => {
    const { getByText } = render(
      <MetricStepper label="Achievement" value={7} color="#a78bfa" onChange={jest.fn()} disabled={false} />
    );
    expect(getByText('7')).toBeTruthy();
  });

  it('sets value to 5 on first tap when null', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={undefined} color="#a78bfa" onChange={onChange} disabled={false} />
    );
    fireEvent.press(getByLabelText('Increase Achievement'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('increments value by 1', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={7} color="#a78bfa" onChange={onChange} disabled={false} />
    );
    fireEvent.press(getByLabelText('Increase Achievement'));
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('decrements value by 1', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={7} color="#a78bfa" onChange={onChange} disabled={false} />
    );
    fireEvent.press(getByLabelText('Decrease Achievement'));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('clamps at max 10', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={10} color="#a78bfa" onChange={onChange} disabled={false} />
    );
    fireEvent.press(getByLabelText('Increase Achievement'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clamps at min 0', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(
      <MetricStepper label="Achievement" value={0} color="#a78bfa" onChange={onChange} disabled={false} />
    );
    fireEvent.press(getByLabelText('Decrease Achievement'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not respond when disabled', () => {
    const onChange = jest.fn();
    const { queryByLabelText } = render(
      <MetricStepper label="Achievement" value={5} color="#a78bfa" onChange={onChange} disabled={true} />
    );
    expect(queryByLabelText('Increase Achievement')).toBeNull();
  });

  it('renders read-only value without buttons when disabled', () => {
    const { queryByLabelText, getByText } = render(
      <MetricStepper label="Achievement" value={7} color="#a78bfa" onChange={jest.fn()} disabled={true} />
    );
    expect(getByText('7')).toBeTruthy();
    expect(queryByLabelText('Increase Achievement')).toBeNull();
    expect(queryByLabelText('Decrease Achievement')).toBeNull();
  });
});
