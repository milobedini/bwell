import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';

type SlotAccordionRowProps = {
  label: string;
  activityPreview: string;
  isFilled: boolean;
  onPress: () => void;
};

const SlotAccordionRow = memo(({ label, activityPreview, isFilled, onPress }: SlotAccordionRowProps) => {
  const accessibilityLabel = `${label}, ${isFilled ? 'filled' : 'empty'}. Double tap to expand`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="active:opacity-70"
      style={{
        backgroundColor: Colors.chip.darkCard,
        borderRadius: 10,
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        opacity: isFilled ? 1 : 0.6
      }}
    >
      <View className="flex-1 flex-row items-center gap-2">
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: isFilled ? Colors.sway.bright : Colors.chip.dotInactive
          }}
        />
        <ThemedText type="small" style={{ color: Colors.sway.lightGrey }}>
          {label}
        </ThemedText>
      </View>

      <View className="flex-row items-center gap-2">
        {activityPreview !== '' && (
          <ThemedText type="small" numberOfLines={1} style={{ color: Colors.sway.darkGrey, maxWidth: 110 }}>
            {activityPreview}
          </ThemedText>
        )}
        <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.sway.darkGrey} />
      </View>
    </Pressable>
  );
});

SlotAccordionRow.displayName = 'SlotAccordionRow';

export default SlotAccordionRow;
