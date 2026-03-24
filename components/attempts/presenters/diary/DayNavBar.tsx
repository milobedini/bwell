import { memo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { dateISO } from '@/utils/activityHelpers';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

import DayChip from './DayChip';

type DayNavBarProps = {
  days: Date[];
  activeDayISO: string;
  slotFillsByDay: Record<string, boolean[]>;
  hasDirtyChanges: boolean;
  onSelectDay: (iso: string) => void;
  onSave: () => void;
};

const DayNavBar = ({ days, activeDayISO, slotFillsByDay, hasDirtyChanges, onSelectDay, onSave }: DayNavBarProps) => (
  <View
    style={{ borderBottomWidth: 1, borderBottomColor: Colors.chip.darkCard }}
    className="flex-row items-center justify-center bg-sway-dark pb-2 pl-4 pr-2 pt-1"
  >
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 0, gap: 8 }}
      className="flex-1"
    >
      {days.map((d) => {
        const iso = dateISO(d);
        return (
          <DayChip
            key={iso}
            date={d}
            selected={iso === activeDayISO}
            slotFills={slotFillsByDay[iso] ?? []}
            onPress={() => onSelectDay(iso)}
          />
        );
      })}
    </ScrollView>
    {hasDirtyChanges && (
      <Pressable
        onPress={onSave}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        className="ml-2 rounded-full p-2"
        style={{ backgroundColor: Colors.chip.green }}
        accessibilityLabel="Save changes"
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="content-save" size={18} color={Colors.sway.dark} />
      </Pressable>
    )}
  </View>
);

export default memo(DayNavBar);
