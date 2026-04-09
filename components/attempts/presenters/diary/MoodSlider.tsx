import { memo, useCallback, useState } from 'react';
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

  if (disabled) {
    return (
      <View accessibilityLabel={value !== undefined ? `Mood: ${value}` : 'Mood: not set'} className="gap-1">
        <View className="flex-row items-center justify-between">
          <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
            Mood
          </ThemedText>
          <ThemedText type="small" style={{ color: Colors.sway.bright }}>
            {value !== undefined ? String(value) : '—'}
          </ThemedText>
        </View>
        <Slider
          value={value ?? 0}
          minimumValue={0}
          maximumValue={100}
          disabled
          minimumTrackTintColor={Colors.diary.moodCool}
          maximumTrackTintColor={Colors.chip.pill}
          thumbTintColor="transparent"
          style={styles.slider}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={displayValue !== undefined ? `Mood slider, value ${displayValue}` : 'Mood slider, not set'}
      className="gap-1"
    >
      <View className="flex-row items-center justify-between">
        <ThemedText type="small" style={{ color: Colors.sway.darkGrey }}>
          Mood
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.sway.bright }}>
          {displayValue !== undefined ? String(displayValue) : '—'}
        </ThemedText>
      </View>

      <Slider
        value={value ?? 0}
        minimumValue={0}
        maximumValue={100}
        step={1}
        tapToSeek
        onValueChange={handleValueChange}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={Colors.diary.moodCool}
        maximumTrackTintColor={Colors.chip.pill}
        thumbTintColor={Colors.sway.bright}
        style={styles.slider}
      />

      <View className="flex-row items-center justify-between">
        <ThemedText type="small" style={{ color: Colors.chip.dotInactive }}>
          Low
        </ThemedText>
        <ThemedText type="small" style={{ color: Colors.chip.dotInactive }}>
          High
        </ThemedText>
      </View>
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
