import { memo } from 'react';
import { View } from 'react-native';
import { Chip } from 'react-native-paper';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Typography';
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
      <Chip
        mode={selected ? 'flat' : 'outlined'}
        selected={selected}
        onPress={onPress}
        style={{
          backgroundColor: selected ? Colors.sway.bright : Colors.sway.buttonBackground
        }}
        textStyle={{
          color: selected ? Colors.sway.dark : 'white',
          fontFamily: Fonts.Bold
        }}
        accessibilityLabel={`${dayLabel(date)} ${date.getDate()}, ${filledCount} of ${slotFills.length} slots filled`}
      >
        {`${dayLabel(date)} ${date.getDate()}`}
      </Chip>
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
