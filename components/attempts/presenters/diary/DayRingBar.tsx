import { memo } from 'react';
import { ScrollView, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { dateISO, dayLabel } from '@/utils/activityHelpers';

import { ProgressRing } from './ProgressRing';

type DayRingBarProps = {
  days: Date[];
  activeDayISO: string;
  slotFillCounts: Record<string, number>;
  totalSlots: number;
  onSelectDay: (iso: string) => void;
};

const DayRingBar = memo(({ days, activeDayISO, slotFillCounts, totalSlots, onSelectDay }: DayRingBarProps) => (
  <View style={{ borderBottomWidth: 1, borderBottomColor: Colors.chip.pillBorder }} className="bg-sway-dark">
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16
      }}
    >
      {days.map((d) => {
        const iso = dateISO(d);
        return (
          <ProgressRing
            key={iso}
            iso={iso}
            dateNumber={d.getDate()}
            dayLabel={dayLabel(d)}
            filledCount={slotFillCounts[iso] ?? 0}
            totalCount={totalSlots}
            isActive={iso === activeDayISO}
            onSelectDay={onSelectDay}
          />
        );
      })}
    </ScrollView>
  </View>
));

DayRingBar.displayName = 'DayRingBar';
export default DayRingBar;
