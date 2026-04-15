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

  const progress = selected !== null ? selected / 10 : 0;

  return (
    <View className="gap-2">
      {label && (
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          {label}
        </ThemedText>
      )}

      {/* Selected value display */}
      <View className="flex-row items-center gap-3">
        <View
          className="h-12 w-12 items-center justify-center rounded-xl"
          style={{
            backgroundColor: selected !== null ? Colors.sway.bright : Colors.chip.darkCardAlt,
            shadowColor: selected !== null ? Colors.sway.bright : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: selected !== null ? 0.4 : 0,
            shadowRadius: 6,
            elevation: selected !== null ? 6 : 0
          }}
        >
          <ThemedText
            type="smallTitle"
            style={{
              color: selected !== null ? Colors.sway.dark : Colors.sway.darkGrey,
              fontSize: 22
            }}
          >
            {selected !== null ? String(selected) : '—'}
          </ThemedText>
        </View>

        {/* Progress bar */}
        <View className="flex-1">
          <View className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: Colors.chip.darkCardAlt }}>
            {selected !== null && (
              <View
                className="h-full rounded-full"
                style={{
                  width: `${progress * 100}%`,
                  backgroundColor: Colors.sway.bright
                }}
              />
            )}
          </View>
        </View>

        <ThemedText type="small" style={{ color: Colors.sway.darkGrey, width: 24, textAlign: 'right' }}>
          /10
        </ThemedText>
      </View>

      {/* Dot buttons */}
      <View className="flex-row justify-between" style={{ paddingHorizontal: 2 }}>
        {RATINGS.map((n) => {
          const isSelected = selected === n;
          const isBelowSelected = selected !== null && n <= selected;

          return (
            <Pressable
              key={n}
              disabled={disabled}
              onPress={() => handleSelect(n)}
              className="items-center justify-center active:opacity-70"
              style={{ width: 28, height: 36 }}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${n} out of 10`}
              accessibilityState={{ selected: isSelected }}
            >
              <View
                style={{
                  width: isSelected ? 20 : 12,
                  height: isSelected ? 20 : 12,
                  borderRadius: isSelected ? 10 : 6,
                  backgroundColor: isSelected
                    ? Colors.sway.bright
                    : isBelowSelected
                      ? 'rgba(24,205,186,0.4)'
                      : Colors.chip.darkCardAlt,
                  borderWidth: isSelected ? 2 : 0,
                  borderColor: Colors.sway.dark
                }}
              />
              <ThemedText
                type="small"
                style={{
                  color: isSelected ? Colors.sway.bright : Colors.sway.darkGrey,
                  fontSize: 10,
                  marginTop: 2
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
