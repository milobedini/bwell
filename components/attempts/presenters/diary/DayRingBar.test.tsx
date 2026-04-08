import { dateISO, dayLabel } from '@/utils/activityHelpers';
import { fireEvent, render } from '@testing-library/react-native';

import DayRingBar from './DayRingBar';

const makeDays = (): Date[] => {
  const mon = new Date('2025-01-06T00:00:00.000Z');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
};

const TOTAL_SLOTS = 9;

describe('DayRingBar', () => {
  const days = makeDays();
  const activeDayISO = dateISO(days[0]);
  const slotFillCounts: Record<string, number> = {};
  days.forEach((d) => {
    slotFillCounts[dateISO(d)] = 0;
  });

  it('renders 7 day rings', () => {
    const { getAllByRole } = render(
      <DayRingBar
        days={days}
        activeDayISO={activeDayISO}
        slotFillCounts={slotFillCounts}
        totalSlots={TOTAL_SLOTS}
        onSelectDay={jest.fn()}
      />
    );
    expect(getAllByRole('button')).toHaveLength(7);
  });

  it('calls onSelectDay when a ring is tapped', () => {
    const onSelectDay = jest.fn();
    const { getByLabelText } = render(
      <DayRingBar
        days={days}
        activeDayISO={activeDayISO}
        slotFillCounts={slotFillCounts}
        totalSlots={TOTAL_SLOTS}
        onSelectDay={onSelectDay}
      />
    );
    const tuesdayLabel = `${dayLabel(days[1])} ${days[1].getDate()}, 0 of 9 slots filled`;
    fireEvent.press(getByLabelText(tuesdayLabel));
    expect(onSelectDay).toHaveBeenCalledWith(dateISO(days[1]));
  });
});
