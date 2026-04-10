import { memo, useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { clamp } from '@/utils/helpers';

const MIN = 0;
const MAX = 10;
const MIDPOINT = 5;
const LONG_PRESS_DELAY = 400;
const REPEAT_INTERVAL = 150;
const PULSE_DURATION = 75;
const PULSE_SCALE = 1.15;
const HIT_SLOP = 8;

type MetricStepperProps = {
  label: string;
  value: number | undefined;
  color: string;
  onChange: (value: number) => void;
  disabled: boolean;
};

const MetricStepper = memo(({ label, value, color, onChange, disabled }: MetricStepperProps) => {
  const scale = useSharedValue(1);
  const directionRef = useRef<1 | -1 | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const animatedValueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const triggerPulse = useCallback(() => {
    if (shouldReduceMotion) return;
    scale.value = withSequence(
      withTiming(PULSE_SCALE, { duration: PULSE_DURATION }),
      withTiming(1, { duration: PULSE_DURATION })
    );
  }, [scale, shouldReduceMotion]);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (value === undefined) {
        onChange(MIDPOINT);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        triggerPulse();
        return;
      }

      const next = clamp(value + direction, MIN, MAX);
      if (next === value) return;

      onChange(next);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      triggerPulse();
    },
    [value, onChange, triggerPulse]
  );

  // Keep a ref to the latest step so the timeout chain always uses current value
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const scheduleRepeat = useCallback(() => {
    if (directionRef.current === null) return;
    stepRef.current(directionRef.current);
    setTimeout(scheduleRepeat, REPEAT_INTERVAL);
  }, []);

  const startRepeat = useCallback(
    (direction: 1 | -1) => {
      directionRef.current = direction;
      setTimeout(scheduleRepeat, REPEAT_INTERVAL);
    },
    [scheduleRepeat]
  );

  const handlePressOut = useCallback(() => {
    directionRef.current = null;
  }, []);

  const handleDecrementPress = useCallback(() => step(-1), [step]);
  const handleIncrementPress = useCallback(() => step(1), [step]);
  const handleDecrementLongPress = useCallback(() => startRepeat(-1), [startRepeat]);
  const handleIncrementLongPress = useCallback(() => startRepeat(1), [startRepeat]);

  const isNull = value === undefined;
  const displayValue = isNull ? '—' : String(value);
  const valueColor = isNull ? Colors.chip.dotInactive : color;

  if (disabled) {
    return (
      <View style={styles.container} accessibilityRole="text">
        <View style={styles.labelRow}>
          <ThemedText type="small" style={styles.label}>
            {label}
          </ThemedText>
        </View>
        <ThemedText style={[styles.value, { color: valueColor }]}>{displayValue}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText type="small" style={styles.label}>
          {label}
        </ThemedText>
      </View>
      <View style={styles.row}>
        <Pressable
          onPress={handleDecrementPress}
          onLongPress={handleDecrementLongPress}
          delayLongPress={LONG_PRESS_DELAY}
          onPressOut={handlePressOut}
          style={styles.button}
          hitSlop={HIT_SLOP}
          accessibilityLabel={`Decrease ${label}`}
          accessibilityRole="button"
        >
          <ThemedText style={styles.buttonText}>−</ThemedText>
        </Pressable>

        <Animated.Text style={[styles.value, { color: valueColor }, animatedValueStyle]}>{displayValue}</Animated.Text>

        <Pressable
          onPress={handleIncrementPress}
          onLongPress={handleIncrementLongPress}
          delayLongPress={LONG_PRESS_DELAY}
          onPressOut={handlePressOut}
          style={styles.button}
          hitSlop={HIT_SLOP}
          accessibilityLabel={`Increase ${label}`}
          accessibilityRole="button"
        >
          <ThemedText style={styles.buttonText}>+</ThemedText>
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
