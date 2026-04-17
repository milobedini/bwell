import { fireEvent, render, screen } from '@testing-library/react-native';

import EmptyState from './EmptyState';

jest.mock('lottie-react-native', () => 'LottieView');

describe('EmptyState', () => {
  it('renders the icon and title', () => {
    render(<EmptyState icon="magnify" title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(<EmptyState icon="magnify" title="Nothing here" subtitle="Try again later" />);
    expect(screen.getByText('Try again later')).toBeTruthy();
  });

  it('does not render subtitle when omitted', () => {
    render(<EmptyState icon="magnify" title="Nothing here" />);
    expect(screen.queryByText('Try again later')).toBeNull();
  });

  it('renders action button and fires onPress', () => {
    const onPress = jest.fn();
    render(<EmptyState icon="magnify" title="Nothing here" action={{ label: 'Retry', onPress }} />);
    const button = screen.getByText('Retry');
    expect(button).toBeTruthy();
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not render a button when no action is provided', () => {
    render(<EmptyState icon="magnify" title="Nothing here" />);
    expect(screen.queryByText('Retry')).toBeNull();
  });
});
