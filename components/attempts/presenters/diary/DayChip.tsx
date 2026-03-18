import { memo } from 'react';
import { View } from 'react-native';
import { SelectableChip } from '@/components/ui/Chip';
import { Colors } from '@/constants/Colors';
import { dayLabel } from '@/utils/activityHelpers';

type DayChipProps = {
  date: Date;
  selected: boolean;
  slotFills: readonly boolean[];
  onPress: () => void;
};

const DOT_SIZE = 4;

const DayChip = memo(({ date, selected, slotFills, onPress }: DayChipProps) => {
  const filledCount = slotFills.filter(Boolean).length;

  return (
    <View style={{ alignItems: 'center' }}>
      <SelectableChip
        label={`${dayLabel(date)} ${date.getDate()}`}
        selected={selected}
        onPress={onPress}
        accessibilityLabel={`${dayLabel(date)} ${date.getDate()}, ${filledCount} of ${slotFills.length} slots filled`}
      />
      <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
        {slotFills.map((filled, i) => (
          <View
            key={i}
            style={{
              width: DOT_SIZE,
              height: DOT_SIZE,
              borderRadius: DOT_SIZE / 2,
              backgroundColor: filled ? Colors.sway.bright : Colors.sway.darkGrey
            }}
          />
        ))}
      </View>
    </View>
  );
});

DayChip.displayName = 'DayChip';

export default DayChip;
