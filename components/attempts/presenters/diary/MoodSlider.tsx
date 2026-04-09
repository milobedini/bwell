import { memo, useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import Slider from '@react-native-community/slider';

const SLIDER_HEIGHT = Platform.OS === 'ios' ? 40 : 48;

type MoodSliderProps = {
  value: number | undefined;
  onChange: (value: number) => void;
  disabled: boolean;
};

const MoodSlider = memo(({ value, onChange, disabled }: MoodSliderProps) => {
  const [displayValue, setDisplayValue] = useState(value);

  // Sync displayValue when the prop changes (e.g. switching days)
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleValueChange = useCallback((v: number) => {
    setDisplayValue(Math.round(v));
  }, []);

  const handleSlidingComplete = useCallback(
    (v: number) => {
      const rounded = Math.round(v);
      setDisplayValue(rounded);
      onChange(rounded);
    },
    [onChange]
  );

  const shown = disabled ? value : displayValue;
  const shownLabel = shown !== undefined ? String(shown) : '—';
  const a11yLabel = disabled
    ? shown !== undefined
      ? `Mood: ${shown}`
      : 'Mood: not set'
    : shown !== undefined
      ? `Mood slider, value ${shown}`
      : 'Mood slider, not set';

  return (
    <View accessibilityLabel={a11yLabel} className="gap-1">
      <View className="flex-row items-center justify-between">
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          Mood
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.bright }}>
          {shownLabel}
        </ThemedText>
      </View>

      <Slider
        value={value ?? 0}
        minimumValue={0}
        maximumValue={100}
        step={disabled ? undefined : 1}
        tapToSeek={!disabled}
        disabled={disabled}
        onValueChange={disabled ? undefined : handleValueChange}
        onSlidingComplete={disabled ? undefined : handleSlidingComplete}
        minimumTrackTintColor={Colors.diary.moodCool}
        maximumTrackTintColor={Colors.chip.pill}
        thumbTintColor={disabled ? 'transparent' : Colors.sway.bright}
        style={styles.slider}
      />

      {!disabled && (
        <View className="flex-row items-center justify-between">
          <ThemedText type="small" style={{ color: Colors.chip.dotInactive }}>
            Low
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.chip.dotInactive }}>
            High
          </ThemedText>
        </View>
      )}
    </View>
  );
});

MoodSlider.displayName = 'MoodSlider';

const styles = StyleSheet.create({
  slider: {
    height: SLIDER_HEIGHT,
    marginHorizontal: Platform.OS === 'ios' ? -8 : 0
  }
});

export default MoodSlider;
