import { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const RATINGS = Array.from({ length: 11 }, (_, i) => i);

type RatingTrackProps = {
  selected: number | null;
  onSelect?: (rating: number) => void;
  disabled?: boolean;
  label?: string;
};

const RatingTrack = ({ selected, onSelect, disabled, label }: RatingTrackProps) => {
  const handleSelect = useCallback(
    (n: number) => {
      if (disabled || !onSelect) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(n);
    },
    [disabled, onSelect]
  );

  return (
    <View className="gap-2">
      {label && (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {label}
        </ThemedText>
      )}

      {/* Tappable number pills */}
      <View className="flex-row justify-between" style={{ paddingHorizontal: 2 }}>
        {RATINGS.map((n) => {
          const isSelected = selected === n;

          return (
            <Pressable
              key={n}
              disabled={disabled}
              onPress={() => handleSelect(n)}
              className="items-center justify-center active:opacity-70"
              style={{
                width: 28,
                height: 34,
                borderRadius: 8,
                backgroundColor: isSelected ? Colors.sway.bright : Colors.chip.darkCardAlt
              }}
              hitSlop={2}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${n} out of 10`}
              accessibilityState={{ selected: isSelected }}
            >
              <ThemedText
                type="smallBold"
                style={{
                  color: isSelected ? Colors.sway.dark : Colors.sway.darkGrey,
                  fontSize: 13
                }}
              >
                {n}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default RatingTrack;
