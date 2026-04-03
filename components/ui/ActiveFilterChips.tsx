import { memo } from 'react';
import { Pressable, type StyleProp, View, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

import { ThemedText } from '../ThemedText';

export type FilterChip = {
  key: string;
  label: string;
};

type ActiveFilterChipsProps = {
  chips: FilterChip[];
  onClear: (key: string) => void;
  onClearAll: () => void;
  style?: StyleProp<ViewStyle>;
};

const ActiveFilterChips = memo(({ chips, onClear, onClearAll, style }: ActiveFilterChipsProps) => {
  if (chips.length === 0) return null;

  return (
    <View className="flex-row flex-wrap items-center gap-1.5 pb-2" style={style}>
      {chips.map((c) => (
        <Pressable
          key={c.key}
          onPress={() => onClear(c.key)}
          className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
          style={{ backgroundColor: Colors.tint.teal }}
        >
          <ThemedText style={{ fontSize: 12, color: Colors.sway.bright }}>{c.label}</ThemedText>
          <ThemedText style={{ fontSize: 12, color: Colors.sway.bright, opacity: 0.6 }}>✕</ThemedText>
        </Pressable>
      ))}
      {chips.length >= 2 && (
        <Pressable onPress={onClearAll}>
          <ThemedText style={{ fontSize: 12, color: Colors.sway.darkGrey, marginLeft: 4 }}>Clear all</ThemedText>
        </Pressable>
      )}
    </View>
  );
});

ActiveFilterChips.displayName = 'ActiveFilterChips';

export default ActiveFilterChips;
