import { memo, useCallback, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';

const MIN = 0;
const MAX = 10;
const MIDPOINT = 5;
const LONG_PRESS_DELAY = 400;
const REPEAT_INTERVAL = 150;
const PULSE_DURATION = 75;
const PULSE_SCALE = 1.15;

type MetricStepperProps = {
  label: string;
  value: number | undefined;
  color: string;
  onChange: (value: number) => void;
  disabled: boolean;
};

const MetricStepper = memo(({ label, value, color, onChange, disabled }: MetricStepperProps) => {
  const scale = useSharedValue(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const animatedValueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const triggerPulse = useCallback(() => {
    scale.value = withSequence(
      withTiming(PULSE_SCALE, { duration: PULSE_DURATION }),
      withTiming(1, { duration: PULSE_DURATION })
    );
  }, [scale]);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (value === undefined) {
        onChange(MIDPOINT);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        triggerPulse();
        return;
      }

      const next = value + direction;
      if (next < MIN || next > MAX) return;

      onChange(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      triggerPulse();
    },
    [value, onChange, triggerPulse]
  );

  const clearRepeat = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRepeat = useCallback(
    (direction: 1 | -1) => {
      clearRepeat();
      intervalRef.current = setInterval(() => {
        step(direction);
      }, REPEAT_INTERVAL);
    },
    [step, clearRepeat]
  );

  const handleLongPress = useCallback(
    (direction: 1 | -1) => () => {
      startRepeat(direction);
    },
    [startRepeat]
  );

  const handlePressOut = useCallback(() => {
    clearRepeat();
  }, [clearRepeat]);

  const handlePress = useCallback(
    (direction: 1 | -1) => () => {
      step(direction);
    },
    [step]
  );

  const isNull = value === undefined;
  const displayValue = isNull ? '—' : String(value);
  const valueColor = isNull ? Colors.chip.dotInactive : color;

  if (disabled) {
    return (
      <View style={styles.container} accessibilityRole="text">
        <View style={styles.labelRow}>
          <Animated.Text style={styles.label}>{label}</Animated.Text>
        </View>
        <Animated.Text style={[styles.value, { color: valueColor }]}>{displayValue}</Animated.Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Animated.Text style={styles.label}>{label}</Animated.Text>
      </View>
      <View style={styles.row}>
        <Pressable
          onPress={handlePress(-1)}
          onLongPress={handleLongPress(-1)}
          delayLongPress={LONG_PRESS_DELAY}
          onPressOut={handlePressOut}
          style={styles.button}
          accessibilityLabel={`Decrease ${label}`}
          accessibilityRole="button"
        >
          <Animated.Text style={styles.buttonText}>−</Animated.Text>
        </Pressable>

        <Animated.Text style={[styles.value, { color: valueColor }, animatedValueStyle]}>{displayValue}</Animated.Text>

        <Pressable
          onPress={handlePress(1)}
          onLongPress={handleLongPress(1)}
          delayLongPress={LONG_PRESS_DELAY}
          onPressOut={handlePressOut}
          style={styles.button}
          accessibilityLabel={`Increase ${label}`}
          accessibilityRole="button"
        >
          <Animated.Text style={styles.buttonText}>+</Animated.Text>
        </Pressable>
      </View>
    </View>
  );
});

MetricStepper.displayName = 'MetricStepper';

export default MetricStepper;

// StyleSheet used here because these are small, fixed-size elements with
// precise numeric values (28x28 buttons, specific font sizes) that don't
// benefit from Tailwind's utility classes.
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.sway.dark,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center'
  },
  labelRow: {
    marginBottom: 8
  },
  label: {
    color: Colors.sway.darkGrey,
    fontSize: 10,
    textAlign: 'center'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  button: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.chip.pill,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: Colors.sway.darkGrey,
    fontSize: 16,
    fontWeight: '600'
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    minWidth: 18,
    textAlign: 'center'
  }
});
