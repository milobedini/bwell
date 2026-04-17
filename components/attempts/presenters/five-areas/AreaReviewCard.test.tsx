import { Colors } from '@/constants/Colors';
import { fireEvent, render, screen } from '@testing-library/react-native';

import AreaReviewCard from './AreaReviewCard';
import type { AreaKey } from './useFiveAreasState';

jest.mock('sonner-native', () => ({ toast: { error: jest.fn(), success: jest.fn(), loading: jest.fn() } }));
jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(), notificationAsync: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }), useLocalSearchParams: () => ({}) }));
jest.mock('@/hooks/useAttempts', () => ({
  useSaveModuleAttempt: () => ({ mutateSilently: jest.fn(), isPending: false }),
  useSubmitAttempt: () => ({ mutate: jest.fn(), isPending: false })
}));
jest.mock('@/components/toast/toastOptions', () => ({ TOAST_DURATIONS: { error: 3000 }, TOAST_STYLES: { error: {} } }));
jest.mock('clsx', () => ({ clsx: (...args: unknown[]) => args.filter(Boolean).join(' ') }));

describe('AreaReviewCard', () => {
  it('renders the area label from AREA_LABELS', () => {
    render(<AreaReviewCard areaKey="thoughts" value="I feel lost" />);

    expect(screen.getByText('Thoughts')).toBeTruthy();
  });

  it('renders the value text', () => {
    render(<AreaReviewCard areaKey="emotions" value="Anxious and sad" />);

    expect(screen.getByText('Anxious and sad')).toBeTruthy();
  });

  it('shows dash when value is empty string', () => {
    render(<AreaReviewCard areaKey="situation" value="" />);

    expect(screen.getByText('—')).toBeTruthy();
  });

  it('fires onPress when provided and pressed', () => {
    const onPress = jest.fn();
    render(<AreaReviewCard areaKey="behaviours" value="Withdrew" onPress={onPress} />);

    fireEvent.press(screen.getByText('Behaviours'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not crash without onPress (renders as View)', () => {
    render(<AreaReviewCard areaKey="physical" value="Tense" />);

    expect(screen.getByText('Physical Sensations')).toBeTruthy();
    expect(screen.getByText('Tense')).toBeTruthy();
  });

  it('uses info colour for reflection area key', () => {
    render(<AreaReviewCard areaKey="reflection" value="Break the cycle" />);

    const label = screen.getByText('Reflection');
    expect(label.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: Colors.primary.info })])
    );
  });

  it('uses bright colour for non-reflection area keys', () => {
    render(<AreaReviewCard areaKey="thoughts" value="Negative" />);

    const label = screen.getByText('Thoughts');
    expect(label.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ color: Colors.sway.bright })]));
  });

  it.each<[AreaKey, string]>([
    ['situation', 'Situation'],
    ['thoughts', 'Thoughts'],
    ['emotions', 'Emotions'],
    ['physical', 'Physical Sensations'],
    ['behaviours', 'Behaviours'],
    ['reflection', 'Reflection']
  ])('renders correct label for %s', (areaKey, expectedLabel) => {
    render(<AreaReviewCard areaKey={areaKey} value="test" />);

    expect(screen.getByText(expectedLabel)).toBeTruthy();
  });
});
