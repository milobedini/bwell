import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedProps, useDerivedValue, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const NORMAL_SIZE = 38;
const ACTIVE_SIZE = 42;
const STROKE_WIDTH = 2.5;

type ProgressRingProps = {
  dateNumber: number;
  dayLabel: string;
  filledCount: number;
  totalCount: number;
  isActive: boolean;
  onPress: () => void;
};

const ProgressRing = memo(({ dateNumber, dayLabel, filledCount, totalCount, isActive, onPress }: ProgressRingProps) => {
  const size = isActive ? ACTIVE_SIZE : NORMAL_SIZE;
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const progress = useMemo(() => (totalCount > 0 ? filledCount / totalCount : 0), [filledCount, totalCount]);

  const animatedOffset = useDerivedValue(
    () =>
      withSpring(circumference * (1 - progress), {
        damping: 15
      }),
    [circumference, progress]
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value
  }));

  const isComplete = filledCount === totalCount && totalCount > 0;
  const isEmpty = filledCount === 0;

  const dateColor = isActive
    ? Colors.sway.bright
    : isComplete
      ? Colors.sway.bright
      : isEmpty
        ? Colors.chip.dotInactive
        : Colors.sway.lightGrey;

  const labelColor = isActive ? Colors.sway.bright : Colors.sway.darkGrey;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${dayLabel} ${dateNumber}, ${filledCount} of ${totalCount} slots filled`}
      className="items-center gap-1"
      style={{ minWidth: ACTIVE_SIZE }}
    >
      <ThemedText type="small" style={{ color: labelColor }}>
        {dayLabel}
      </ThemedText>
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2
          },
          isActive && {
            backgroundColor: Colors.tint.teal,
            borderWidth: 1,
            borderColor: Colors.tint.tealBorder
          }
        ]}
        className="items-center justify-center"
      >
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Track circle */}
          <Circle cx={center} cy={center} r={radius} stroke={Colors.chip.pill} strokeWidth={STROKE_WIDTH} fill="none" />
          {/* Fill circle */}
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={Colors.sway.bright}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
        <ThemedText type="small" style={{ color: dateColor }}>
          {String(dateNumber)}
        </ThemedText>
      </View>
    </Pressable>
  );
});

ProgressRing.displayName = 'ProgressRing';

export { ProgressRing };
