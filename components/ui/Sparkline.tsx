import { memo } from 'react';
import { View } from 'react-native';
import { Colors } from '@/constants/Colors';

type SparklineProps = {
  values: number[];
  maxValue?: number;
  barCount?: number;
  maxHeight?: number;
};

const SparklineBase = ({ values, maxValue, barCount, maxHeight = 24 }: SparklineProps) => {
  const bars = barCount ? values.slice(-barCount) : values;
  const resolvedMax = Math.max(...bars, maxValue ?? 1, 1);

  return (
    <View className="flex-row items-end gap-0.5" style={{ height: maxHeight }}>
      {bars.map((value, index) => {
        const isLast = index === bars.length - 1;
        const height = Math.max(3, Math.round((value / resolvedMax) * maxHeight));
        return (
          <View
            key={index}
            style={{
              width: 4,
              height,
              borderRadius: 2,
              backgroundColor: isLast ? Colors.sway.bright : Colors.sway.darkGrey
            }}
          />
        );
      })}
    </View>
  );
};

const Sparkline = memo(SparklineBase);

export default Sparkline;
