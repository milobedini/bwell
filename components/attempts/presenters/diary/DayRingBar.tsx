import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { dateISO, dayLabel } from '@/utils/activityHelpers';

import { ProgressRing } from './ProgressRing';

type DayRingBarProps = {
  days: Date[];
  activeDayISO: string;
  slotFillCounts: Record<string, number>;
  totalSlots: number;
  onSelectDay: (iso: string) => void;
};

const DayRingBar = memo(({ days, activeDayISO, slotFillCounts, totalSlots, onSelectDay }: DayRingBarProps) => {
  const handlePress = useCallback((iso: string) => () => onSelectDay(iso), [onSelectDay]);

  return (
    <View
      style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(30,42,69,0.6)' }}
      className="flex-row items-center justify-between bg-sway-dark px-4 pb-4 pt-3"
    >
      {days.map((d) => {
        const iso = dateISO(d);
        return (
          <ProgressRing
            key={iso}
            dateNumber={d.getDate()}
            dayLabel={dayLabel(d)}
            filledCount={slotFillCounts[iso] ?? 0}
            totalCount={totalSlots}
            isActive={iso === activeDayISO}
            onPress={handlePress(iso)}
          />
        );
      })}
    </View>
  );
});

DayRingBar.displayName = 'DayRingBar';
export default DayRingBar;
