import { fireEvent, render } from '@testing-library/react-native';

import { ProgressRing } from './ProgressRing';

describe('ProgressRing', () => {
  it('renders with 0 fill', () => {
    const { getByLabelText } = render(
      <ProgressRing dateNumber={7} dayLabel="Mon" filledCount={0} totalCount={9} isActive={false} onPress={jest.fn()} />
    );
    expect(getByLabelText('Mon 7, 0 of 9 slots filled')).toBeTruthy();
  });

  it('renders with partial fill', () => {
    const { getByLabelText } = render(
      <ProgressRing dateNumber={8} dayLabel="Tue" filledCount={4} totalCount={9} isActive={false} onPress={jest.fn()} />
    );
    expect(getByLabelText('Tue 8, 4 of 9 slots filled')).toBeTruthy();
  });

  it('renders active state', () => {
    const { getByLabelText } = render(
      <ProgressRing dateNumber={9} dayLabel="Wed" filledCount={2} totalCount={9} isActive={true} onPress={jest.fn()} />
    );
    expect(getByLabelText('Wed 9, 2 of 9 slots filled')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <ProgressRing dateNumber={7} dayLabel="Mon" filledCount={0} totalCount={9} isActive={false} onPress={onPress} />
    );
    fireEvent.press(getByLabelText('Mon 7, 0 of 9 slots filled'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders day label and date number text', () => {
    const { getByText } = render(
      <ProgressRing
        dateNumber={15}
        dayLabel="Thu"
        filledCount={9}
        totalCount={9}
        isActive={false}
        onPress={jest.fn()}
      />
    );
    expect(getByText('Thu')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
  });
});
