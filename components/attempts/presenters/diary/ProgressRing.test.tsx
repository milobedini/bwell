import { fireEvent, render } from '@testing-library/react-native';

import { ProgressRing } from './ProgressRing';

describe('ProgressRing', () => {
  it('renders with 0 fill', () => {
    const { getByLabelText } = render(
      <ProgressRing
        iso="2025-01-07"
        dateNumber={7}
        dayLabel="Mon"
        filledCount={0}
        totalCount={9}
        isActive={false}
        onSelectDay={jest.fn()}
      />
    );
    expect(getByLabelText('Mon 7, 0 of 9 slots filled')).toBeTruthy();
  });

  it('renders with partial fill', () => {
    const { getByLabelText } = render(
      <ProgressRing
        iso="2025-01-08"
        dateNumber={8}
        dayLabel="Tue"
        filledCount={4}
        totalCount={9}
        isActive={false}
        onSelectDay={jest.fn()}
      />
    );
    expect(getByLabelText('Tue 8, 4 of 9 slots filled')).toBeTruthy();
  });

  it('renders active state', () => {
    const { getByLabelText } = render(
      <ProgressRing
        iso="2025-01-09"
        dateNumber={9}
        dayLabel="Wed"
        filledCount={2}
        totalCount={9}
        isActive={true}
        onSelectDay={jest.fn()}
      />
    );
    expect(getByLabelText('Wed 9, 2 of 9 slots filled')).toBeTruthy();
  });

  it('calls onSelectDay with iso when tapped', () => {
    const onSelectDay = jest.fn();
    const { getByLabelText } = render(
      <ProgressRing
        iso="2025-01-07"
        dateNumber={7}
        dayLabel="Mon"
        filledCount={0}
        totalCount={9}
        isActive={false}
        onSelectDay={onSelectDay}
      />
    );
    fireEvent.press(getByLabelText('Mon 7, 0 of 9 slots filled'));
    expect(onSelectDay).toHaveBeenCalledWith('2025-01-07');
  });

  it('renders day label and date number text', () => {
    const { getByText } = render(
      <ProgressRing
        iso="2025-01-15"
        dateNumber={15}
        dayLabel="Thu"
        filledCount={9}
        totalCount={9}
        isActive={false}
        onSelectDay={jest.fn()}
      />
    );
    expect(getByText('Thu')).toBeTruthy();
    expect(getByText('15')).toBeTruthy();
  });
});
