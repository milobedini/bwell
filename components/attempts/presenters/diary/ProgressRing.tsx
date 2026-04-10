import { memo, useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';

const NORMAL_SIZE = 38;
const ACTIVE_SIZE = 42;
const STROKE_WIDTH = 2.5;

type ProgressRingProps = {
  iso: string;
  dateNumber: number;
  dayLabel: string;
  filledCount: number;
  totalCount: number;
  isActive: boolean;
  onSelectDay: (iso: string) => void;
};

const ProgressRing = memo(
  ({ iso, dateNumber, dayLabel, filledCount, totalCount, isActive, onSelectDay }: ProgressRingProps) => {
    const handlePress = useCallback(() => onSelectDay(iso), [onSelectDay, iso]);
    const size = isActive ? ACTIVE_SIZE : NORMAL_SIZE;
    const radius = (size - STROKE_WIDTH) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    const progress = useMemo(() => (totalCount > 0 ? filledCount / totalCount : 0), [filledCount, totalCount]);

    const strokeDashoffset = circumference * (1 - progress);

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
        onPress={handlePress}
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
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={Colors.chip.pill}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={Colors.sway.bright}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
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
  }
);

ProgressRing.displayName = 'ProgressRing';

export { ProgressRing };
